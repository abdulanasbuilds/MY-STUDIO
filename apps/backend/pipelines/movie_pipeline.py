# MY STUDIO — pipelines/movie_pipeline.py
# PURPOSE: Full short film generation pipeline
# TOOLS: Gemini (screenplay) -> FLUX.1 (storyboard) -> HunyuanVideo/SkyReels/CogVideoX (scenes) -> MusicGen (score) -> FFmpeg (assembly)
# CONNECTS TO: main.py generate_movie endpoint, models/hunyuan_video.py, models/skyreels.py, models/cogvideo.py, models/flux.py, models/musicgen.py
# GPU: A100 (80GB)

import logging
import os
import shutil
import tempfile
import json
import subprocess
from typing import Any

from db import update_job_status, save_to_library, create_notification
from storage import upload_video, get_thumbnail

logger = logging.getLogger("my-studio")


def run_movie_pipeline(data: dict[str, Any]) -> str:
    """Run the full short film generation pipeline.

    Orchestrates the entire process from a simple prompt to a fully
    edited and scored short film.

    Steps:
        1. Parse or generate screenplay with Gemini
        2. Analyze scenes with FilMaster
        3. Generate storyboard frames with FLUX.1 (optional/internal)
        4. Generate video scenes with video model (SkyReels/CogVideoX)
        5. Generate film score with MusicGen
        6. Assemble scenes + audio with FFmpeg
        7. Upload to Cloudinary
        8. Save to content library
        9. Clean up temp files

    Args:
        data: Request data containing:
            - job_id: UUID of the content job
            - user_id: UUID of the user
            - prompt: Core idea or full screenplay
            - style: 'cinematic', 'documentary', 'anime', 'realistic'
            - duration: 'short' (15s), 'medium' (30s), 'long' (60s)

    Returns:
        Cloudinary URL of the final video.

    Raises:
        RuntimeError: If any pipeline step fails.
    """
    job_id = data["job_id"]
    user_id = data["user_id"]
    prompt = data["prompt"]
    style = data.get("style", "cinematic")
    duration_preset = data.get("duration", "short")

    # Map presets to seconds and scene counts
    if duration_preset == "short":
        target_seconds = 15
        scene_count = 3
    elif duration_preset == "medium":
        target_seconds = 30
        scene_count = 6
    else:  # long
        target_seconds = 60
        scene_count = 12

    tmpdir = tempfile.mkdtemp(prefix="movie_pipeline_")

    try:
        # ------------------------------------------------------------------
        # Step 1 & 2: Screenplay Generation and FilMaster Analysis
        # ------------------------------------------------------------------
        update_job_status(job_id, "processing", "generating_screenplay", 10)
        
        # Simulate Gemini generating scene descriptions
        logger.info(f"[{job_id}] Generating {scene_count} scenes for '{prompt[:30]}...'")
        
        from models.filmaster import analyze_scene
        
        scenes = []
        for i in range(scene_count):
            scene_desc = f"Scene {i+1} of a {style} film about: {prompt[:50]}..."
            cinematic_info = analyze_scene(scene_desc)
            scenes.append({
                "description": scene_desc,
                "cinematics": cinematic_info,
                "duration": 5  # Each scene is ~5 seconds
            })

        # ------------------------------------------------------------------
        # Step 3 & 4: Generate Video Scenes
        # ------------------------------------------------------------------
        update_job_status(job_id, "processing", "generating_scenes", 30)
        
        # We will use SkyReels-V3 for this pipeline (or CogVideoX depending on style)
        from models.skyreels import generate_skyreels_video, load_skyreels
        video_model = load_skyreels()
        
        generated_clips = []
        for i, scene in enumerate(scenes):
            # Update progress incrementally
            progress = int(30 + (i / len(scenes)) * 40)
            update_job_status(job_id, "processing", f"generating_scene_{i+1}", progress)
            
            clip_path = os.path.join(tmpdir, f"scene_{i:03d}.mp4")
            
            # Combine scene desc and cinematic rules into the prompt
            full_prompt = f"{scene['description']}, {scene['cinematics']['camera_angle']}, {scene['cinematics']['lighting']}, {style} style, high quality."
            
            generate_skyreels_video(
                prompt=full_prompt,
                output_path=clip_path,
                duration_seconds=scene["duration"],
                resolution="720P",
                model=video_model
            )
            generated_clips.append(clip_path)

        # ------------------------------------------------------------------
        # Step 5: Generate Film Score with MusicGen
        # ------------------------------------------------------------------
        update_job_status(job_id, "processing", "generating_score", 75)
        
        from models.musicgen import generate_music, load_musicgen
        music_model = load_musicgen()
        audio_path = os.path.join(tmpdir, "score.wav")
        
        generate_music(
            prompt=f"A cinematic {style} soundtrack for a film about {prompt[:30]}, {scenes[0]['cinematics']['mood']} mood",
            output_path=audio_path,
            duration_seconds=target_seconds,
            model=music_model
        )

        # ------------------------------------------------------------------
        # Step 6: Assemble Scenes with FFmpeg
        # ------------------------------------------------------------------
        update_job_status(job_id, "processing", "assembling_film", 85)
        
        final_local_path = os.path.join(tmpdir, "final_movie.mp4")
        concat_list = os.path.join(tmpdir, "concat.txt")
        with open(concat_list, "w") as f:
            for clip in generated_clips:
                f.write(f"file '{clip}'\n")
                
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", concat_list,
            "-i", audio_path,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "18",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            final_local_path,
        ]
        subprocess.run(cmd, check=True, capture_output=True)

        # ------------------------------------------------------------------
        # Step 7 & 8: Upload and Save
        # ------------------------------------------------------------------
        update_job_status(job_id, "processing", "uploading", 90)
        
        output_url = upload_video(final_local_path, job_id, folder="my-studio/movies")
        thumbnail_url = get_thumbnail(output_url)
        
        update_job_status(job_id, "processing", "saving_to_library", 95)
        
        title = prompt[:50].strip()
        if len(prompt) > 50:
            title += "..."
            
        save_to_library(
            user_id=user_id,
            job_id=job_id,
            title=title,
            module="movie",
            video_url=output_url,
            thumbnail_url=thumbnail_url,
            duration=target_seconds,
        )

        create_notification(
            user_id=user_id,
            notification_type="job_complete",
            title="Movie Generation Complete",
            message=f"Your cinematic film '{title}' is ready.",
            data={"job_id": job_id, "module": "movie", "output_url": output_url},
        )

        logger.info(f"[{job_id}] Movie pipeline complete: {output_url}")
        return output_url

    except Exception as e:
        logger.error(f"[{job_id}] Movie pipeline failed: {e}")
        raise

    finally:
        if os.path.exists(tmpdir):
            shutil.rmtree(tmpdir, ignore_errors=True)
