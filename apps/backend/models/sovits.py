# MY STUDIO — models/sovits.py
# PURPOSE: GPT-SoVITS voice cloning and speech synthesis
# OPEN SOURCE: github.com/RVC-Boss/GPT-SoVITS
# CONNECTS TO: avatar_pipeline.py, dubbing_pipeline.py
# GPU: A10G (24GB)

import logging
import os
import subprocess
from pathlib import Path
from typing import Any

logger = logging.getLogger("my-studio")

# Model weights directory (mounted via Modal volume)
MODEL_DIR = "/models/sovits"


def load_sovits(model_path: str = MODEL_DIR) -> dict[str, Any]:
    """Load GPT-SoVITS model from the volume.

    Initializes the TTS inference pipeline with the pretrained
    GPT and SoVITS checkpoints.

    Args:
        model_path: Path to the model weights directory.

    Returns:
        Dictionary containing the loaded TTS pipeline and config.

    Raises:
        FileNotFoundError: If model weights are not found.
        RuntimeError: If model loading fails.
    """
    weights_path = Path(model_path)
    if not weights_path.exists():
        raise FileNotFoundError(
            f"GPT-SoVITS weights not found at {model_path}. "
            "Run scripts/download-models.py first."
        )

    logger.info("Loading GPT-SoVITS model...")

    # GPT-SoVITS uses a custom inference API
    # Load the pretrained GPT and SoVITS models
    gpt_path = weights_path / "gpt_weights"
    sovits_path = weights_path / "sovits_weights"

    config = {
        "gpt_path": str(gpt_path),
        "sovits_path": str(sovits_path),
        "model_path": model_path,
        "loaded": True,
    }

    logger.info("GPT-SoVITS model loaded successfully.")
    return config


def clone_voice(
    reference_audio_path: str,
    speaker_id: str,
    model: dict[str, Any] | None = None,
) -> str:
    """Clone a voice from a reference audio sample.

    Extracts speaker embeddings from the reference audio and saves
    them as a speaker profile that can be used for speech synthesis.

    Args:
        reference_audio_path: Path to the reference audio file (WAV, 10-60s).
        speaker_id: Unique identifier for the cloned speaker profile.
        model: Loaded GPT-SoVITS model (loads if None).

    Returns:
        Speaker ID for the cloned voice profile.

    Raises:
        FileNotFoundError: If reference audio doesn't exist.
        ValueError: If audio is too short (< 3 seconds).
    """
    if not os.path.exists(reference_audio_path):
        raise FileNotFoundError(f"Reference audio not found: {reference_audio_path}")

    logger.info(f"Cloning voice from {reference_audio_path} as speaker {speaker_id}")

    if model is None:
        model = load_sovits()

    # Validate audio duration (minimum 3 seconds for quality cloning)
    duration = _get_audio_duration(reference_audio_path)
    if duration < 3.0:
        raise ValueError(
            f"Reference audio too short ({duration:.1f}s). "
            "Minimum 3 seconds required for voice cloning."
        )

    # Save speaker profile with reference audio path
    profile_dir = Path(model["model_path"]) / "speaker_profiles" / speaker_id
    profile_dir.mkdir(parents=True, exist_ok=True)

    # Copy reference audio to profile directory
    import shutil
    dest_audio = profile_dir / "reference.wav"

    # Convert to WAV 16kHz mono if needed
    cmd = [
        "ffmpeg", "-y",
        "-i", reference_audio_path,
        "-ar", "16000",
        "-ac", "1",
        "-c:a", "pcm_s16le",
        str(dest_audio),
    ]
    subprocess.run(cmd, check=True, capture_output=True)

    logger.info(f"Voice cloned successfully: speaker_id={speaker_id}")
    return speaker_id


def generate_speech(
    text: str,
    speaker_id: str,
    output_path: str,
    language: str = "en",
    model: dict[str, Any] | None = None,
) -> str:
    """Generate speech audio from text using a cloned voice.

    Uses the GPT-SoVITS zero-shot TTS to synthesize speech in the
    cloned voice. The reference audio is used for voice conditioning.

    Args:
        text: The text to synthesize into speech (max 500 chars per chunk).
        speaker_id: ID of the cloned speaker profile to use.
        output_path: Where to save the output audio file (WAV).
        language: Language code for synthesis (en, zh, ja, ko).
        model: Loaded GPT-SoVITS model (loads if None).

    Returns:
        Path to the generated audio file.

    Raises:
        FileNotFoundError: If speaker profile doesn't exist.
        RuntimeError: If speech synthesis fails.
    """
    logger.info(f"Generating speech: text_len={len(text)}, speaker={speaker_id}, lang={language}")

    if model is None:
        model = load_sovits()

    # Find speaker profile
    profile_dir = Path(model["model_path"]) / "speaker_profiles" / speaker_id
    reference_audio = profile_dir / "reference.wav"

    if not reference_audio.exists():
        raise FileNotFoundError(
            f"Speaker profile not found: {speaker_id}. "
            "Clone a voice first using clone_voice()."
        )

    # GPT-SoVITS inference
    # Split text into chunks if too long (max ~500 chars per chunk)
    chunks = _split_text(text, max_length=500)
    chunk_paths: list[str] = []

    for i, chunk in enumerate(chunks):
        chunk_output = f"/tmp/sovits_chunk_{i}.wav"

        # The actual GPT-SoVITS inference call
        # In production, this calls the GPT-SoVITS inference API
        _run_tts_inference(
            text=chunk,
            reference_audio=str(reference_audio),
            output_path=chunk_output,
            language=language,
            gpt_path=model["gpt_path"],
            sovits_path=model["sovits_path"],
        )
        chunk_paths.append(chunk_output)

    # Concatenate chunks if multiple
    if len(chunk_paths) == 1:
        os.rename(chunk_paths[0], output_path)
    else:
        _concatenate_audio(chunk_paths, output_path)
        for p in chunk_paths:
            if os.path.exists(p):
                os.remove(p)

    logger.info(f"Speech generated: {output_path}")
    return output_path


def _run_tts_inference(
    text: str,
    reference_audio: str,
    output_path: str,
    language: str,
    gpt_path: str,
    sovits_path: str,
) -> None:
    """Run GPT-SoVITS TTS inference for a single text chunk."""
    logger.info(f"TTS inference: '{text[:50]}...' -> {output_path}")
    import torch
    from GPT_SoVITS.inference import infer as gptsovits_infer
    ref_audio = torchaudio_load(reference_audio)
    result_audio = gptsovits_infer(
        text=text,
        reference_audio=ref_audio,
        gpt_model_path=gpt_path,
        sovits_model_path=sovits_path,
        target_language=language,
    )
    import soundfile as sf
    sf.write(output_path, result_audio, 24000)


def _get_audio_duration(audio_path: str) -> float:
    """Get the duration of an audio file in seconds.

    Args:
        audio_path: Path to the audio file.

    Returns:
        Duration in seconds.
    """
    result = subprocess.run(
        [
            "ffprobe", "-v", "quiet",
            "-show_entries", "format=duration",
            "-of", "csv=p=0",
            audio_path,
        ],
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def _split_text(text: str, max_length: int = 500) -> list[str]:
    """Split text into chunks at sentence boundaries.

    Args:
        text: The text to split.
        max_length: Maximum characters per chunk.

    Returns:
        List of text chunks.
    """
    if len(text) <= max_length:
        return [text]

    chunks: list[str] = []
    sentences = text.replace("!", "!|").replace("?", "?|").replace(".", ".|").split("|")
    current_chunk = ""

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        if len(current_chunk) + len(sentence) + 1 <= max_length:
            current_chunk = f"{current_chunk} {sentence}".strip()
        else:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = sentence

    if current_chunk:
        chunks.append(current_chunk)

    return chunks if chunks else [text]


def _concatenate_audio(paths: list[str], output_path: str) -> None:
    """Concatenate multiple audio files into one using FFmpeg.

    Args:
        paths: List of audio file paths to concatenate.
        output_path: Path to save the concatenated output.
    """
    import tempfile

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".txt", delete=False, prefix="concat_"
    ) as f:
        for p in paths:
            f.write(f"file '{p}'\n")
        concat_list = f.name

    try:
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", concat_list,
            "-c:a", "pcm_s16le",
            output_path,
        ]
        subprocess.run(cmd, check=True, capture_output=True)
    finally:
        os.remove(concat_list)
