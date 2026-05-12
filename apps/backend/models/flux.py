# MY STUDIO — flux.py
# PURPOSE: FLUX.1-schnell/dev image generation inference
# OPEN SOURCE: github.com/black-forest-labs/FLUX.1-schnell
# CONNECTS TO: thumbnail_pipeline.py, movie_pipeline.py
# GPU: A10G (24GB)


def load_flux() -> None:
    """Load FLUX.1 model from /models/flux/ volume."""
    raise NotImplementedError("FLUX.1 loader — see PLAN.md Phase 5")


def generate_image(
    prompt: str,
    output_path: str,
    width: int = 1024,
    height: int = 1024,
) -> str:
    """Generate image from text prompt using FLUX.1.

    Args:
        prompt: Text description of the image to generate.
        output_path: Where to save the output image.
        width: Output image width in pixels.
        height: Output image height in pixels.

    Returns:
        Path to the generated image file.
    """
    raise NotImplementedError("FLUX.1 generator — see PLAN.md Phase 5")
