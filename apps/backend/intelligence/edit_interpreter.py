# MY STUDIO — edit_interpreter.py
# PURPOSE: Natural language edit command interpretation
# CONNECTS TO: clipper_pipeline.py, movie_pipeline.py
# GPU: CPU (uses Gemini API)


def interpret_edit_command(
    command: str,
    video_metadata: dict,
) -> list[dict]:
    """Interpret a natural language edit command into structured operations.

    Parses user commands like "cut the first 10 seconds" or "add zoom
    on the speaker at 0:45" into a sequence of executable edit operations.

    Args:
        command: Natural language edit instruction from the user.
        video_metadata: Metadata about the video being edited, including:
            - "duration": Total duration in seconds.
            - "resolution": Tuple of (width, height).
            - "fps": Frames per second.
            - "scenes": List of detected scene boundaries.
            - "transcript": Transcript with timestamps (if available).

    Returns:
        List of operation dicts, each containing:
        - "operation": Operation type (e.g. "cut", "zoom", "speed",
          "add_text", "add_music", "transition", "crop", "color_grade").
        - "params": Dict of operation-specific parameters.
        - "start_time": Start time in seconds (if applicable).
        - "end_time": End time in seconds (if applicable).
        - "priority": Execution order priority (lower = first).
    """
    raise NotImplementedError("Edit interpreter — see PLAN.md Phase 7")
