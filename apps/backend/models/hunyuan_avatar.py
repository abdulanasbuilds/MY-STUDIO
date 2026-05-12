# MY STUDIO — models/hunyuan_avatar.py
# PURPOSE: HunyuanVideo-Avatar model loading and inference
# MODEL: https://github.com/Tencent/HunyuanVideo-Avatar
# GPU: A100 (80GB) — generates talking head videos from image + audio
# CONNECTS TO: pipelines/avatar_pipeline.py

import logging
import os
import subprocess
from pathlib import Path
from typing import Any

logger = logging.getLogger("my-studio")

# Model weights directory (mounted via Modal volume)
MODEL_DIR = "/models/hunyuan-avatar"


def load_hunyuan_avatar(model_path: str = MODEL_DIR) -> dict[str, Any]:
    """Load the HunyuanVideo-Avatar model from disk.

    Uses the diffusers pipeline with custom HunyuanVideo-Avatar weights.
    The model is loaded once and cached in memory for subsequent calls.

    Args:
        model_path: Path to the model weights directory.

    Returns:
        Dictionary containing the loaded pipeline and config.

    Raises:
        FileNotFoundError: If model weights are not found at the given path.
        RuntimeError: If model loading fails.
    """
    import torch
    from diffusers import DiffusionPipeline

    weights_path = Path(model_path)
    if not weights_path.exists():
        raise FileNotFoundError(
            f"HunyuanVideo-Avatar weights not found at {model_path}. "
            "Run scripts/download-models.py first."
        )

    logger.info("Loading HunyuanVideo-Avatar model...")

    pipe = DiffusionPipeline.from_pretrained(
        str(weights_path),
        torch_dtype=torch.float16,
        variant="fp16",
    )
    pipe.to("cuda")

    # Enable memory optimizations
    pipe.enable_model_cpu_offload()

    logger.info("HunyuanVideo-Avatar model loaded successfully.")
    return {"pipeline": pipe, "model_path": model_path}


def generate_avatar_video(
    model: dict[str, Any],
    image_path: str,
    audio_path: str,
    duration_seconds: float = 10.0,
    output_path: str = "/tmp/avatar_output.mp4",
) -> str:
    """Generate a talking head video from an image and audio.

    Takes a face image and driving audio, produces a video of the face
    speaking the audio with natural head movements and expressions.

    Args:
        model: Loaded HunyuanVideo-Avatar model dict from load_hunyuan_avatar().
        image_path: Path to the source face image (JPG/PNG).
        audio_path: Path to the driving audio file (WAV/MP3).
        duration_seconds: Target duration in seconds.
        output_path: Path to write the output video.

    Returns:
        Path to the generated video file.

    Raises:
        FileNotFoundError: If image or audio files don't exist.
        RuntimeError: If video generation fails.
    """
    import torch
    from PIL import Image

    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Face image not found: {image_path}")
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    logger.info(
        f"Generating avatar video: image={image_path}, "
        f"audio={audio_path}, duration={duration_seconds}s"
    )

    pipe = model["pipeline"]

    # Load and preprocess the face image
    face_image = Image.open(image_path).convert("RGB")

    # Generate the avatar video
    # HunyuanVideo-Avatar uses image + audio conditioning
    result = pipe(
        image=face_image,
        audio_path=audio_path,
        num_frames=int(duration_seconds * 25),  # 25 fps
        height=512,
        width=512,
        num_inference_steps=30,
        guidance_scale=7.5,
        generator=torch.Generator(device="cuda").manual_seed(42),
    )

    # Export frames to video using FFmpeg
    frames = result.frames[0]  # List of PIL Images
    _frames_to_video(frames, audio_path, output_path)

    logger.info(f"Avatar video generated: {output_path}")
    return output_path


def _frames_to_video(
    frames: list[Any],
    audio_path: str,
    output_path: str,
    fps: int = 25,
) -> None:
    """Convert a list of PIL Image frames to a video with audio.

    Uses FFmpeg to combine the frames into an MP4 and mux the audio track.

    Args:
        frames: List of PIL Image objects (one per frame).
        audio_path: Path to the audio file to mux in.
        output_path: Path to write the output MP4.
        fps: Frames per second for the output video.
    """
    import tempfile

    # Write frames to a temporary directory
    with tempfile.TemporaryDirectory(prefix="hunyuan_frames_") as tmpdir:
        for i, frame in enumerate(frames):
            frame_path = os.path.join(tmpdir, f"frame_{i:06d}.png")
            frame.save(frame_path)

        # Combine frames + audio into video
        cmd = [
            "ffmpeg", "-y",
            "-framerate", str(fps),
            "-i", os.path.join(tmpdir, "frame_%06d.png"),
            "-i", audio_path,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            output_path,
        ]
        subprocess.run(cmd, check=True, capture_output=True)
