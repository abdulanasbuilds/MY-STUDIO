# MY STUDIO — postproduction/caption_engine.py
import subprocess
import json
import os

def render_captions(video, transcript, style, output) -> str:
    import tempfile
    words_file = tempfile.mktemp(suffix=".json")
    with open(words_file, "w") as f:
        json.dump({"words": transcript, "videoPath": video}, f)
    
    style_map = {
        "hormozi": "HormoziStyle",
        "netflix": "NetflixStyle",
        "tiktok": "TikTokPop",
        "news": "BreakingNews"
    }
    composition = style_map.get(style, "HormoziStyle")
    
    res = subprocess.run(["npx", "remotion", "render", "remotion/index.ts", composition, output, "--props", words_file], capture_output=True)
    os.remove(words_file)
    if res.returncode != 0:
        return burn_subtitles(video, _generate_srt(transcript), output)
    return output

def get_transcript(video) -> list[dict]:
    import whisperx
    model = whisperx.load_model("large-v3", device="cuda", compute_type="float16")
    audio = whisperx.load_audio(video)
    result = model.transcribe(audio, batch_size=16)
    model_a, metadata = whisperx.load_align_model(language_code=result["language"], device="cuda")
    aligned = whisperx.align(result["segments"], model_a, metadata, audio, "cuda")
    words = []
    for segment in aligned["segments"]:
        for w in segment.get("words", []):
            words.append({"word": w["word"], "start": w.get("start", 0), "end": w.get("end", 0), "speaker": segment.get("speaker", "SPEAKER_0")})
    return words

def burn_subtitles(video, srt_file, output) -> str:
    subprocess.run(["ffmpeg", "-y", "-i", video, "-vf", f"subtitles={srt_file}", "-c:a", "copy", output], check=True)
    return output

def _generate_srt(words: list[dict]) -> str:
    import tempfile
    srt_content = []
    for i, w in enumerate(words):
        h1, m1, s1 = int(w['start']//3600), int((w['start']%3600)//60), w['start']%60
        h2, m2, s2 = int(w['end']//3600), int((w['end']%3600)//60), w['end']%60
        srt_content.append(f"{i+1}\n{h1:02d}:{m1:02d}:{s1:06.3f} --> {h2:02d}:{m2:02d}:{s2:06.3f}\n{w['word']}\n".replace('.', ','))
    
    srt_path = tempfile.mktemp(suffix=".srt")
    with open(srt_path, "w") as f:
        f.write("\n".join(srt_content))
    return srt_path
