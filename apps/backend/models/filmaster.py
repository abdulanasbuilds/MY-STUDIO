# MY STUDIO — filmaster.py
import logging

logger = logging.getLogger("my-studio")

def apply_cinematic_rhythm(scene_videos: list[str], script_analysis: dict, output_path: str) -> str:
    """Assemble best takes in order with cinematic rhythm control."""
    import os, subprocess, tempfile
    
    concat_list = tempfile.mktemp(suffix=".txt")
    with open(concat_list, "w") as f:
        for clip in scene_videos:
            f.write(f"file '{clip}'\n")
            
    cmd = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", concat_list, "-c", "copy", output_path
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    os.remove(concat_list)
    return output_path

def analyze_cinematic_reference(genre: str, style: str) -> dict:
    """Get cinematic reference parameters for genre/style."""
    cinematic_profiles = {
        "action": {"avg_shot_duration": 2.5, "cut_rhythm": "fast", "color_temperature": "cool", "camera_movement": "handheld", "recommended_lut": "action_teal"},
        "drama": {"avg_shot_duration": 6.0, "cut_rhythm": "slow", "color_temperature": "warm", "camera_movement": "steadicam", "recommended_lut": "warm_cinematic"},
        "documentary": {"avg_shot_duration": 4.0, "cut_rhythm": "medium", "color_temperature": "neutral", "camera_movement": "static", "recommended_lut": "desaturated_real"},
        "comedy": {"avg_shot_duration": 3.5, "cut_rhythm": "medium", "color_temperature": "warm", "camera_movement": "steadicam", "recommended_lut": "punchy_bright"},
        "horror": {"avg_shot_duration": 3.0, "cut_rhythm": "fast", "color_temperature": "cool", "camera_movement": "handheld", "recommended_lut": "horror_desaturated"},
        "scifi": {"avg_shot_duration": 3.5, "cut_rhythm": "medium", "color_temperature": "cool", "camera_movement": "steadicam", "recommended_lut": "scifi_teal_orange"}
    }
    return cinematic_profiles.get(style, cinematic_profiles["drama"])
