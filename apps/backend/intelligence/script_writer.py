# MY STUDIO — script_writer.py
# PURPOSE: AI screenplay and script generation
# CONNECTS TO: movie_pipeline.py, documentary_pipeline.py
# GPU: CPU (uses Gemini API)


def generate_screenplay(
    prompt: str,
    genre: str,
    duration_minutes: int,
) -> dict:
    """Generate a full screenplay from a prompt using Gemini.

    Creates a structured screenplay with scenes, dialogue, and
    visual directions based on the user's concept.

    Args:
        prompt: Creative brief or concept for the screenplay.
        genre: Genre of the screenplay (drama, comedy, horror, etc.).
        duration_minutes: Target duration in minutes.

    Returns:
        Dictionary containing:
        - "title": Generated title for the screenplay.
        - "logline": One-sentence summary.
        - "scenes": List of scene dicts with "scene_number",
          "location", "time_of_day", "description", "dialogue",
          "visual_direction", and "duration_seconds".
        - "characters": List of character descriptions.
        - "total_duration_seconds": Estimated total runtime.
    """
    raise NotImplementedError("Script writer — see PLAN.md Phase 6")
