# MY STUDIO — models/hunyuan_video.py
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger("my-studio")

MODEL_DIR = "/models/hunyuan-video"


def load_hunyuan_video(model_path: str = MODEL_DIR) -> dict[str, Any]:
    weights_path = Path(model_path)
    if not weights_path.exists():
        raise FileNotFoundError(
            f"HunyuanVideo weights not found at {model_path}. "
            "Run scripts/download-models.py first."
        )
    logger.info("Loading HunyuanVideo model...")
    import torch
    from diffusers import HunyuanVideoPipeline
    pipe = HunyuanVideoPipeline.from_pretrained(
        str(weights_path),
        torch_dtype=torch.bfloat16,
    )
    pipe.enable_model_cpu_offload()
    logger.info("HunyuanVideo model loaded successfully.")
    return {"pipeline": pipe, "model_path": model_path}


def generate_video(
    model: dict[str, Any],
    prompt: str,
    negative_prompt: str = "",
    width: int = 1280,
    height: int = 720,
    num_frames: int = 77,
    guidance_scale: float = 7.5,
    output_path: str = "/tmp/hunyuan_output.mp4",
) -> str:
    logger.info(f"HunyuanVideo generating {num_frames} frames: {prompt[:50]}...")
    pipe = model["pipeline"]
    import torch, subprocess, tempfile
    result = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        height=height,
        width=width,
        num_frames=num_frames,
        guidance_scale=guidance_scale,
        generator=torch.Generator(device="cuda").manual_seed(42),
    )
    frames = result.frames[0]
    with tempfile.TemporaryDirectory(prefix="hunyuan_") as tmpdir:
        for i, frame in enumerate(frames):
            frame.save(f"{tmpdir}/frame_{i:06d}.png")
        fps = num_frames / max(1, num_frames / 8)
        subprocess.run([
            "ffmpeg", "-y", "-framerate", str(int(fps)),
            "-i", f"{tmpdir}/frame_%06d.png",
            "-c:v", "libx264", "-preset", "fast", "-crf", "18",
            "-pix_fmt", "yuv420p", output_path
        ], check=True, capture_output=True)
    logger.info(f"Video saved: {output_path}")
    return output_path
