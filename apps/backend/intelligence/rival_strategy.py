# MY STUDIO — intelligence/rival_strategy.py
import os
import json
import google.generativeai as genai
from db import get_supabase

def generate_content_gap_report(rival_id: str, user_id: str) -> dict:
    db = get_supabase()
    rival_posts = db.table("rival_posts").select("title,views").eq("rival_id", rival_id).execute().data
    my_content = db.table("content_library").select("title").eq("user_id", user_id).execute().data
    
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel("gemini-1.5-pro")
    
    prompt = f"""
Find content gaps. What do they cover successfully that I don't?
Rival posts: {json.dumps(rival_posts[:20])}
My content: {json.dumps(my_content[:20])}

Return ONLY JSON:
{{
  "gaps": ["Topic 1", "Topic 2"],
  "opportunity_scores": {{"Topic 1": "HIGH", "Topic 2": "MEDIUM"}},
  "suggested_titles": ["Title 1", "Title 2"]
}}
"""
    try:
        res = model.generate_content(prompt).text.strip()
        return json.loads(res[7:-3] if res.startswith("```json") else res)
    except:
        return {"gaps": [], "opportunity_scores": {}, "suggested_titles": []}

def generate_counter_content_strategy(rival_post_id: str, user_id: str) -> dict:
    db = get_supabase()
    post = db.table("rival_posts").select("*").eq("id", rival_post_id).execute().data[0]
    
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel("gemini-1.5-pro")
    
    prompt = f"""
Generate counter-strategy for this viral post: {post['title']}
Return JSON:
{{
  "strategies": [
    {{"approach": "Counter-Narrative", "script": "..."}},
    {{"approach": "Better Format", "script": "..."}}
  ]
}}
"""
    try:
        res = model.generate_content(prompt).text.strip()
        return json.loads(res[7:-3] if res.startswith("```json") else res)
    except:
        return {"strategies": []}

def predict_rival_content_calendar(rival_id: str) -> list:
    db = get_supabase()
    posts = db.table("rival_posts").select("title,posted_at").eq("rival_id", rival_id).order("posted_at", desc=True).limit(20).execute().data
    
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    prompt = f"""
Predict their next 5 posts based on pattern:
{json.dumps(posts)}

Return JSON array of dicts: [ {{"topic": "...", "expected_timing": "...", "confidence": 85}} ]
"""
    try:
        res = model.generate_content(prompt).text.strip()
        return json.loads(res[7:-3] if res.startswith("```json") else res)
    except:
        return []
