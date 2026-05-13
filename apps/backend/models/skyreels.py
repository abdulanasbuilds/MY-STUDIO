# MY STUDIO — skyreels.py
import logging
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Any

logger = logging.getLogger("my-studio")

MODEL_DIR = "/models/skyreels"


def load_skyreels(model_path: str = MODEL_DIR) -> dict[str, Any]:
    weights_path = Path(model_path)
    if not weights_path.exists():
        raise FileNotFoundError(
            f"SkyReels-V3 weights not found at {model_path}. "
            "Run scripts/download-models.py first."
        )
    logger.info("Loading SkyReels-V3 model...")
    import torch
    from diffusers import SkyReelsPipeline
    pipe = SkyReelsPipeline.from_pretrained(
        str(weights_path),
        torch_dtype=torch.bfloat16,
    )
    pipe.enable_model_cpu_offload()
    logger.info("SkyReels-V3 model loaded successfully.")
    return {"pipeline": pipe, "model_path": model_path}


def generate_scene_video(
    prompt: str,
    duration_seconds: int,
    style: str | None = None,
    output_path: str = "/tmp/skyreels_output.mp4",
    seed: int = -1,
    resolution: str = "720p",
    model: dict[str, Any] | None = None,
) -> str:
    logger.info(f"SkyReels generating {duration_seconds}s scene: {prompt[:50]}...")
    if model is None:
        model = load_skyreels()
    pipe = model["pipeline"]
    import torch
    gen = torch.Generator(device="cuda").manual_seed(seed) if seed >= 0 else None
    num_frames = duration_seconds * 24
    result = pipe(
        prompt=prompt,
        num_frames=num_frames,
        height=720 if resolution == "720p" else 480,
        width=1280 if resolution == "720p" else 854,
        guidance_scale=7.0,
        generator=gen,
    )
    frames = result.frames[0]
    with tempfile.TemporaryDirectory(prefix="skyreels_") as tmpdir:
        for i, frame in enumerate(frames):
            frame.save(os.path.join(tmpdir, f"frame_{i:06d}.png"))
        subprocess.run([
            "ffmpeg", "-y", "-framerate", "24",
            "-i", os.path.join(tmpdir, "frame_%06d.png"),
            "-c:v", "libx264", "-preset", "fast", "-crf", "18",
            "-pix_fmt", "yuv420p", output_path
        ], check=True, capture_output=True)
    logger.info(f"Scene video saved: {output_path}")
    return output_path


def generate_multiple_takes(
    prompt: str,
    duration_seconds: int,
    style: str | None = None,
    output_dir: str = "/tmp/skyreels_takes",
    num_takes: int = 2,
    model: dict[str, Any] | None = None,
) -> list[str]:
    if model is None:
        model = load_skyreels()
    os.makedirs(output_dir, exist_ok=True)
    takes = []
    for i in range(num_takes):
        out = os.path.join(output_dir, f"take_{i}.mp4")
        generate_scene_video(
            prompt=prompt, duration_seconds=duration_seconds,
            style=style, output_path=out, seed=i * 1000, model=model,
        )
        takes.append(out)
    return takes
