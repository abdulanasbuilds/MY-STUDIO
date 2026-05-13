# MY STUDIO — filmaster.py
import logging
import os
import subprocess
import tempfile
from typing import Any

logger = logging.getLogger("my-studio")

CINEMATIC_PROFILES: dict[str, dict[str, Any]] = {
    "action": {"avg_shot_duration": 2.5, "cut_rhythm": "fast", "color_temperature": "cool", "camera_movement": "handheld", "recommended_lut": "action_teal"},
    "drama": {"avg_shot_duration": 6.0, "cut_rhythm": "slow", "color_temperature": "warm", "camera_movement": "steadicam", "recommended_lut": "warm_cinematic"},
    "documentary": {"avg_shot_duration": 4.0, "cut_rhythm": "medium", "color_temperature": "neutral", "camera_movement": "static", "recommended_lut": "desaturated_real"},
    "comedy": {"avg_shot_duration": 3.5, "cut_rhythm": "medium", "color_temperature": "warm", "camera_movement": "steadicam", "recommended_lut": "punchy_bright"},
    "horror": {"avg_shot_duration": 3.0, "cut_rhythm": "fast", "color_temperature": "cool", "camera_movement": "handheld", "recommended_lut": "horror_desaturated"},
    "scifi": {"avg_shot_duration": 3.5, "cut_rhythm": "medium", "color_temperature": "cool", "camera_movement": "steadicam", "recommended_lut": "scifi_teal_orange"},
}


def apply_cinematic_rhythm(
    scene_videos: list[str],
    script_analysis: dict | None = None,
    output_path: str = "/tmp/assembled.mp4",
    profile: dict[str, Any] | None = None,
) -> str:
    if profile is None:
        profile = CINEMATIC_PROFILES["drama"]
    logger.info(f"Assembling {len(scene_videos)} scenes with {profile['cut_rhythm']} rhythm")
    with tempfile.TemporaryDirectory(prefix="filmaster_") as tmpdir:
        trimmed_paths = []
        duration = profile["avg_shot_duration"]
        for i, clip in enumerate(scene_videos):
            trimmed = os.path.join(tmpdir, f"trimmed_{i:03d}.mp4")
            subprocess.run([
                "ffmpeg", "-y", "-i", clip,
                "-t", str(duration), "-c", "copy", trimmed
            ], check=True, capture_output=True)
            trimmed_paths.append(trimmed)
        concat_list = os.path.join(tmpdir, "concat.txt")
        with open(concat_list, "w") as f:
            for p in trimmed_paths:
                f.write(f"file '{p}'\n")
        subprocess.run([
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", concat_list, "-c", "copy", output_path
        ], check=True, capture_output=True)
    logger.info(f"Assembly complete: {output_path}")
    return output_path


def analyze_cinematic_reference(genre: str, style: str) -> dict[str, Any]:
    return CINEMATIC_PROFILES.get(style, CINEMATIC_PROFILES["drama"])
