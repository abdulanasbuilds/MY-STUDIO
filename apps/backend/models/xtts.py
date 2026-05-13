# MY STUDIO — models/xtts.py
import logging
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger("my-studio")

MODEL_DIR = "/models/xtts"


def load_xtts(model_path: str = MODEL_DIR) -> dict[str, Any]:
    weights_path = Path(model_path)
    if not weights_path.exists():
        raise FileNotFoundError(
            f"XTTS-v2 weights not found at {model_path}. "
            "Run scripts/download-models.py first."
        )
    logger.info("Loading XTTS-v2 voice cloning model...")
    from TTS.api import TTS
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=True)
    logger.info("XTTS-v2 model loaded successfully.")
    return {"tts": tts, "model_path": model_path}


def generate_multilingual_speech(
    text: str,
    reference_audio: str,
    output_path: str,
    language: str = "en",
    model: dict[str, Any] | None = None,
) -> str:
    if not os.path.exists(reference_audio):
        raise FileNotFoundError(f"Reference audio not found: {reference_audio}")
    logger.info(f"XTTS generating '{language}' speech using voice from {reference_audio}...")
    if model is None:
        model = load_xtts()
    tts = model["tts"]
    import torch
    with torch.no_grad():
        tts.tts_to_file(
            text=text,
            speaker_wav=reference_audio,
            language=language,
            file_path=output_path,
        )
    logger.info(f"Speech saved: {output_path}")
    return output_path
