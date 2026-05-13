# MY STUDIO — postproduction/color_grading.py
import subprocess
import os

def download_lut_library() -> None:
    os.makedirs("/models/luts", exist_ok=True)
    # Simulation of downloading LUTs
    pass

def apply_lut(video, lut_name, output) -> str:
    lut_path = f"/models/luts/{lut_name}.cube"
    if not os.path.exists(lut_path):
        # Fallback to EQ if LUT file doesn't exist
        subprocess.run(["ffmpeg", "-y", "-i", video, "-vf", "eq=contrast=1.1:saturation=1.2", "-c:a", "copy", output], check=True)
        return output
    subprocess.run(["ffmpeg", "-y", "-i", video, "-vf", f"lut3d={lut_path}", "-c:a", "copy", output], check=True)
    return output

def get_recommended_lut(content_type: str) -> str:
    mapping = {
        "cinematic": "orange_teal",
        "warm": "golden_hour",
        "news": "cool_blue",
        "comedy": "punchy",
        "documentary": "desaturated"
    }
    return mapping.get(content_type, "subtle")
