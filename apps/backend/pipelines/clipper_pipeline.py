# MY STUDIO — pipelines/clipper_pipeline.py
# PURPOSE: Extract viral clips from long-form video
# TOOLS: yt-dlp (download) -> Whisper (transcription) -> Gemini (viral scoring) -> FFmpeg (extraction) -> MediaPipe (smart crop)
# CONNECTS TO: main.py generate_clip endpoint, models/whisper_model.py, models/mediapipe_tracker.py, intelligence/viral_scorer.py
# GPU: T4 (16GB)

import logging
import os
import shutil
import tempfile
from typing import Any

from db import update_job_status, save_to_library, create_notification, get_supabase
from storage import upload_video, get_thumbnail

logger = logging.getLogger("my-studio")


def run_clipper_pipeline(data: dict[str, Any]) -> str:
    """Run the viral clip extraction pipeline.

    Downloads a source video, analyzes it for viral moments, and extracts
    optimized vertical clips ready for social media.

    Steps:
        1. Download source video with yt-dlp
        2. Transcribe with Whisper (word-level timestamps)
        3. Score moments for virality (12 signals via Gemini)
        4. Extract top clips with FFmpeg
        5. Smart-crop to vertical (9:16) with MediaPipe
        6. Upload clips to Cloudinary
        7. Save metadata to Supabase
        8. Clean up temp files

    Args:
        data: Request data containing:
            - job_id: UUID of the content job
            - user_id: UUID of the user
            - source_url: URL of the YouTube video to clip
            - max_clips: Maximum number of clips to generate
            - min_duration: Min duration in seconds
            - max_duration: Max duration in seconds
            - platforms: Target platforms (tiktok, shorts, reels)
            - crop_mode: face_track, smart_center, split_screen

    Returns:
        JSON string containing the results manifest.

    Raises:
        RuntimeError: If any pipeline step fails.
    """
    job_id: str = data["job_id"]
    user_id: str = data["user_id"]
    source_url: str = data["source_url"]
    max_clips: int = data.get("max_clips", 5)
    crop_mode: str = data.get("crop_mode", "smart_center")

    tmpdir = tempfile.mkdtemp(prefix="clipper_pipeline_")

    try:
        # ------------------------------------------------------------------
        # Step 1: Download source video
        # ------------------------------------------------------------------
        update_job_status(job_id, "processing", "downloading_source", 10)
        source_path = os.path.join(tmpdir, "source.mp4")
        _download_video(source_url, source_path)
        logger.info(f"[{job_id}] Source downloaded: {source_path}")

        # ------------------------------------------------------------------
        # Step 2: Transcribe with Whisper
        # ------------------------------------------------------------------
        update_job_status(job_id, "processing", "transcribing", 30)

        from models.whisper_model import transcribe, load_whisper
        whisper_model = load_whisper()
        transcript_data = transcribe(audio_path=source_path, model=whisper_model)
        logger.info(f"[{job_id}] Transcription complete")

        # ------------------------------------------------------------------
        # Step 3: Score moments
        # ------------------------------------------------------------------
        update_job_status(job_id, "processing", "analyzing_moments", 50)

        from intelligence.viral_scorer import score_viral_moment

        # Group segments into potential clips (~30-60s)
        clip_candidates = []
        current_clip = {"text": "", "start": 0.0, "end": 0.0}

        for segment in transcript_data["segments"]:
            if not current_clip["text"]:
                current_clip["start"] = segment["start"]

            current_clip["text"] += " " + segment["text"]
            current_clip["end"] = segment["end"]

            duration = current_clip["end"] - current_clip["start"]
            if duration >= 30.0:
                # Score the candidate
                score_data = score_viral_moment(
                    transcript_segment=current_clip["text"],
                    audio_data={},
                    visual_data={},
                    job_id=job_id,
                )
                if score_data["recommendation"] == "clip":
                    clip_candidates.append({
                        "start": current_clip["start"],
                        "end": current_clip["end"],
                        "text": current_clip["text"],
                        "score": score_data,
                    })

                # Reset for next candidate
                current_clip = {"text": "", "start": 0.0, "end": 0.0}

        # Sort by score and take top N
        clip_candidates.sort(key=lambda x: x["score"]["overall_score"], reverse=True)
        top_clips = clip_candidates[:max_clips]

        if not top_clips:
            raise ValueError("No viable viral moments found in video.")

        # ------------------------------------------------------------------
        # Step 4 & 5: Extract and crop clips
        # ------------------------------------------------------------------
        update_job_status(job_id, "processing", "extracting_clips", 70)

        from models.mediapipe_tracker import track_face, smart_center, split_screen

        final_clips = []
        for i, clip in enumerate(top_clips):
            raw_clip_path = os.path.join(tmpdir, f"clip_{i}_raw.mp4")
            cropped_clip_path = os.path.join(tmpdir, f"clip_{i}_final.mp4")

            # Extract
            _extract_clip(source_path, raw_clip_path, clip["start"], clip["end"])

            # Crop
            if crop_mode == "face_track":
                track_face(raw_clip_path, cropped_clip_path)
            elif crop_mode == "split_screen":
                split_screen(raw_clip_path, cropped_clip_path)
            else:
                smart_center(raw_clip_path, cropped_clip_path)

            final_clips.append({
                "path": cropped_clip_path,
                "metadata": clip,
            })

        # ------------------------------------------------------------------
        # Step 6 & 7: Upload and Save
        # ------------------------------------------------------------------
        update_job_status(job_id, "processing", "uploading_clips", 90)

        supabase = get_supabase()
        results = []

        for i, clip in enumerate(final_clips):
            # Upload to Cloudinary
            clip_id = f"{job_id}_clip_{i}"
            output_url = upload_video(clip["path"], clip_id)
            thumbnail_url = get_thumbnail(output_url)

            # Save to content_clips table
            clip_data = {
                "user_id": user_id,
                "source_job_id": job_id,
                "source_url": source_url,
                "start_seconds": clip["metadata"]["start"],
                "end_seconds": clip["metadata"]["end"],
                "duration_seconds": clip["metadata"]["end"] - clip["metadata"]["start"],
                "viral_score": clip["metadata"]["score"]["overall_score"],
                "signal_breakdown": clip["metadata"]["score"]["signals"],
                "transcript": clip["metadata"]["text"],
                "generated_titles": [clip["metadata"]["score"]["title"]],
                "file_tiktok_url": output_url,
                "status": "ready",
            }
            supabase.table("content_clips").insert(clip_data).execute()

            # Save first clip to main library as the job output
            if i == 0:
                save_to_library(
                    user_id=user_id,
                    job_id=job_id,
                    title=f"Viral Clip: {clip['metadata']['score']['title']}",
                    module="clipper",
                    video_url=output_url,
                    thumbnail_url=thumbnail_url,
                    duration=clip_data["duration_seconds"],
                )

            results.append({
                "url": output_url,
                "score": clip_data["viral_score"],
                "title": clip_data["generated_titles"][0],
            })

        # Notify
        create_notification(
            user_id=user_id,
            notification_type="job_complete",
            title="Clips Ready",
            message=f'Extracted {len(results)} viral clips from your video.',
            data={"job_id": job_id, "module": "clipper"},
        )

        import json
        manifest = json.dumps(results)
        logger.info(f"[{job_id}] Clipper pipeline complete: {len(results)} clips")
        return manifest

    except Exception as e:
        logger.error(f"[{job_id}] Clipper pipeline failed: {e}")
        raise

    finally:
        if os.path.exists(tmpdir):
            shutil.rmtree(tmpdir, ignore_errors=True)


def _download_video(url: str, output_path: str) -> None:
    """Download video using yt-dlp."""
    import subprocess
    cmd = [
        "yt-dlp",
        "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "-o", output_path,
        "--no-playlist",
        url,
    ]
    subprocess.run(cmd, check=True, capture_output=True)


def _extract_clip(input_path: str, output_path: str, start: float, end: float) -> None:
    """Extract a portion of a video using FFmpeg."""
    import subprocess
    duration = end - start
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start),
        "-i", input_path,
        "-t", str(duration),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        output_path,
    ]
    subprocess.run(cmd, check=True, capture_output=True)
