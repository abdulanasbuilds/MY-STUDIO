# MY STUDIO — pipelines/remix_pipeline.py
# PURPOSE: Remix viral videos with new creative angles
# TOOLS: yt-dlp -> Whisper -> Gemini (analysis+remix)
# CONNECTS TO: main.py generate_remix endpoint, intelligence/content_remixer.py
# GPU: T4 (16GB)

import logging
import os
import shutil
import tempfile
import json
from typing import Any

from db import update_job_status, save_to_library, create_notification
from storage import upload_video

logger = logging.getLogger("my-studio")


def run_remix_pipeline(data: dict[str, Any]) -> str:
    """Run the viral video remix pipeline.

    Steps:
        1. Download source viral video with yt-dlp
        2. Transcribe to get source text
        3. Analyze structure with Gemini
        4. Generate remix script
        5. Upload generated script/manifest

    Note: This pipeline generates the SCRIPT and ANALYSIS.
    The user can then take this script to the Avatar or Movie module to generate the actual video.

    Args:
        data: Request data containing source_url, user_niche,
              user_audience, remix_goal, target_platform, job_id, user_id.

    Returns:
        JSON string containing the remix analysis and new scripts.
    """
    job_id: str = data["job_id"]
    user_id: str = data["user_id"]
    source_url: str = data["source_url"]
    user_niche: str = data["user_niche"]
    user_audience: str = data["user_audience"]
    remix_goal: str = data["remix_goal"]
    target_platform: str = data.get("target_platform", "tiktok")

    tmpdir = tempfile.mkdtemp(prefix="remix_pipeline_")

    try:
        # 1. Download audio from source
        update_job_status(job_id, "processing", "downloading_source", 10)
        audio_path = os.path.join(tmpdir, "source_audio.m4a")
        
        import subprocess
        cmd = [
            "yt-dlp",
            "-f", "bestaudio[ext=m4a]/bestaudio",
            "-o", audio_path,
            "--no-playlist",
            source_url,
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        
        # 2. Transcribe
        update_job_status(job_id, "processing", "transcribing", 30)
        from models.whisper_model import transcribe, load_whisper
        whisper_model = load_whisper()
        transcript_data = transcribe(audio_path=audio_path, model=whisper_model)
        
        full_text = " ".join([s["text"] for s in transcript_data["segments"]])
        
        # 3. Analyze viral structure
        update_job_status(job_id, "processing", "analyzing_structure", 60)
        from intelligence.content_remixer import analyze_viral_video, generate_remix_script
        
        analysis = analyze_viral_video(full_text, job_id)
        
        # 4. Generate remix script
        update_job_status(job_id, "processing", "generating_scripts", 80)
        
        script_v1 = generate_remix_script(
            analysis, user_niche, user_audience, remix_goal, target_platform, job_id
        )
        
        # We could generate v2 and v3 here by passing different temperature/params
        
        # 5. Save results
        update_job_status(job_id, "processing", "saving_results", 95)
        
        result_payload = {
            "source_analysis": analysis,
            "remix_scripts": [script_v1],
        }
        
        # Notify
        create_notification(
            user_id=user_id,
            notification_type="job_complete",
            title="Remix Script Ready",
            message=f"Analyzed viral video and generated new scripts for your niche.",
            data={"job_id": job_id, "module": "remix"},
        )

        manifest = json.dumps(result_payload)
        logger.info(f"[{job_id}] Remix pipeline complete")
        return manifest

    except Exception as e:
        logger.error(f"[{job_id}] Remix pipeline failed: {e}")
        raise

    finally:
        if os.path.exists(tmpdir):
            shutil.rmtree(tmpdir, ignore_errors=True)
