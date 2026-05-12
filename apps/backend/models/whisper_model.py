# MY STUDIO — whisper_model.py
# PURPOSE: WhisperX transcription with word-level timestamps
# OPEN SOURCE: github.com/m-bain/whisperX
# CONNECTS TO: clipper_pipeline.py, dubbing_pipeline.py, caption_engine.py
# GPU: T4 (16GB)


def load_whisper() -> None:
    """Load WhisperX model from /models/whisper/ volume."""
    raise NotImplementedError("WhisperX loader — see PLAN.md Phase 4")


def transcribe(
    audio_path: str,
    language: str | None = None,
) -> dict:
    """Transcribe audio with word-level timestamps using WhisperX.

    Args:
        audio_path: Path to the audio file to transcribe.
        language: Language code (e.g. "en", "es"). Auto-detected if None.

    Returns:
        Dictionary containing:
        - "segments": List of segment dicts with "start", "end", "text",
          and "words" (list of word-level dicts with "start", "end", "word").
        - "language": Detected or specified language code.
    """
    raise NotImplementedError("WhisperX transcriber — see PLAN.md Phase 4")
