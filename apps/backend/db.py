# MY STUDIO — db.py
# PURPOSE: Supabase client and database operations for job tracking
# CONNECTS TO: All pipelines, main.py endpoints

import os
import logging
from datetime import datetime, timezone
from typing import Any

from supabase import create_client, Client

logger = logging.getLogger("my-studio")


def get_supabase() -> Client:
    """Create and return a Supabase client using service role key.
    
    Returns:
        Supabase client with admin access (bypasses RLS).
    """
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def update_job_status(
    job_id: str,
    status: str,
    current_step: str,
    progress_percent: int,
    output_url: str | None = None,
    error: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    """Update job status in the content_jobs table.
    
    Called at every major pipeline step to provide real-time progress.
    
    Args:
        job_id: UUID of the content job.
        status: One of 'queued', 'processing', 'complete', 'failed'.
        current_step: Human-readable step name.
        progress_percent: 0-100 progress value.
        output_url: Final output URL (set on completion).
        error: Error message (set on failure).
        metadata: Additional output metadata.
    """
    now = datetime.now(timezone.utc).isoformat()
    logger.info(f"[{job_id}] {status} — {current_step} ({progress_percent}%) at {now}")
    
    supabase = get_supabase()
    update_data: dict[str, Any] = {
        "status": status,
        "current_step": current_step,
        "progress_percent": progress_percent,
    }
    
    if status == "processing" and progress_percent == 0:
        update_data["started_at"] = now
    
    if output_url is not None:
        update_data["output_url"] = output_url
    
    if error is not None:
        update_data["error_message"] = error
    
    if metadata is not None:
        update_data["output_metadata"] = metadata
    
    if status in ("complete", "failed"):
        update_data["completed_at"] = now
    
    supabase.table("content_jobs").update(update_data).eq("id", job_id).execute()


def get_job(job_id: str) -> dict[str, Any] | None:
    """Fetch a job record from the content_jobs table.
    
    Args:
        job_id: UUID of the content job.
    
    Returns:
        Job record as dict, or None if not found.
    """
    supabase = get_supabase()
    result = supabase.table("content_jobs").select("*").eq("id", job_id).execute()
    if result.data and len(result.data) > 0:
        return result.data[0]
    return None


def save_to_library(
    user_id: str,
    job_id: str,
    title: str,
    module: str,
    video_url: str,
    thumbnail_url: str | None = None,
    duration: float | None = None,
) -> str:
    """Save completed content to the content_library table.
    
    Args:
        user_id: UUID of the user.
        job_id: UUID of the source job.
        title: Content title.
        module: Module that generated this content.
        video_url: Cloudinary URL of the output.
        thumbnail_url: Thumbnail URL.
        duration: Duration in seconds.
    
    Returns:
        UUID of the new library item.
    """
    supabase = get_supabase()
    result = supabase.table("content_library").insert({
        "user_id": user_id,
        "job_id": job_id,
        "title": title,
        "module": module,
        "video_url": video_url,
        "thumbnail_url": thumbnail_url,
        "duration_seconds": duration,
    }).execute()
    return result.data[0]["id"]


def create_notification(
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    data: dict[str, Any] | None = None,
) -> None:
    """Create a notification for a user.
    
    Args:
        user_id: UUID of the user.
        notification_type: Type of notification (job_complete, rival_alert, trend).
        title: Notification title.
        message: Notification body.
        data: Additional structured data.
    """
    supabase = get_supabase()
    supabase.table("notifications").insert({
        "user_id": user_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "data": data or {},
        "is_read": False,
    }).execute()
