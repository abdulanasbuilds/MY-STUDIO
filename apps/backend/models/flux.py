# MY STUDIO — models/flux.py
import logging
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger("my-studio")

MODEL_DIR = "/models/flux"


def load_flux(model_path: str = MODEL_DIR) -> dict[str, Any]:
    weights_path = Path(model_path)
    if not weights_path.exists():
        raise FileNotFoundError(
            f"FLUX.1 weights not found at {model_path}. "
            "Run scripts/download-models.py first."
        )
    logger.info("Loading FLUX.1 model...")
    import torch
    from diffusers import FluxPipeline
    pipe = FluxPipeline.from_pretrained(
        str(weights_path),
        torch_dtype=torch.bfloat16,
    )
    pipe.to("cuda")
    pipe.enable_model_cpu_offload()
    logger.info("FLUX.1 model loaded successfully.")
    return {"pipeline": pipe, "model_path": model_path}


def generate_image(
    prompt: str,
    output_path: str,
    width: int = 1024,
    height: int = 1024,
    model: dict[str, Any] | None = None,
    num_inference_steps: int = 28,
    guidance_scale: float = 3.5,
) -> str:
    logger.info(f"FLUX.1 generating image ({width}x{height}): {prompt[:50]}...")
    if model is None:
        model = load_flux()
    pipe = model["pipeline"]
    import torch
    result = pipe(
        prompt=prompt,
        width=width,
        height=height,
        num_inference_steps=num_inference_steps,
        guidance_scale=guidance_scale,
        generator=torch.Generator(device="cuda").manual_seed(42),
    )
    images = result.images
    if images:
        images[0].save(output_path)
    logger.info(f"Image saved: {output_path}")
    return output_path
