# MY STUDIO — musicgen.py
# PURPOSE: AudioCraft/MusicGen music generation inference
# OPEN SOURCE: github.com/facebookresearch/audiocraft
# CONNECTS TO: audio_pipeline.py, movie_pipeline.py
# GPU: A10G (24GB)


def load_musicgen() -> None:
    """Load MusicGen model from /models/musicgen/ volume."""
    raise NotImplementedError("MusicGen loader — see PLAN.md Phase 5")


def generate_music(
    prompt: str,
    output_path: str,
    duration_seconds: int = 30,
) -> str:
    """Generate music from a text prompt using MusicGen.

    Args:
        prompt: Text description of the music to generate.
        output_path: Where to save the output audio file.
        duration_seconds: Duration of generated music in seconds.

    Returns:
        Path to the generated audio file.
    """
    raise NotImplementedError("MusicGen generator — see PLAN.md Phase 5")
