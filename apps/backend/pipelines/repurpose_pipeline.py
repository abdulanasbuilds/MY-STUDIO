# MY STUDIO — pipelines/repurpose_pipeline.py
import google.generativeai as genai
import os
import json
from db import update_job_status, save_to_library

def run_repurpose_pipeline(data: dict) -> dict:
    job_id = data["job_id"]
    user_id = data["user_id"]
    video_url = data["video_url"]
    
    update_job_status(job_id, "processing", "downloading", 10)
    import subprocess
    video_path = f"/tmp/repurpose_{job_id}.mp4"
    subprocess.run(["yt-dlp", "-f", "best[ext=mp4]", "-o", video_path, video_url], check=True)
    
    update_job_status(job_id, "processing", "transcribing", 30)
    import whisperx
    model = whisperx.load_model("large-v3", device="cuda", compute_type="float16")
    audio = whisperx.load_audio(video_path)
    result = model.transcribe(audio, batch_size=16)
    transcript = " ".join([seg["text"] for seg in result["segments"]])
    
    update_job_status(job_id, "processing", "generating_formats", 60)
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    llm = genai.GenerativeModel("gemini-1.5-pro")
    
    prompt = f"""
Repurpose this transcript into:
1. LinkedIn Post
2. Twitter Thread
3. Newsletter Section

Transcript: {transcript[:5000]}

Return JSON:
{{
  "format_convert": {{
    "linkedin_post": "...",
    "twitter_thread": "...",
    "email_newsletter": "..."
  }}
}}
"""
    res = llm.generate_content(prompt).text.strip()
    try:
        formats = json.loads(res[7:-3] if res.startswith("```json") else res)
    except:
        formats = {"format_convert": {}}
        
    update_job_status(job_id, "complete", "done", 100, output_metadata=formats)
    return formats
