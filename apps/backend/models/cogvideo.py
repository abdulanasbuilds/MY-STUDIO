# MY STUDIO — models/cogvideo.py
import logging
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger("my-studio")

MODEL_DIR = "/models/cogvideo"


def load_cogvideo(model_path: str = MODEL_DIR) -> dict[str, Any]:
    weights_path = Path(model_path)
    if not weights_path.exists():
        raise FileNotFoundError(
            f"CogVideoX weights not found at {model_path}. "
            "Run scripts/download-models.py first."
        )
    logger.info("Loading CogVideoX 1.5 model...")
    import torch
    from diffusers import CogVideoXPipeline
    pipe = CogVideoXPipeline.from_pretrained(
        str(weights_path),
        torch_dtype=torch.bfloat16,
    )
    pipe.enable_model_cpu_offload()
    pipe.vae.enable_tiling()
    logger.info("CogVideoX 1.5 model loaded successfully.")
    return {"pipeline": pipe, "model_path": model_path}


def generate_cogvideo(
    prompt: str,
    output_path: str,
    num_frames: int = 81,
    model: dict[str, Any] | None = None,
    num_inference_steps: int = 50,
    guidance_scale: float = 7.0,
) -> str:
    logger.info(f"CogVideoX generating {num_frames} frames: {prompt[:50]}...")
    if model is None:
        model = load_cogvideo()
    pipe = model["pipeline"]
    import torch
    result = pipe(
        prompt=prompt,
        num_videos_per_prompt=1,
        num_inference_steps=num_inference_steps,
        num_frames=num_frames,
        guidance_scale=guidance_scale,
        generator=torch.Generator(device="cuda").manual_seed(42),
    )
    frames = result.frames[0]
    import subprocess, tempfile
    with tempfile.TemporaryDirectory(prefix="cogvideo_") as tmpdir:
        for i, frame in enumerate(frames):
            frame.save(f"{tmpdir}/frame_{i:06d}.png")
        subprocess.run([
            "ffmpeg", "-y", "-framerate", "8",
            "-i", f"{tmpdir}/frame_%06d.png",
            "-c:v", "libx264", "-preset", "fast", "-crf", "18",
            "-pix_fmt", "yuv420p", output_path
        ], check=True, capture_output=True)
    logger.info(f"Video saved: {output_path}")
    return output_path
