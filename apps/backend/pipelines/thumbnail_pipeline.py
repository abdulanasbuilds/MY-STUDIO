# MY STUDIO — pipelines/thumbnail_pipeline.py
# PURPOSE: Generate thumbnails using FLUX.1 image generation
# TOOLS: FLUX.1 (image generation) -> Pillow (compositing) -> Cloudinary (upload)
# CONNECTS TO: main.py generate_thumbnail endpoint, models/flux.py
# GPU: A10G (24GB)

import logging
import os
import shutil
import tempfile
from typing import Any

from db import update_job_status, save_to_library, create_notification
from storage import upload_image

logger = logging.getLogger("my-studio")


def run_thumbnail_pipeline(data: dict[str, Any]) -> str:
    """Run the thumbnail generation pipeline.

    Steps:
        1. Parse prompt and style parameters
        2. Generate base image with FLUX.1
        3. Apply text overlays and compositing with Pillow (simulated)
        4. Upload to Cloudinary
        5. Clean up temp files

    Args:
        data: Request data containing prompt, style, platform, count, job_id, user_id.

    Returns:
        Cloudinary URL of the generated thumbnail (first one).
    """
    job_id = data["job_id"]
    user_id = data["user_id"]
    prompt = data["prompt"]
    style = data.get("style", "photorealistic")
    platform = data.get("platform", "youtube")
    count = data.get("count", 3)

    # Resolution based on platform
    width, height = 1280, 720
    if platform in ["tiktok", "instagram", "shorts", "reels"]:
        width, height = 1080, 1920
    elif platform == "instagram_square":
        width, height = 1080, 1080

    tmpdir = tempfile.mkdtemp(prefix="thumbnail_pipeline_")

    try:
        update_job_status(job_id, "processing", "generating_base_images", 20)
        from models.flux import generate_image, load_flux
        flux_model = load_flux()
        
        generated_urls = []
        for i in range(count):
            progress = int(20 + (i / count) * 50)
            update_job_status(job_id, "processing", f"generating_image_{i+1}", progress)
            
            img_path = os.path.join(tmpdir, f"thumb_{i}.png")
            enhanced_prompt = f"{prompt}, {style} style, high quality, highly detailed"
            
            generate_image(
                prompt=enhanced_prompt,
                output_path=img_path,
                width=width,
                height=height,
                model=flux_model
            )
            
            # (In production: Pillow compositing for text overlay goes here)
            
            update_job_status(job_id, "processing", f"uploading_image_{i+1}", progress + 10)
            url = upload_image(img_path, f"{job_id}_{i}")
            generated_urls.append(url)

        update_job_status(job_id, "processing", "saving_to_library", 90)
        
        # Save the primary one to the library
        primary_url = generated_urls[0]
        
        title = f"Thumbnail: {prompt[:30].strip()}"
        save_to_library(
            user_id=user_id,
            job_id=job_id,
            title=title,
            module="thumbnails",
            video_url=primary_url, # Storing image URL in the video_url column
            thumbnail_url=primary_url,
        )

        create_notification(
            user_id=user_id,
            notification_type="job_complete",
            title="Thumbnails Ready",
            message=f"Generated {count} thumbnails for '{prompt[:20]}...'",
            data={"job_id": job_id, "module": "thumbnails", "output_url": primary_url},
        )

        logger.info(f"[{job_id}] Thumbnail pipeline complete: {primary_url}")
        
        # In a real implementation we might return a JSON manifest with all URLs
        # Returning primary_url for simple polling compatibility
        return primary_url

    except Exception as e:
        logger.error(f"[{job_id}] Thumbnail pipeline failed: {e}")
        raise

    finally:
        if os.path.exists(tmpdir):
            shutil.rmtree(tmpdir, ignore_errors=True)
