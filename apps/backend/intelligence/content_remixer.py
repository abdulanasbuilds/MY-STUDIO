# MY STUDIO — content_remixer.py
import os
import json
import google.generativeai as genai

def analyze_viral_video(video_url: str, job_id: str) -> dict:
    """Download and deeply analyze why a video went viral."""
    import tempfile, subprocess
    from db import update_job_status
    
    temp_dir = f"/tmp/nexus/remix_{job_id}"
    os.makedirs(temp_dir, exist_ok=True)
    
    update_job_status(job_id, "processing", "downloading", 10)
    video_path = f"{temp_dir}/source.mp4"
    subprocess.run(["yt-dlp", "-f", "best[ext=mp4]", "-o", video_path, "--quiet", video_url], check=True)
    
    update_job_status(job_id, "processing", "transcribing", 25)
    import whisperx
    model = whisperx.load_model("large-v3", device="cuda", compute_type="float16", download_root="/models/whisper/")
    audio = whisperx.load_audio(video_path)
    result = model.transcribe(audio, batch_size=16)
    
    full_transcript = " ".join([w["word"] for seg in result["segments"] for w in seg.get("words", [])])
    
    update_job_status(job_id, "processing", "analyzing_audio", 40)
    import librosa
    y, sr = librosa.load(video_path, sr=None)
    duration = librosa.get_duration(y=y, sr=sr)
    
    update_job_status(job_id, "processing", "generating_analysis", 70)
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model_ai = genai.GenerativeModel("gemini-1.5-pro")
    
    why_prompt = f"""
You are a viral content strategist. Analyze why this video went viral.
FULL TRANSCRIPT: {full_transcript[:3000]}
Duration: {duration:.0f} seconds

Return ONLY valid JSON (no markdown):
{{
  "why_it_worked": "2-3 sentence explanation",
  "hook_type": "question|shock|story",
  "story_arc": "PAS|AIDA",
  "hook_first_words": "exact first 7 words",
  "viral_score_estimate": 0.85
}}
"""
    try:
        resp = model_ai.generate_content(why_prompt).text.strip()
        analysis = json.loads(resp[7:-3] if resp.startswith("```json") else resp)
    except:
        analysis = {
            "why_it_worked": "Strong opening hook",
            "hook_type": "unknown", "story_arc": "unknown",
            "hook_first_words": full_transcript[:40], "viral_score_estimate": 0.6
        }
    
    import shutil
    shutil.rmtree(temp_dir, ignore_errors=True)
    update_job_status(job_id, "processing", "analysis_complete", 85)
    
    return {"analysis": analysis, "transcript_preview": full_transcript[:500], "duration_seconds": duration}

def generate_remix_scripts(analysis: dict, user_niche: str, user_audience: str, user_voice: str, remix_goal: str, target_platform: str, target_duration: int, job_id: str) -> dict:
    from db import update_job_status
    update_job_status(job_id, "processing", "writing_scripts", 90)
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel("gemini-1.5-pro")
    
    base_prompt = f"""
ORIGINAL VIDEO ANALYSIS: {analysis['analysis'].get('why_it_worked', '')}
CREATOR CONTEXT:
Niche: {user_niche}, Audience: {user_audience}, Voice: {user_voice}
Goal: {remix_goal}
Write ONLY the script words to speak aloud. No headers.
"""
    scripts = {}
    scripts["v1"] = model.generate_content(base_prompt).text.strip()
    scripts["v2"] = model.generate_content(base_prompt + "\nMake this 30% shorter.").text.strip()
    scripts["v3"] = model.generate_content(base_prompt + "\nProfessional LinkedIn angle.").text.strip()
    return scripts
