# MY STUDIO — pipelines/avatar_pipeline.py
# PURPOSE: Full avatar video generation pipeline
# TOOLS: GPT-SoVITS (voice clone) -> HunyuanVideo-Avatar (talking head) -> MuseTalk (lip sync) -> Real-ESRGAN (enhance)
# CONNECTS TO: main.py generate_avatar endpoint, models/sovits.py, models/hunyuan_avatar.py, models/musetalk.py, models/esrgan.py
# GPU: A100 (80GB)

import logging
import os
import shutil
import tempfile
from typing import Any

from db import update_job_status, save_to_library, create_notification
from storage import upload_video, get_thumbnail

logger = logging.getLogger("my-studio")


def run_avatar_pipeline(data: dict[str, Any]) -> str:
    """Run the full avatar video generation pipeline.

    Orchestrates 4 AI models in sequence to produce a professional
    talking-head video from a script, face image, and cloned voice.

    Steps:
        1. Download avatar face image from Cloudinary
        2. Generate speech audio with GPT-SoVITS (cloned voice)
        3. Generate talking head video with HunyuanVideo-Avatar
        4. Refine lip sync with MuseTalk
        5. Enhance quality with Real-ESRGAN (premium mode only)
        6. Upload final video to Cloudinary
        7. Save to content library
        8. Clean up all temp files

    Args:
        data: Request data containing:
            - job_id: UUID of the content job
            - user_id: UUID of the user
            - script: Text script for the avatar to speak
            - avatar_id: UUID of the avatar profile
            - quality_mode: 'fast' or 'premium'
            - caption_style: 'hormozi', 'netflix', 'tiktok', or 'none'
            - language: Language code (default 'en')
            - style: 'casual', 'professional', 'energetic', 'educational'
            - face_image_url: Cloudinary URL of the face image
            - voice_model_path: Path to the cloned voice model

    Returns:
        Cloudinary URL of the final video.

    Raises:
        RuntimeError: If any pipeline step fails.
    """
    job_id: str = data["job_id"]
    user_id: str = data["user_id"]
    script: str = data["script"]
    quality_mode: str = data.get("quality_mode", "fast")
    language: str = data.get("language", "en")
    face_image_url: str = data["face_image_url"]
    voice_model_path: str = data.get("voice_model_path", "")
    speaker_id: str = data.get("speaker_id", data.get("avatar_id", "default"))

    # Create temp directory for all intermediate files
    tmpdir = tempfile.mkdtemp(prefix="avatar_pipeline_")

    try:
        # ------------------------------------------------------------------
        # Step 1: Download face image
        # ------------------------------------------------------------------
        update_job_status(job_id, "processing", "downloading_face_image", 5)
        face_image_path = _download_file(face_image_url, tmpdir, "face_image.png")
        logger.info(f"[{job_id}] Face image downloaded: {face_image_path}")

        # ------------------------------------------------------------------
        # Step 2: Generate speech audio with GPT-SoVITS
        # ------------------------------------------------------------------
        update_job_status(job_id, "processing", "generating_speech", 15)
        audio_path = os.path.join(tmpdir, "speech.wav")

        from models.sovits import generate_speech, load_sovits
        sovits_model = load_sovits()
        generate_speech(
            text=script,
            speaker_id=speaker_id,
            output_path=audio_path,
            language=language,
            model=sovits_model,
        )
        logger.info(f"[{job_id}] Speech generated: {audio_path}")

        # ------------------------------------------------------------------
        # Step 3: Generate talking head with HunyuanVideo-Avatar
        # ------------------------------------------------------------------
        update_job_status(job_id, "processing", "generating_avatar_video", 35)
        raw_video_path = os.path.join(tmpdir, "raw_avatar.mp4")

        from models.hunyuan_avatar import generate_avatar_video, load_hunyuan_avatar
        hunyuan_model = load_hunyuan_avatar()

        audio_duration = _get_audio_duration(audio_path)
        generate_avatar_video(
            model=hunyuan_model,
            image_path=face_image_path,
            audio_path=audio_path,
            duration_seconds=audio_duration,
            output_path=raw_video_path,
        )
        logger.info(f"[{job_id}] Raw avatar video generated: {raw_video_path}")

        # ------------------------------------------------------------------
        # Step 4: Refine lip sync with MuseTalk
        # ------------------------------------------------------------------
        update_job_status(job_id, "processing", "refining_lip_sync", 55)
        lipsync_video_path = os.path.join(tmpdir, "lipsync_avatar.mp4")

        from models.musetalk import generate_lipsync_video, load_musetalk
        musetalk_model = load_musetalk()
        generate_lipsync_video(
            face_path=raw_video_path,
            audio_path=audio_path,
            output_path=lipsync_video_path,
            model=musetalk_model,
        )
        logger.info(f"[{job_id}] Lip sync refined: {lipsync_video_path}")

        # ------------------------------------------------------------------
        # Step 5: Enhance with Real-ESRGAN (premium mode only)
        # ------------------------------------------------------------------
        if quality_mode == "premium":
            update_job_status(job_id, "processing", "enhancing_quality", 70)
            enhanced_path = os.path.join(tmpdir, "enhanced_avatar.mp4")

            from models.esrgan import enhance_video, load_esrgan
            esrgan_model = load_esrgan()
            enhance_video(
                input_path=lipsync_video_path,
                output_path=enhanced_path,
                scale=4,
                model=esrgan_model,
            )
            final_local_path = enhanced_path
            logger.info(f"[{job_id}] Video enhanced: {enhanced_path}")
        else:
            update_job_status(job_id, "processing", "skipping_enhancement", 70)
            final_local_path = lipsync_video_path

        # ------------------------------------------------------------------
        # Step 6: Upload to Cloudinary
        # ------------------------------------------------------------------
        update_job_status(job_id, "processing", "uploading", 85)
        output_url = upload_video(final_local_path, job_id)
        thumbnail_url = get_thumbnail(output_url)
        logger.info(f"[{job_id}] Uploaded to Cloudinary: {output_url}")

        # ------------------------------------------------------------------
        # Step 7: Save to content library
        # ------------------------------------------------------------------
        update_job_status(job_id, "processing", "saving_to_library", 95)

        # Generate a title from the script (first 50 chars)
        title = script[:50].strip()
        if len(script) > 50:
            title += "..."

        save_to_library(
            user_id=user_id,
            job_id=job_id,
            title=title,
            module="avatar",
            video_url=output_url,
            thumbnail_url=thumbnail_url,
            duration=audio_duration,
        )

        # Create completion notification
        create_notification(
            user_id=user_id,
            notification_type="job_complete",
            title="Avatar Video Ready",
            message=f'Your avatar video "{title}" is ready to view.',
            data={"job_id": job_id, "module": "avatar", "output_url": output_url},
        )

        logger.info(f"[{job_id}] Avatar pipeline complete: {output_url}")
        return output_url

    except Exception as e:
        logger.error(f"[{job_id}] Avatar pipeline failed: {e}")
        raise

    finally:
        # ------------------------------------------------------------------
        # Step 8: Clean up temp files (ALWAYS runs)
        # ------------------------------------------------------------------
        if os.path.exists(tmpdir):
            shutil.rmtree(tmpdir, ignore_errors=True)
            logger.info(f"[{job_id}] Temp files cleaned up: {tmpdir}")


def _download_file(url: str, dest_dir: str, filename: str) -> str:
    """Download a file from a URL to a local directory.

    Args:
        url: URL to download from.
        dest_dir: Directory to save the file.
        filename: Name for the saved file.

    Returns:
        Path to the downloaded file.

    Raises:
        RuntimeError: If download fails.
    """
    import httpx

    dest_path = os.path.join(dest_dir, filename)

    with httpx.Client(timeout=60.0) as client:
        response = client.get(url)
        response.raise_for_status()

        with open(dest_path, "wb") as f:
            f.write(response.content)

    return dest_path


def _get_audio_duration(audio_path: str) -> float:
    """Get the duration of an audio file in seconds.

    Args:
        audio_path: Path to the audio file.

    Returns:
        Duration in seconds.
    """
    import subprocess

    result = subprocess.run(
        [
            "ffprobe", "-v", "quiet",
            "-show_entries", "format=duration",
            "-of", "csv=p=0",
            audio_path,
        ],
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())
