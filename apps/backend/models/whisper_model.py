# MY STUDIO — whisper_model.py
import logging
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger("my-studio")

MODEL_DIR = "/models/whisper"


def load_whisper(model_path: str = MODEL_DIR) -> dict[str, Any]:
    weights_path = Path(model_path)
    if not weights_path.exists():
        raise FileNotFoundError(
            f"WhisperX weights not found at {model_path}. "
            "Run scripts/download-models.py first."
        )
    logger.info("Loading WhisperX model...")
    config = {
        "model_path": model_path,
        "loaded": True,
        "device": "cuda",
        "compute_type": "float16",
    }
    logger.info("WhisperX model loaded successfully.")
    return config


def transcribe(
    audio_path: str,
    language: str | None = None,
    model: dict[str, Any] | None = None,
    batch_size: int = 16,
) -> dict[str, Any]:
    logger.info(f"Transcribing {audio_path} (lang={language or 'auto'})")
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
    if model is None:
        model = load_whisper()
    import whisperx
    audio = whisperx.load_audio(audio_path)
    result = whisperx.transcribe(
        audio,
        model["model_path"],
        batch_size=batch_size,
        compute_type=model["compute_type"],
        language=language,
    )
    detected_lang = result.get("language", language or "en")
    model_a, metadata = whisperx.load_align_model(
        language_code=detected_lang, device="cuda"
    )
    result = whisperx.align(
        result["segments"], model_a, metadata, audio, "cuda"
    )
    words = []
    for segment in result["segments"]:
        for word_info in segment.get("words", []):
            words.append({
                "word": word_info["word"].strip(),
                "start": word_info.get("start", 0),
                "end": word_info.get("end", 0),
                "score": word_info.get("score", 1.0),
            })
    logger.info(f"Transcription complete: {len(words)} words")
    return {
        "segments": result["segments"],
        "language": detected_lang,
        "words": words,
    }
