# MY STUDIO — caption_engine.py
# PURPOSE: Render styled captions/subtitles onto video
# CONNECTS TO: clipper_pipeline.py, avatar_pipeline.py, dubbing_pipeline.py


def render_captions(
    video_path: str,
    transcript: list[dict],
    style: str,
    output_path: str,
) -> str:
    """Render styled captions onto a video file.

    Takes a transcript with word-level timestamps and burns
    stylized captions directly into the video frames.

    Available styles:
    - "hormozi": Bold white text, yellow highlight on active word,
      black outline, centered bottom third.
    - "minimal": Clean sans-serif, white with drop shadow, bottom center.
    - "karaoke": Word-by-word highlight with color sweep animation.
    - "news": Lower-third banner with speaker name and text.
    - "cinematic": Thin serif font, subtle fade in/out, letterboxed.
    - "tiktok": Large bold centered text, pop-in animation per word.
    - "subtitle": Standard SRT-style white on semi-transparent black bar.

    Args:
        video_path: Path to the input video file.
        transcript: List of segment dicts from WhisperX, each containing:
            - "start": Segment start time in seconds.
            - "end": Segment end time in seconds.
            - "text": Full segment text.
            - "words": List of word dicts with "start", "end", "word".
        style: Caption style preset name.
        output_path: Where to save the captioned video.

    Returns:
        Path to the video with rendered captions.
    """
    raise NotImplementedError("Caption engine — see PLAN.md Phase 4")
