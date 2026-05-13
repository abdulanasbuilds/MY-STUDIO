# MY STUDIO — clipper_pipeline.py
import os
import subprocess
from db import update_job_status, get_supabase
from storage import upload_video
from intelligence.viral_scorer import find_viral_moments

def run_clipper_pipeline(data: dict) -> list[dict]:
    """
    Main clipper pipeline.
    Returns list of clip metadata dicts with Cloudinary URLs.
    """
    job_id = data["job_id"]
    user_id = data["user_id"]
    source_url = data["source_url"]
    settings = data.get("settings", {})
    max_clips = settings.get("max_clips", 5)
    min_duration = settings.get("min_duration", 30)
    max_duration = settings.get("max_duration", 90)
    platforms = settings.get("platforms", ["tiktok"])
    caption_style = settings.get("caption_style", "hormozi")
    crop_mode = settings.get("crop_mode", "track")
    hook_overlay = settings.get("hook_overlay", True)
    custom_instructions = data.get("custom_instructions")
    
    temp_dir = f"/tmp/nexus/clip_{job_id}"
    os.makedirs(temp_dir, exist_ok=True)
    temp_files = []
    
    try:
        # STEP 1: Download/ingest source video
        update_job_status(job_id, "processing", "ingesting", 5)
        video_path = download_video(source_url, temp_dir)
        temp_files.append(video_path)
        
        # STEP 2: Transcribe with WhisperX (word-level)
        update_job_status(job_id, "processing", "transcribing", 15)
        transcript = transcribe_with_whisperx(video_path, job_id)
        
        # STEP 3: Scene detection
        update_job_status(job_id, "processing", "analyzing_scenes", 25)
        scenes = detect_scenes(video_path)
        
        # STEP 4: Face tracking analysis
        update_job_status(job_id, "processing", "tracking_faces", 35)
        from models.mediapipe_tracker import track_face_positions, smooth_positions, detect_speaker_count
        speaker_count = detect_speaker_count(video_path)
        face_positions = track_face_positions(video_path)
        face_positions = smooth_positions(face_positions)
        
        # STEP 5: Find viral moments with Gemini
        update_job_status(job_id, "processing", "finding_moments", 50)
        moments = find_viral_moments(
            transcript=transcript,
            scenes=scenes,
            face_data=face_positions,
            max_clips=max_clips,
            min_duration=min_duration,
            max_duration=max_duration,
            custom_instructions=custom_instructions,
            job_id=job_id
        )
        
        if not moments:
            update_job_status(job_id, "failed", "No viral moments found in video")
            return []
        
        # STEP 6: Generate each clip
        clips = []
        total_moments = len(moments)
        
        for i, moment in enumerate(moments):
            clip_progress = 50 + int((i / total_moments) * 40)
            update_job_status(job_id, "processing", f"creating_clip_{i+1}_of_{total_moments}", clip_progress)
            
            clip_data = generate_single_clip(
                video_path=video_path,
                moment=moment,
                transcript=transcript,
                face_positions=face_positions,
                speaker_count=speaker_count,
                settings=settings,
                job_id=job_id,
                clip_index=i,
                temp_dir=temp_dir
            )
            
            if clip_data:
                save_clip_to_db(user_id, job_id, clip_data)
                clips.append(clip_data)
                temp_files.extend(clip_data.get("temp_files", []))
        
        update_job_status(job_id, "complete", "done", 100, output_metadata={"clips_generated": len(clips)})
        return clips
        
    except Exception as e:
        update_job_status(job_id, "failed", str(e)[:500])
        raise
    finally:
        for f in temp_files:
            try: os.remove(f)
            except: pass

def download_video(url: str, temp_dir: str) -> str:
    """Download video using yt-dlp. Returns local file path."""
    output_path = f"{temp_dir}/source.mp4"
    result = subprocess.run([
        "yt-dlp",
        "--format", "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]",
        "--output", output_path,
        "--no-playlist",
        "--quiet",
        url
    ], capture_output=True, text=True)
    if result.returncode != 0:
        raise ValueError(f"Download failed: {result.stderr[:200]}")
    return output_path

def transcribe_with_whisperx(video_path: str, job_id: str) -> list[dict]:
    """Transcribe video with WhisperX for word-level timestamps."""
    import whisperx
    model = whisperx.load_model("large-v3", device="cuda", compute_type="float16", download_root="/models/whisper/")
    audio = whisperx.load_audio(video_path)
    result = model.transcribe(audio, batch_size=16)
    
    model_a, metadata = whisperx.load_align_model(language_code=result["language"], device="cuda")
    result = whisperx.align(result["segments"], model_a, metadata, audio, "cuda")
    
    words = []
    for segment in result["segments"]:
        for word_info in segment.get("words", []):
            words.append({
                "word": word_info["word"].strip(),
                "start": word_info.get("start", 0),
                "end": word_info.get("end", 0),
                "speaker": segment.get("speaker", "SPEAKER_0")
            })
    return words

def detect_scenes(video_path: str) -> list[dict]:
    from scenedetect import detect, ContentDetector
    scene_list = detect(video_path, ContentDetector())
    return [{"start": s[0].get_seconds(), "end": s[1].get_seconds()} for s in scene_list]

def generate_single_clip(video_path, moment, transcript, face_positions, speaker_count, settings, job_id, clip_index, temp_dir) -> dict | None:
    from models.mediapipe_tracker import crop_to_vertical_tracking, crop_split_screen, crop_smart_center
    
    caption_style = settings.get("caption_style", "hormozi")
    platforms = settings.get("platforms", ["tiktok"])
    base = f"{temp_dir}/clip_{clip_index}"
    
    try:
        raw = f"{base}_raw.mp4"
        duration = moment["end"] - moment["start"]
        subprocess.run(["ffmpeg", "-y", "-ss", str(moment["start"]), "-i", video_path, "-t", str(duration), "-c:v", "libx264", "-c:a", "aac", raw], check=True)
        
        if speaker_count == 2:
            cropped = crop_split_screen(raw, f"{base}_cropped.mp4")
        else:
            cropped = crop_to_vertical_tracking(raw, f"{base}_cropped.mp4")
        
        clip_words = [w for w in transcript if w["start"] >= moment["start"] and w["end"] <= moment["end"]]
        captioned = render_captions_remotion(cropped, clip_words, caption_style, f"{base}_captioned.mp4")
        
        titles = generate_clip_titles(moment, 3)
        hashtags = generate_clip_hashtags(moment, platforms)
        
        exports = {}
        for platform in platforms:
            url = upload_video(captioned, f"{job_id}_clip{clip_index}_{platform}", f"nexus/clips/{platform}")
            exports[platform] = url
        
        return {
            "start_seconds": moment["start"],
            "end_seconds": moment["end"],
            "duration_seconds": duration,
            "viral_score": moment.get("score_estimate", 0.5),
            "hook_type": moment.get("hook_type", "unknown"),
            "viral_triggers": moment.get("viral_triggers", []),
            "one_line_reason": moment.get("reason", ""),
            "transcript": " ".join([w["word"] for w in clip_words]),
            "hook_text": moment.get("hook_text", ""),
            "generated_titles": titles,
            "generated_hashtags": hashtags,
            "exports": exports,
            "caption_style": caption_style,
            "temp_files": [raw, cropped, captioned]
        }
    except Exception as e:
        print(f"[JOB {job_id[:8]}] Clip {clip_index} failed: {e}")
        return None

def render_captions_remotion(video_path: str, words: list[dict], style: str, output_path: str) -> str:
    """Burn subtitles with FFmpeg as fallback if Remotion is not available"""
    import tempfile
    srt_content = []
    for i, w in enumerate(words):
        h1, m1, s1 = int(w['start']//3600), int((w['start']%3600)//60), w['start']%60
        h2, m2, s2 = int(w['end']//3600), int((w['end']%3600)//60), w['end']%60
        srt_content.append(f"{i+1}\n{h1:02d}:{m1:02d}:{s1:06.3f} --> {h2:02d}:{m2:02d}:{s2:06.3f}\n{w['word']}\n".replace('.', ','))
    
    srt_path = tempfile.mktemp(suffix=".srt")
    with open(srt_path, "w") as f:
        f.write("\n".join(srt_content))
    
    subprocess.run(["ffmpeg", "-y", "-i", video_path, "-vf", f"subtitles={srt_path}", "-c:a", "copy", output_path], check=True)
    os.remove(srt_path)
    return output_path

def generate_clip_titles(moment: dict, count: int) -> list[str]:
    import google.generativeai as genai
    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = f"Generate {count} short viral titles for this transcript: {moment.get('transcript_text', '')[:300]}. Return JSON array only: [\"title1\"]."
    try:
        res = model.generate_content(prompt).text.strip()
        import json
        return json.loads(res[7:-3] if res.startswith("```json") else res)
    except:
        return ["This moment will change everything", "Watch till the end", "Incredible insight"]

def generate_clip_hashtags(moment: dict, platforms: list[str]) -> dict:
    return {"tiktok": ["#viral", "#fyp"], "instagram": ["#reels"], "youtube": ["#shorts"]}

def save_clip_to_db(user_id: str, job_id: str, clip_data: dict) -> None:
    db = get_supabase()
    db.table("content_clips").insert({
        "user_id": user_id,
        "source_job_id": job_id,
        "start_seconds": clip_data["start_seconds"],
        "end_seconds": clip_data["end_seconds"],
        "duration_seconds": clip_data["duration_seconds"],
        "viral_score": clip_data["viral_score"],
        "transcript": clip_data["transcript"],
        "hook_text": clip_data["hook_text"],
        "generated_titles": clip_data["generated_titles"],
        "generated_hashtags": clip_data["generated_hashtags"],
        "file_tiktok_url": clip_data["exports"].get("tiktok"),
        "status": "complete",
        "caption_style": clip_data["caption_style"],
    }).execute()
