# MY STUDIO — demucs.py
# PURPOSE: Demucs audio source separation
# OPEN SOURCE: github.com/facebookresearch/demucs
# CONNECTS TO: clipper_pipeline.py, audio_pipeline.py
# GPU: T4 (16GB)


def load_demucs() -> None:
    """Load Demucs model from /models/demucs/ volume."""
    raise NotImplementedError("Demucs loader — see PLAN.md Phase 4")


def separate_audio(
    input_path: str,
    output_dir: str,
) -> dict[str, str]:
    """Separate an audio file into individual stems using Demucs.

    Args:
        input_path: Path to the input audio file.
        output_dir: Directory to save the separated stems.

    Returns:
        Dictionary mapping stem names to file paths:
        {"vocals": "...", "drums": "...", "bass": "...", "other": "..."}.
    """
    raise NotImplementedError("Demucs separator — see PLAN.md Phase 4")
