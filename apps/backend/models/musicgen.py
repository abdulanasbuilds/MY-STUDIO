# MY STUDIO — models/musicgen.py
import logging
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger("my-studio")

MODEL_DIR = "/models/musicgen"


def load_musicgen(model_path: str = MODEL_DIR) -> dict[str, Any]:
    weights_path = Path(model_path)
    if not weights_path.exists():
        raise FileNotFoundError(
            f"MusicGen weights not found at {model_path}. "
            "Run scripts/download-models.py first."
        )
    logger.info("Loading MusicGen model...")
    from audiocraft.models import MusicGen
    model = MusicGen.get_pretrained("facebook/musicgen-medium", device="cuda")
    logger.info("MusicGen model loaded successfully.")
    return {"model": model, "model_path": model_path}


def generate_music(
    prompt: str,
    output_path: str,
    duration_seconds: int = 30,
    model: dict[str, Any] | None = None,
) -> str:
    logger.info(f"MusicGen generating {duration_seconds}s track: {prompt[:50]}...")
    if model is None:
        model = load_musicgen()
    mg = model["model"]
    mg.set_generation_params(duration=min(30, duration_seconds))
    import torch
    with torch.no_grad():
        wav = mg.generate([prompt], progress=True)
    import soundfile as sf
    audio = wav[0, 0].cpu().numpy()
    sf.write(output_path, audio, mg.sample_rate)
    logger.info(f"Music saved: {output_path}")
    return output_path
