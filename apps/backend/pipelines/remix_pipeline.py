# MY STUDIO — remix_pipeline.py
from db import update_job_status, get_supabase
from intelligence.content_remixer import analyze_viral_video, generate_remix_scripts

def run_remix_pipeline(data: dict) -> dict:
    """Analyze a viral video and generate remix scripts."""
    job_id = data["job_id"]
    user_id = data["user_id"]
    source_url = data["source_url"]
    
    try:
        analysis_result = analyze_viral_video(source_url, job_id)
        
        scripts = generate_remix_scripts(
            analysis=analysis_result,
            user_niche=data.get("user_niche", "General"),
            user_audience=data.get("user_audience", "General audience"),
            user_voice=data.get("user_voice", "casual"),
            remix_goal=data.get("remix_goal", "same_topic"),
            target_platform=data.get("target_platform", "tiktok"),
            target_duration=data.get("target_duration", 60),
            job_id=job_id
        )
        
        db = get_supabase()
        remix = db.table("content_remixes").insert({
            "user_id": user_id,
            "source_url": source_url,
            "source_type": data.get("source_type", "url"),
            "why_it_worked": analysis_result["analysis"].get("why_it_worked"),
            "hook_type": analysis_result["analysis"].get("hook_type"),
            "story_arc": analysis_result["analysis"].get("story_arc"),
            "viral_score": analysis_result["analysis"].get("viral_score_estimate", 0),
            "remix_script_v1": scripts["v1"],
            "remix_script_v2": scripts["v2"],
            "remix_script_v3": scripts["v3"],
            "user_niche": data.get("user_niche"),
            "user_audience": data.get("user_audience"),
            "remix_goal": data.get("remix_goal"),
        }).select("id").single().execute()
        
        update_job_status(job_id, "complete", "done", 100,
            output_metadata={
                "remix_id": remix.data["id"],
                "analysis": analysis_result["analysis"],
                "scripts": scripts
            }
        )
        
        return {"remix_id": remix.data["id"], **scripts}
        
    except Exception as e:
        update_job_status(job_id, "failed", str(e)[:500])
        raise
