# MY STUDIO — models/demucs.py
import logging
import os
from typing import Any

logger = logging.getLogger("my-studio")


def load_demucs() -> dict[str, Any]:
    logger.info("Loading Demucs audio separation model...")
    import torch
    from demucs.pretrained import get_model
    model = get_model("htdemucs")
    model.eval()
    if torch.cuda.is_available():
        model.to("cuda")
    logger.info("Demucs model loaded successfully.")
    return {"model": model}


def separate_audio(
    input_path: str,
    output_dir: str,
    model: dict[str, Any] | None = None,
) -> dict[str, str]:
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input audio not found: {input_path}")
    logger.info(f"Demucs separating audio: {input_path}")
    if model is None:
        model = load_demucs()
    import torch
    import torchaudio
    waveform, sr = torchaudio.load(input_path)
    if waveform.shape[0] > 1:
        waveform = waveform.mean(dim=0, keepdim=True)
    demucs_model = model["model"]
    os.makedirs(output_dir, exist_ok=True)
    with torch.no_grad():
        sources = demucs_model(waveform.unsqueeze(0).to("cuda"))[0].cpu()
    stem_names = ["drums", "bass", "other", "vocals"]
    stem_paths: dict[str, str] = {}
    for i, name in enumerate(stem_names):
        path = os.path.join(output_dir, f"{name}.wav")
        torchaudio.save(path, sources[i], sr)
        stem_paths[name] = path
    logger.info(f"Separation complete: {list(stem_paths.keys())}")
    return stem_paths
