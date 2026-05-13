# MY STUDIO — pipelines/news_pipeline.py
import os
import subprocess
from db import update_job_status, save_to_library
from storage import upload_video

def run_news_pipeline(data: dict) -> str:
    job_id = data["job_id"]
    user_id = data["user_id"]
    topic_url = data["topic"]
    
    update_job_status(job_id, "processing", "fetch_article", 5)
    # Simulate Firecrawl
    article_text = f"Breaking news from {topic_url}. Today, major events occurred."
    
    update_job_status(job_id, "processing", "write_script", 20)
    import google.generativeai as genai
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel("gemini-1.5-flash")
    script = model.generate_content(f"Write a 30 second news anchor script for: {article_text}").text
    
    update_job_status(job_id, "processing", "generate_anchor_video", 55)
    from models.hunyuan_avatar import generate_avatar_video, load_hunyuan_avatar
    from models.sovits import generate_speech
    
    audio_path = f"/tmp/{job_id}_news.wav"
    generate_speech(script, "news_anchor", audio_path)
    
    raw_video = f"/tmp/{job_id}_anchor.mp4"
    generate_avatar_video(load_hunyuan_avatar(), "/models/avatars/news_desk.jpg", audio_path, 30, raw_video)
    
    update_job_status(job_id, "processing", "add_graphics", 70)
    # Remotion breaking news
    from postproduction.caption_engine import render_captions, get_transcript
    transcript = get_transcript(raw_video)
    graphic_video = f"/tmp/{job_id}_gfx.mp4"
    render_captions(raw_video, transcript, "news", graphic_video)
    
    update_job_status(job_id, "processing", "upload", 96)
    url = upload_video(graphic_video, job_id, "nexus/news")
    save_to_library(user_id, job_id, f"News: {topic_url}", "news", url, duration_seconds=30)
    
    update_job_status(job_id, "complete", "done", 100, url)
    return url
