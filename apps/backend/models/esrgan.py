# MY STUDIO — models/esrgan.py
# PURPOSE: Real-ESRGAN video/image upscaling and enhancement
# OPEN SOURCE: github.com/xinntao/Real-ESRGAN
# CONNECTS TO: All pipelines (optional enhancement step)
# GPU: T4 (16GB)

import logging
import os
import subprocess
from pathlib import Path
from typing import Any

logger = logging.getLogger("my-studio")

# Model weights directory (mounted via Modal volume)
MODEL_DIR = "/models/esrgan"


def load_esrgan(model_path: str = MODEL_DIR) -> dict[str, Any]:
    """Load Real-ESRGAN model from the volume.

    Initializes the Real-ESRGAN upscaler with the pretrained weights.
    Supports both image and video enhancement.

    Args:
        model_path: Path to the model weights directory.

    Returns:
        Dictionary containing the loaded model and config.

    Raises:
        FileNotFoundError: If model weights are not found.
    """
    weights_path = Path(model_path)
    if not weights_path.exists():
        raise FileNotFoundError(
            f"Real-ESRGAN weights not found at {model_path}. "
            "Run scripts/download-models.py first."
        )

    logger.info("Loading Real-ESRGAN model...")

    # Real-ESRGAN uses RRDBNet architecture
    import torch
    from basicsr.archs.rrdbnet_arch import RRDBNet

    # Load the model
    model_file = weights_path / "RealESRGAN_x4plus.pth"
    if not model_file.exists():
        # Try alternative weight name
        model_file = weights_path / "realesr-general-x4v3.pth"

    net = RRDBNet(
        num_in_ch=3,
        num_out_ch=3,
        num_feat=64,
        num_block=23,
        num_grow_ch=32,
        scale=4,
    )

    loadnet = torch.load(str(model_file), map_location="cpu")
    if "params_ema" in loadnet:
        net.load_state_dict(loadnet["params_ema"], strict=True)
    elif "params" in loadnet:
        net.load_state_dict(loadnet["params"], strict=True)
    else:
        net.load_state_dict(loadnet, strict=True)

    net.eval()
    net = net.half().to("cuda")

    logger.info("Real-ESRGAN model loaded successfully.")
    return {"model": net, "model_path": model_path, "scale": 4}


def enhance_video(
    input_path: str,
    output_path: str,
    scale: int = 4,
    model: dict[str, Any] | None = None,
) -> str:
    """Upscale and enhance a video using Real-ESRGAN.

    Processes each frame through the Real-ESRGAN model for
    super-resolution upscaling, then recombines with audio.

    Args:
        input_path: Path to the input video file.
        output_path: Where to save the enhanced video.
        scale: Upscaling factor (2 or 4). Default 4.
        model: Loaded Real-ESRGAN model (loads if None).

    Returns:
        Path to the enhanced video file.

    Raises:
        FileNotFoundError: If input video doesn't exist.
        RuntimeError: If enhancement fails.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input video not found: {input_path}")

    logger.info(f"Enhancing video: {input_path} (scale={scale}x)")

    if model is None:
        model = load_esrgan()

    # Extract frames
    frames_dir = "/tmp/esrgan_input_frames"
    enhanced_dir = "/tmp/esrgan_output_frames"
    os.makedirs(frames_dir, exist_ok=True)
    os.makedirs(enhanced_dir, exist_ok=True)

    # Get original FPS
    fps = _get_video_fps(input_path)

    # Extract frames
    cmd_extract = [
        "ffmpeg", "-y",
        "-i", input_path,
        os.path.join(frames_dir, "frame_%06d.png"),
    ]
    subprocess.run(cmd_extract, check=True, capture_output=True)

    # Enhance each frame
    frame_files = sorted(Path(frames_dir).glob("frame_*.png"))
    logger.info(f"Enhancing {len(frame_files)} frames...")

    for i, frame_file in enumerate(frame_files):
        enhanced_path = os.path.join(enhanced_dir, frame_file.name)
        _enhance_single_frame(str(frame_file), enhanced_path, model)

        if (i + 1) % 50 == 0:
            logger.info(f"Enhanced {i + 1}/{len(frame_files)} frames")

    # Extract audio from original video
    audio_path = "/tmp/esrgan_audio.aac"
    cmd_audio = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-vn", "-acodec", "aac",
        "-b:a", "192k",
        audio_path,
    ]
    audio_result = subprocess.run(cmd_audio, capture_output=True)
    has_audio = audio_result.returncode == 0 and os.path.exists(audio_path)

    # Recombine enhanced frames with audio
    cmd_combine = [
        "ffmpeg", "-y",
        "-framerate", str(fps),
        "-i", os.path.join(enhanced_dir, "frame_%06d.png"),
    ]
    if has_audio:
        cmd_combine.extend(["-i", audio_path])

    cmd_combine.extend([
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "16",
        "-pix_fmt", "yuv420p",
    ])
    if has_audio:
        cmd_combine.extend(["-c:a", "aac", "-b:a", "192k"])

    cmd_combine.extend(["-shortest", output_path])
    subprocess.run(cmd_combine, check=True, capture_output=True)

    # Cleanup
    import shutil
    shutil.rmtree(frames_dir, ignore_errors=True)
    shutil.rmtree(enhanced_dir, ignore_errors=True)
    if has_audio and os.path.exists(audio_path):
        os.remove(audio_path)

    logger.info(f"Video enhanced: {output_path}")
    return output_path


def enhance_image(
    input_path: str,
    output_path: str,
    scale: int = 4,
    model: dict[str, Any] | None = None,
) -> str:
    """Upscale and enhance a single image using Real-ESRGAN.

    Args:
        input_path: Path to the input image.
        output_path: Where to save the enhanced image.
        scale: Upscaling factor (2 or 4).
        model: Loaded Real-ESRGAN model (loads if None).

    Returns:
        Path to the enhanced image.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input image not found: {input_path}")

    if model is None:
        model = load_esrgan()

    _enhance_single_frame(input_path, output_path, model)
    logger.info(f"Image enhanced: {output_path}")
    return output_path


def _enhance_single_frame(
    input_path: str,
    output_path: str,
    model: dict[str, Any],
) -> None:
    """Enhance a single image frame with Real-ESRGAN.

    Args:
        input_path: Path to the input image.
        output_path: Path to save the enhanced image.
        model: Loaded Real-ESRGAN model dict.
    """
    import torch
    import numpy as np
    from PIL import Image

    net = model["model"]

    # Load image
    img = Image.open(input_path).convert("RGB")
    img_np = np.array(img).astype(np.float32) / 255.0

    # Convert to tensor: HWC -> CHW -> NCHW
    img_tensor = torch.from_numpy(img_np).permute(2, 0, 1).unsqueeze(0)
    img_tensor = img_tensor.half().to("cuda")

    # Run inference
    with torch.no_grad():
        output_tensor = net(img_tensor)

    # Convert back to image
    output_np = output_tensor.squeeze(0).permute(1, 2, 0).cpu().float().numpy()
    output_np = np.clip(output_np * 255.0, 0, 255).astype(np.uint8)

    output_img = Image.fromarray(output_np)
    output_img.save(output_path)


def _get_video_fps(video_path: str) -> float:
    """Get the FPS of a video file.

    Args:
        video_path: Path to the video file.

    Returns:
        Frames per second as a float.
    """
    result = subprocess.run(
        [
            "ffprobe", "-v", "quiet",
            "-select_streams", "v:0",
            "-show_entries", "stream=r_frame_rate",
            "-of", "csv=p=0",
            video_path,
        ],
        capture_output=True,
        text=True,
    )
    fps_str = result.stdout.strip()
    if "/" in fps_str:
        num, den = fps_str.split("/")
        return float(num) / float(den)
    return float(fps_str)
