# MY STUDIO — pipelines/audio_pipeline.py
# PURPOSE: Full audio production pipeline (music, sound effects, mastering)
# TOOLS: MusicGen (music generation) -> Demucs (stem separation) -> FFmpeg (mixing) -> Human Feel (mastering)
# CONNECTS TO: main.py, models/musicgen.py, models/demucs.py
# GPU: A10G (24GB)

import logging
import os
import shutil
import tempfile
import subprocess
from typing import Any

from db import update_job_status, save_to_library, create_notification
from storage import upload_audio

logger = logging.getLogger("my-studio")


def run_audio_pipeline(data: dict[str, Any]) -> str:
    """Run the audio production pipeline.

    Supports multiple modes:
    1. generate: Text-to-music via MusicGen
    2. separate: Extract vocals/drums/bass via Demucs

    Args:
        data: Request data containing mode, prompt, audio_url, job_id, user_id.

    Returns:
        Cloudinary URL of the final audio.
    """
    job_id = data["job_id"]
    user_id = data["user_id"]
    mode = data.get("mode", "generate")
    prompt = data.get("prompt", "")
    source_url = data.get("audio_url", "")
    duration = data.get("duration", 15)

    tmpdir = tempfile.mkdtemp(prefix="audio_pipeline_")

    try:
        if mode == "generate":
            update_job_status(job_id, "processing", "generating_music", 20)
            from models.musicgen import generate_music, load_musicgen
            
            music_model = load_musicgen()
            output_audio = os.path.join(tmpdir, "generated_music.wav")
            
            generate_music(
                prompt=prompt,
                output_path=output_audio,
                duration_seconds=duration,
                model=music_model
            )
            title = f"AI Music: {prompt[:30]}..."
            
            # Master it slightly
            update_job_status(job_id, "processing", "mastering", 70)
            mastered_audio = os.path.join(tmpdir, "mastered_music.wav")
            subprocess.run(["ffmpeg", "-y", "-i", output_audio, "-af", "loudnorm=I=-14:LRA=11:TP=-1.5", mastered_audio], check=True)
            final_path = mastered_audio

        elif mode == "separate":
            update_job_status(job_id, "processing", "downloading_source", 20)
            
            source_audio = os.path.join(tmpdir, "source_audio.mp4")
            cmd = ["yt-dlp", "-o", source_audio, "--no-playlist", source_url]
            subprocess.run(cmd, check=True, capture_output=True)

            update_job_status(job_id, "processing", "separating_stems", 50)
            from models.demucs import separate_audio, load_demucs
            
            demucs_model = load_demucs()
            stems_dir = os.path.join(tmpdir, "stems")
            
            # This returns a dict of {stem_name: path}
            stems = separate_audio(input_path=source_audio, output_dir=stems_dir, model=demucs_model)
            
            # Zip the stems for download
            update_job_status(job_id, "processing", "packaging_stems", 80)
            zip_path = os.path.join(tmpdir, "stems_package.zip")
            shutil.make_archive(zip_path.replace(".zip", ""), 'zip', stems_dir)
            final_path = zip_path
            title = "Separated Audio Stems"

        else:
            raise ValueError(f"Unknown audio pipeline mode: {mode}")

        # Upload and Save
        update_job_status(job_id, "processing", "uploading", 90)
        output_url = upload_audio(final_path, job_id, folder="my-studio/audio")
        
        update_job_status(job_id, "processing", "saving_to_library", 95)
        save_to_library(
            user_id=user_id,
            job_id=job_id,
            title=title,
            module="audio",
            video_url=output_url,
            duration=duration if mode == "generate" else None,
        )

        create_notification(
            user_id=user_id,
            notification_type="job_complete",
            title="Audio Processing Complete",
            message=f"Your audio '{title}' is ready.",
            data={"job_id": job_id, "module": "audio", "output_url": output_url},
        )

        logger.info(f"[{job_id}] Audio pipeline complete: {output_url}")
        return output_url

    except Exception as e:
        logger.error(f"[{job_id}] Audio pipeline failed: {e}")
        raise

    finally:
        if os.path.exists(tmpdir):
            shutil.rmtree(tmpdir, ignore_errors=True)
