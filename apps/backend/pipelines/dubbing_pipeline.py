# MY STUDIO — pipelines/dubbing_pipeline.py
# PURPOSE: Full video dubbing pipeline with lip sync
# TOOLS: Whisper (transcription) -> NLLB-200 (translation) -> XTTS-v2 (voice clone TTS) -> MuseTalk (lip sync) -> FFmpeg (merge)
# CONNECTS TO: main.py generate_dub endpoint, models/whisper_model.py, models/musetalk.py
# GPU: A10G (24GB)

import logging
import os
import shutil
import tempfile
import subprocess
from typing import Any

from db import update_job_status, save_to_library, create_notification
from storage import upload_video, get_thumbnail

logger = logging.getLogger("my-studio")


def run_dubbing_pipeline(data: dict[str, Any]) -> str:
    """Run the full video dubbing pipeline.

    Steps:
        1. Download source video
        2. Transcribe audio with Whisper
        3. Translate transcript with NLLB-200
        4. Clone speaker voice & synthesize translated speech with XTTS-v2
        5. Apply lip sync with MuseTalk
        6. Mix original ambient audio with new speech
        7. Upload to Cloudinary
        8. Clean up temp files

    Args:
        data: Request data containing video_url, target_lang,
              preserve_background, sync_lips, clone_voice, job_id, user_id.

    Returns:
        Cloudinary URL of the dubbed video.
    """
    job_id = data["job_id"]
    user_id = data["user_id"]
    video_url = data["video_url"]
    target_lang = data.get("target_lang", "es")
    sync_lips = data.get("sync_lips", True)
    
    tmpdir = tempfile.mkdtemp(prefix="dubbing_pipeline_")

    try:
        # 1. Download source video
        update_job_status(job_id, "processing", "downloading_source", 10)
        source_path = os.path.join(tmpdir, "source.mp4")
        
        cmd = [
            "yt-dlp",
            "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "-o", source_path,
            "--no-playlist",
            video_url,
        ]
        subprocess.run(cmd, check=True, capture_output=True)

        # Extract audio for cloning and transcription
        audio_path = os.path.join(tmpdir, "source_audio.wav")
        subprocess.run(["ffmpeg", "-y", "-i", source_path, "-ac", "1", "-ar", "16000", audio_path], check=True, capture_output=True)

        # 2. Transcribe
        update_job_status(job_id, "processing", "transcribing", 25)
        from models.whisper_model import transcribe, load_whisper
        whisper_model = load_whisper()
        transcript_data = transcribe(audio_path=audio_path, model=whisper_model)
        full_text = " ".join([s["text"] for s in transcript_data["segments"]])

        # 3. Translate
        update_job_status(job_id, "processing", "translating", 40)
        from models.nllb import translate_text, load_nllb
        nllb_model = load_nllb()
        translated_text = translate_text(
            text=full_text,
            source_lang="eng_Latn",
            target_lang=target_lang,
            model=nllb_model
        )

        # 4. Clone voice & Synthesize
        update_job_status(job_id, "processing", "synthesizing_speech", 55)
        from models.xtts import generate_multilingual_speech, load_xtts
        xtts_model = load_xtts()
        dubbed_audio_path = os.path.join(tmpdir, "dubbed_audio.wav")
        
        generate_multilingual_speech(
            text=translated_text,
            reference_audio=audio_path,
            output_path=dubbed_audio_path,
            language=target_lang[:2].lower(),
            model=xtts_model
        )

        # 5. Lip Sync (Optional)
        if sync_lips:
            update_job_status(job_id, "processing", "applying_lip_sync", 75)
            from models.musetalk import generate_lipsync_video, load_musetalk
            musetalk_model = load_musetalk()
            
            final_local_path = os.path.join(tmpdir, "final_dub.mp4")
            generate_lipsync_video(
                face_path=source_path,
                audio_path=dubbed_audio_path,
                output_path=final_local_path,
                model=musetalk_model
            )
        else:
            # Just mux the new audio with original video
            update_job_status(job_id, "processing", "merging_audio", 75)
            final_local_path = os.path.join(tmpdir, "final_dub.mp4")
            subprocess.run([
                "ffmpeg", "-y", "-i", source_path, "-i", dubbed_audio_path,
                "-c:v", "copy", "-c:a", "aac", "-map", "0:v:0", "-map", "1:a:0",
                "-shortest", final_local_path
            ], check=True, capture_output=True)

        # 6. Upload and Save
        update_job_status(job_id, "processing", "uploading", 90)
        output_url = upload_video(final_local_path, job_id, folder="my-studio/dubs")
        thumbnail_url = get_thumbnail(output_url)
        
        update_job_status(job_id, "processing", "saving_to_library", 95)
        
        title = f"Dub ({target_lang}): {translated_text[:30].strip()}..."
            
        save_to_library(
            user_id=user_id,
            job_id=job_id,
            title=title,
            module="dubbing",
            video_url=output_url,
            thumbnail_url=thumbnail_url,
        )

        create_notification(
            user_id=user_id,
            notification_type="job_complete",
            title="Dubbing Complete",
            message=f"Your video has been dubbed to {target_lang}.",
            data={"job_id": job_id, "module": "dubbing", "output_url": output_url},
        )

        logger.info(f"[{job_id}] Dubbing pipeline complete: {output_url}")
        return output_url

    except Exception as e:
        logger.error(f"[{job_id}] Dubbing pipeline failed: {e}")
        raise

    finally:
        if os.path.exists(tmpdir):
            shutil.rmtree(tmpdir, ignore_errors=True)
