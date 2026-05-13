# MY STUDIO — storage.py
# PURPOSE: Cloudinary upload/delete operations for all media output
# CONNECTS TO: All pipelines (upload output), main.py

import os
import logging
from typing import Any

logger = logging.getLogger("my-studio")


def configure_cloudinary() -> None:
    """Configure Cloudinary with environment variables."""
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api
    cloudinary.config(
        cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
        api_key=os.environ["CLOUDINARY_API_KEY"],
        api_secret=os.environ["CLOUDINARY_API_SECRET"],
        secure=True,
    )


def upload_video(
    file_path: str,
    job_id: str,
    folder: str = "my-studio/videos",
) -> str:
    """Upload a video file to Cloudinary.
    
    Args:
        file_path: Local path to the video file.
        job_id: Job ID used as public_id prefix.
        folder: Cloudinary folder path.
    
    Returns:
        Secure URL of the uploaded video.
    """
    configure_cloudinary()
    result: dict[str, Any] = cloudinary.uploader.upload(
        file_path,
        resource_type="video",
        folder=folder,
        public_id=f"{job_id}",
        overwrite=True,
    )
    url: str = result["secure_url"]
    logger.info(f"Uploaded video: {url}")
    return url


def upload_image(
    file_path: str,
    name: str,
    folder: str = "my-studio/images",
) -> str:
    """Upload an image file to Cloudinary.
    
    Args:
        file_path: Local path to the image file.
        name: Public ID for the image.
        folder: Cloudinary folder path.
    
    Returns:
        Secure URL of the uploaded image.
    """
    configure_cloudinary()
    result: dict[str, Any] = cloudinary.uploader.upload(
        file_path,
        resource_type="image",
        folder=folder,
        public_id=name,
        overwrite=True,
    )
    return result["secure_url"]


def upload_audio(
    file_path: str,
    name: str,
    folder: str = "my-studio/audio",
) -> str:
    """Upload an audio file to Cloudinary.
    
    Args:
        file_path: Local path to the audio file.
        name: Public ID for the audio.
    
    Returns:
        Secure URL of the uploaded audio.
    """
    configure_cloudinary()
    result: dict[str, Any] = cloudinary.uploader.upload(
        file_path,
        resource_type="video",  # Cloudinary uses 'video' for audio too
        folder=folder,
        public_id=name,
        overwrite=True,
    )
    return result["secure_url"]


def delete_file(
    public_id: str,
    resource_type: str = "video",
) -> None:
    """Delete a file from Cloudinary.
    
    Args:
        public_id: Cloudinary public ID of the file.
        resource_type: One of 'image', 'video', 'raw'.
    """
    configure_cloudinary()
    cloudinary.uploader.destroy(public_id, resource_type=resource_type)
    logger.info(f"Deleted {resource_type}: {public_id}")


def get_thumbnail(video_url: str) -> str:
    """Get a thumbnail URL from a Cloudinary video URL.
    
    Transforms the video URL to extract the first frame as a JPG.
    
    Args:
        video_url: Cloudinary secure URL of a video.
    
    Returns:
        URL of the thumbnail image.
    """
    # Replace video extension with .jpg and add transformation
    thumbnail_url = video_url.replace("/video/upload/", "/video/upload/so_0,w_640,h_360,c_fill/")
    thumbnail_url = thumbnail_url.rsplit(".", 1)[0] + ".jpg"
    return thumbnail_url
