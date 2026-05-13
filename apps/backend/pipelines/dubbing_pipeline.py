# MY STUDIO — dubbing_pipeline.py
import os
import subprocess
import tempfile
from db import update_job_status, save_to_library
from storage import upload_video

NLLB_LANG_MAP = {
    "en": "eng_Latn", "fr": "fra_Latn", "es": "spa_Latn", "ar": "arb_Arab",
    "zh": "zho_Hans", "de": "deu_Latn", "pt": "por_Latn", "hi": "hin_Deva",
    "ha": "hau_Latn", "sw": "swh_Latn", "yo": "yor_Latn", "ig": "ibo_Latn",
    "tw": "twi_Latn", "ko": "kor_Hang", "ja": "jpn_Jpan", "ru": "rus_Cyrl",
    "tr": "tur_Latn", "vi": "vie_Latn", "th": "tha_Thai", "id": "ind_Latn",
}

def run_dubbing_pipeline(data: dict) -> str:
    job_id = data["job_id"]
    user_id = data["user_id"]
    video_url = data["video_url"]
    source_lang = data.get("source_lang", None)
    target_lang = data["target_lang"]
    options = data.get("options", {})
    
    preserve_background = options.get("preserve_background", True)
    do_lip_sync = options.get("lip_sync", True)
    clone_voice = options.get("clone_voice", True)
    
    temp_dir = tempfile.mkdtemp(prefix=f"nexus_dub_{job_id}_")
    temp_files = []
    
    try:
        update_job_status(job_id, "processing", "downloading", 8)
        video_path = f"{temp_dir}/source.mp4"
        subprocess.run([
            "yt-dlp", "-f", "bestvideo[ext=mp4]+bestaudio",
            "--merge-output-format", "mp4", "-o", video_path, "--quiet", video_url
        ], check=True)
        temp_files.append(video_path)
        
        update_job_status(job_id, "processing", "separating_audio", 18)
        voice_path, music_path, effects_path = separate_audio_stems(video_path, temp_dir)
        temp_files.extend([voice_path, music_path, effects_path])
        
        update_job_status(job_id, "processing", "transcribing", 28)
        transcript_segments, detected_lang = transcribe_voice(voice_path, source_lang)
        actual_source_lang = source_lang or detected_lang
        
        update_job_status(job_id, "processing", "translating", 40)
        translated_segments = translate_segments(transcript_segments, actual_source_lang, target_lang)
        
        update_job_status(job_id, "processing", "cloning_voice", 52)
        speaker_model = clone_speaker_voice(voice_path, target_lang, temp_dir) if clone_voice else None
        
        update_job_status(job_id, "processing", "synthesizing_speech", 64)
        dubbed_audio = synthesize_translated_speech(translated_segments, transcript_segments, speaker_model, target_lang, f"{temp_dir}/dubbed_audio.wav")
        temp_files.append(dubbed_audio)
        
        update_job_status(job_id, "processing", "syncing_lips", 74)
        if do_lip_sync:
            lip_synced_video = apply_lip_sync(video_path, dubbed_audio, f"{temp_dir}/lip_synced.mp4")
        else:
            lip_synced_video = video_path
        temp_files.append(lip_synced_video)
        
        update_job_status(job_id, "processing", "mixing_audio", 84)
        final_video = remix_audio_tracks(lip_synced_video, dubbed_audio, music_path if preserve_background else None, effects_path if preserve_background else None, f"{temp_dir}/dubbed_final.mp4")
        temp_files.append(final_video)
        
        update_job_status(job_id, "processing", "finalizing", 92)
        from postproduction.human_feel import process_video
        polished = process_video(final_video, f"{temp_dir}/polished.mp4", {"content_type": "dubbed_video"})
        
        video_url_out = upload_video(polished, job_id, "nexus/dubbed")
        save_to_library(user_id, job_id, f"Dubbed video ({target_lang})", "dubbing", video_url_out, duration_seconds=0)
        update_job_status(job_id, "complete", "done", 100, video_url_out)
        return video_url_out
        
    except Exception as e:
        update_job_status(job_id, "failed", str(e)[:500])
        raise
    finally:
        for f in temp_files:
            try: os.remove(f)
            except: pass
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)

def separate_audio_stems(video_path: str, temp_dir: str) -> tuple[str, str, str]:
    import torch, torchaudio
    from demucs.pretrained import get_model
    from demucs.apply import apply_model
    
    model = get_model("htdemucs")
    model.eval()
    waveform, sr = torchaudio.load(video_path)
    
    with torch.no_grad():
        sources = apply_model(model, waveform.unsqueeze(0), overlap=0.25)[0]
    
    vocals = sources[3]; music = sources[1] + sources[0]; effects = sources[2]
    voice_path = f"{temp_dir}/vocals.wav"
    music_path = f"{temp_dir}/music.wav"
    effects_path = f"{temp_dir}/effects.wav"
    
    torchaudio.save(voice_path, vocals, sr)
    torchaudio.save(music_path, music, sr)
    torchaudio.save(effects_path, effects, sr)
    return voice_path, music_path, effects_path

def transcribe_voice(voice_path: str, language: str | None) -> tuple[list, str]:
    import whisperx
    model = whisperx.load_model("large-v3", device="cuda", compute_type="float16", download_root="/models/whisper/")
    audio = whisperx.load_audio(voice_path)
    result = model.transcribe(audio, batch_size=16, language=language)
    detected_lang = result.get("language", "en")
    
    model_a, metadata = whisperx.load_align_model(language_code=detected_lang, device="cuda")
    aligned = whisperx.align(result["segments"], model_a, metadata, audio, "cuda")
    return aligned["segments"], detected_lang

def translate_segments(segments: list, source_lang: str, target_lang: str) -> list:
    from transformers import pipeline
    src_code = NLLB_LANG_MAP.get(source_lang, "eng_Latn")
    tgt_code = NLLB_LANG_MAP.get(target_lang, "fra_Latn")
    translator = pipeline("translation", model="facebook/nllb-200-distilled-600M", src_lang=src_code, tgt_lang=tgt_code, device=0)
    
    translated = []
    for segment in segments:
        original_text = segment.get("text", "").strip()
        if not original_text: continue
        result = translator(original_text, max_length=512)
        translated.append({
            "original": original_text, "translated": result[0]["translation_text"],
            "start": segment["start"], "end": segment["end"], "duration": segment["end"] - segment["start"]
        })
    return translated

def clone_speaker_voice(voice_path: str, target_lang: str, temp_dir: str) -> str:
    speaker_ref = f"{temp_dir}/speaker_ref.wav"
    subprocess.run(["ffmpeg", "-i", voice_path, "-t", "30", "-ar", "22050", "-ac", "1", "-y", speaker_ref], capture_output=True)
    return speaker_ref

def synthesize_translated_speech(translated_segments: list, original_segments: list, speaker_model: str | None, target_lang: str, output_path: str) -> str:
    from TTS.api import TTS
    import numpy as np
    import soundfile as sf
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=True)
    xtts_lang_map = {"en": "en", "fr": "fr", "es": "es", "de": "de", "zh": "zh-cn", "ar": "ar", "ja": "ja", "ko": "ko", "pt": "pt", "hi": "hi", "tr": "tr", "ru": "ru", "ha": "fr", "sw": "en"}
    xtts_lang = xtts_lang_map.get(target_lang, "en")
    
    audio_segments = []
    sample_rate = 24000
    for segment in translated_segments:
        if speaker_model: wav = tts.tts(text=segment["translated"], language=xtts_lang, speaker_wav=speaker_model)
        else: wav = tts.tts(text=segment["translated"], language=xtts_lang)
        
        wav_array = np.array(wav)
        if audio_segments:
            last_end = translated_segments[len(audio_segments)-1]["end"]
            gap = max(0, segment["start"] - last_end)
            if gap > 0.05: audio_segments.append(np.zeros(int(gap * sample_rate)))
        elif segment["start"] > 0:
            audio_segments.append(np.zeros(int(segment["start"] * sample_rate)))
        audio_segments.append(wav_array)
    
    full_audio = np.concatenate(audio_segments) if audio_segments else np.zeros(sample_rate)
    sf.write(output_path, full_audio, sample_rate)
    return output_path

def apply_lip_sync(video_path: str, dubbed_audio_path: str, output_path: str) -> str:
    result = subprocess.run([
        "python", "/models/musetalk/inference.py", "--video_path", video_path,
        "--audio_path", dubbed_audio_path, "--output_path", output_path, "--use_float16"
    ], capture_output=True)
    if result.returncode != 0 or not os.path.exists(output_path):
        subprocess.run(["ffmpeg", "-i", video_path, "-i", dubbed_audio_path, "-c:v", "copy", "-map", "0:v", "-map", "1:a", "-shortest", "-y", output_path], check=True)
    return output_path

def remix_audio_tracks(video_path: str, dubbed_audio: str, music_path: str | None, effects_path: str | None, output_path: str) -> str:
    inputs = ["-i", video_path, "-i", dubbed_audio]
    filter_parts = ["[0:v]copy[v]", "[1:a]volume=1.0[dub]"]
    mix_inputs = "[dub]"
    mix_count = 1
    
    if music_path and os.path.exists(music_path):
        inputs.extend(["-i", music_path])
        filter_parts.append(f"[{mix_count+1}:a]volume=0.3[music]")
        mix_inputs += "[music]"
        mix_count += 1
    if effects_path and os.path.exists(effects_path):
        inputs.extend(["-i", effects_path])
        filter_parts.append(f"[{mix_count+1}:a]volume=0.5[fx]")
        mix_inputs += "[fx]"
        mix_count += 1
    
    filter_parts.append(f"{mix_inputs}amix=inputs={mix_count}:normalize=0[audio]")
    subprocess.run([
        "ffmpeg", *inputs, "-filter_complex", ";".join(filter_parts),
        "-map", "[v]", "-map", "[audio]", "-c:v", "libx264", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k", "-shortest", "-y", output_path
    ], check=True)
    return output_path
