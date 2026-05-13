# MY STUDIO — competitor_spy.py
import os
import json
import google.generativeai as genai
from db import update_job_status, get_supabase
from storage import upload_image

def analyze_youtube_channel(channel_url: str, rival_id: str, user_id: str, job_id: str) -> dict:
    import subprocess
    update_job_status(job_id, "processing", "fetching_channel", 10)
    
    result = subprocess.run([
        "yt-dlp", "--flat-playlist", "--dump-json", "--playlist-end", "50", "--quiet", channel_url
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        raise ValueError(f"Cannot access channel: {result.stderr[:100]}")
    
    videos = []
    for line in result.stdout.strip().split('\n'):
        if line:
            try: videos.append(json.loads(line))
            except: pass
    
    update_job_status(job_id, "processing", "scoring_videos", 30)
    scored_videos = []
    for v in videos[:50]:
        view_count = v.get("view_count", 0)
        like_count = v.get("like_count", 0)
        comment_count = v.get("comment_count", 0)
        
        upload_date = v.get("upload_date", "")
        if upload_date and len(upload_date) == 8:
            from datetime import datetime
            uploaded = datetime.strptime(upload_date, "%Y%m%d")
            hours_old = max(1, (datetime.now() - uploaded).total_seconds() / 3600)
        else:
            hours_old = 720
        
        views_per_hour = view_count / hours_old
        engagement_rate = ((like_count + comment_count) / view_count * 100) if view_count > 0 else 0
        avg_views = sum(vv.get("view_count", 0) for vv in videos[:10]) / max(1, len(videos[:10]))
        est_subs = avg_views * 100
        is_popping_off = views_per_hour > (est_subs * 0.01)
        viral_score = min(1.0, (views_per_hour / 10000) * 0.5 + (engagement_rate / 10) * 0.5)
        
        scored_videos.append({
            "post_url": f"https://youtube.com/watch?v={v.get('id', '')}",
            "thumbnail_url": v.get("thumbnail"),
            "title": v.get("title", ""),
            "views": view_count, "likes": like_count, "comments": comment_count, "shares": 0,
            "engagement_rate": round(engagement_rate, 2), "views_per_hour": round(views_per_hour, 1),
            "is_viral": view_count > 500_000, "is_popping_off": is_popping_off,
            "viral_score": round(viral_score, 3), "posted_at": v.get("upload_date"),
        })
    
    update_job_status(job_id, "processing", "analyzing_patterns", 60)
    scored_videos.sort(key=lambda x: x["viral_score"], reverse=True)
    top_videos = scored_videos[:10]
    patterns = analyze_patterns_with_gemini(top_videos, scored_videos, channel_url, job_id)
    
    update_job_status(job_id, "processing", "saving_results", 85)
    db = get_supabase()
    for video in scored_videos:
        try:
            db.table("rival_posts").upsert({
                "rival_id": rival_id, "user_id": user_id, "post_url": video["post_url"],
                "thumbnail_url": video.get("thumbnail_url"), "title": video.get("title"),
                "views": video["views"], "likes": video["likes"], "comments": video["comments"],
                "engagement_rate": video["engagement_rate"], "views_per_hour": video["views_per_hour"],
                "is_viral": video["is_viral"], "is_popping_off": video["is_popping_off"],
                "viral_score": video["viral_score"], "posted_at": video.get("posted_at"),
            }, on_conflict="post_url").execute()
        except Exception as e:
            print(f"Failed to save post: {e}")
            
    if rival_id:
        db.table("rival_profiles").update({
            "analysis_data": patterns, "last_analyzed_at": "now()",
            "avg_views_per_post": int(sum(v["views"] for v in scored_videos) / max(1, len(scored_videos))),
        }).eq("id", rival_id).execute()
    
    return json.dumps({
        "top_videos": top_videos[:5], "popping_off": [v for v in scored_videos if v["is_popping_off"]],
        "total_analyzed": len(scored_videos), "patterns": patterns
    })

def analyze_instagram_account(username: str, rival_id: str, user_id: str, job_id: str) -> dict:
    import instaloader
    update_job_status(job_id, "processing", "fetching_instagram", 10)
    L = instaloader.Instaloader(download_videos=False, download_pictures=False, quiet=True)
    try: profile = instaloader.Profile.from_username(L.context, username)
    except Exception as e: raise ValueError(f"Cannot access @{username}: {str(e)}")
    
    follower_count = profile.followers
    update_job_status(job_id, "processing", "analyzing_posts", 25)
    
    posts_data = []
    for i, post in enumerate(profile.get_posts()):
        if i >= 30: break
        try:
            from datetime import datetime
            hours_old = max(1, (datetime.now() - post.date_utc.replace(tzinfo=None)).total_seconds() / 3600)
            views = post.video_view_count if post.is_video else post.likes * 10
            views_per_hour = views / hours_old
            engagement = (post.likes + post.comments) / max(1, follower_count) * 100
            is_popping_off = views_per_hour > (follower_count * 0.01)
            posts_data.append({
                "post_url": f"https://instagram.com/p/{post.shortcode}/", "thumbnail_url": post.url,
                "caption": (post.caption or "")[:200], "views": views, "likes": post.likes,
                "comments": post.comments, "engagement_rate": round(engagement, 2),
                "views_per_hour": round(views_per_hour, 1), "is_popping_off": is_popping_off,
                "viral_score": min(1.0, views_per_hour / 10000), "is_video": post.is_video,
            })
        except Exception as e: continue
    
    patterns = analyze_patterns_with_gemini(
        sorted(posts_data, key=lambda x: x["viral_score"], reverse=True)[:10],
        posts_data, f"@{username}", job_id
    )
    
    if rival_id:
        db = get_supabase()
        db.table("rival_profiles").update({
            "follower_count": follower_count, "analysis_data": patterns, "last_analyzed_at": "now()",
        }).eq("id", rival_id).execute()
    
    return json.dumps({
        "top_videos": sorted(posts_data, key=lambda x: x["viral_score"], reverse=True)[:5],
        "popping_off": [p for p in posts_data if p["is_popping_off"]],
        "total_analyzed": len(posts_data), "patterns": patterns
    })

def analyze_patterns_with_gemini(top_posts: list, all_posts: list, account_identifier: str, job_id: str) -> dict:
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel("gemini-1.5-pro")
    posts_summary = json.dumps([
        {"title": p.get("title") or p.get("caption", "")[:100], "views": p.get("views", 0),
         "engagement_rate": p.get("engagement_rate", 0), "views_per_hour": p.get("views_per_hour", 0),
         "is_viral": p.get("is_viral", False)} for p in all_posts[:30]
    ], indent=2)
    
    prompt = f"Analyze these metrics from {account_identifier} and identify patterns. Return JSON with best_posting_times, best_content_types, winning_hook_patterns, hashtag_strategy, caption_pattern, thumbnail_style, avg_video_length, posting_frequency, content_gaps, your_opportunities, top_performing_topics, engagement_insight. \nPOSTS:\n{posts_summary}"
    try:
        res = model.generate_content(prompt).text.strip()
        return json.loads(res[7:-3] if res.startswith("```json") else res)
    except:
        return {"content_gaps": ["Manual analysis required"], "your_opportunities": ["Analyze top performing posts manually"], "best_posting_times": ["Unknown"], "winning_hook_patterns": [], "posting_frequency": "unknown"}

def analyze_competitor(data: dict) -> str:
    job_id = data["job_id"]
    platform = data["platform"]
    try:
        if platform == "youtube":
            return analyze_youtube_channel(data["profile_url"], data.get("rival_id"), data["user_id"], job_id)
        elif platform == "instagram":
            username = data["profile_url"].split("instagram.com/")[-1].strip("/")
            return analyze_instagram_account(username, data.get("rival_id"), data["user_id"], job_id)
        else:
            raise ValueError(f"Platform {platform} not yet supported")
    except Exception as e:
        update_job_status(job_id, "failed", str(e)[:500])
        raise
