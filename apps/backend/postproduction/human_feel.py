# MY STUDIO — postproduction/human_feel.py
# PURPOSE: Apply 12 rules to make AI-generated content feel human
# CONNECTS TO: All pipelines (final processing step)

import logging
import os
import subprocess
import shutil

logger = logging.getLogger("my-studio")


def process_video(
    input_path: str,
    output_path: str,
    options: dict[str, Any] | None = None,
) -> str:
    """Apply human-feel processing to a video.

    Applies a combination of visual and audio filters to make the
    AI generation feel more natural, cinematic, and human-crafted.

    The 12 rules (subset implemented via FFmpeg filters):
    1. Color LUT / Grading (cinematic contrast)
    2. Film grain overlay
    3. Audio warmth (EQ)
    4. Loudness normalization (-14 LUFS)
    5. Subtle camera movement / shake (optional)

    Args:
        input_path: Path to input video.
        output_path: Path for processed output.
        options: Dict of which rules to apply and settings.

    Returns:
        Path to the processed video.
    """
    if options is None:
        options = {}
        
    logger.info(f"Applying Human Feel processing to: {input_path}")

    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input video not found: {input_path}")

    # Build FFmpeg filtergraph based on options
    vf_filters = []
    af_filters = []

    # 1. Color grading (simulate via EQ/curves if LUT not available)
    if options.get("color_grade", True):
        # Slightly boost contrast, saturation, and add a warm tint
        vf_filters.append("eq=contrast=1.05:saturation=1.1:gamma=1.02")
        vf_filters.append("colorbalance=rs=.05:bs=-.05")

    # 2. Film grain (noise)
    if options.get("film_grain", True):
        vf_filters.append("noise=alls=2:allf=t+u")

    # 3. Audio Warmth (EQ)
    if options.get("audio_warmth", True):
        # Slight bass boost and high-end roll off
        af_filters.append("equalizer=f=100:width_type=h:width=100:g=2")
        af_filters.append("equalizer=f=10000:width_type=h:width=1000:g=-1")

    # 4. Loudness normalization (LUFS)
    if options.get("normalize", True):
        af_filters.append("loudnorm=I=-14:LRA=11:TP=-1.5")

    cmd = ["ffmpeg", "-y", "-i", input_path]

    if vf_filters:
        cmd.extend(["-vf", ",".join(vf_filters)])
    if af_filters:
        cmd.extend(["-af", ",".join(af_filters)])

    cmd.extend([
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        output_path
    ])

    subprocess.run(cmd, check=True, capture_output=True)
    logger.info(f"Human Feel processing complete: {output_path}")

    return output_path
