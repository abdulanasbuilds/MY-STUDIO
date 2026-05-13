# MY STUDIO — human_feel.py
import logging
import os
import subprocess

logger = logging.getLogger("my-studio")

def process_video(video_path: str, output_path: str, options: dict) -> str:
    """Apply 12 rules. Returns path to polished video."""
    logger.info(f"Applying Human Feel processing to: {video_path}")
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Input video not found: {video_path}")

    # Determine presets
    preset_name = options.get("preset", "social_media")
    presets = {
        "social_media": {"grain": 8, "lut": "punchy", "warmth": True, "movement": False},
        "cinematic": {"grain": 15, "lut": "orange_teal", "warmth": True, "movement": True},
        "documentary": {"grain": 6, "lut": "desaturated", "warmth": False, "movement": False},
        "raw_authentic": {"grain": 4, "lut": "subtle", "warmth": True, "movement": False},
        "broadcast_news": {"grain": 0, "lut": "cool_professional", "warmth": False, "movement": False}
    }
    config = presets.get(preset_name, presets["social_media"])
    
    # Override with manual options
    grain_intensity = options.get("grain", config["grain"])
    lut_style = options.get("lut", config["lut"])
    audio_warmth = options.get("warmth", config["warmth"])
    camera_movement = options.get("movement", config["movement"])

    temp_audio = "/tmp/hf_audio.wav"
    subprocess.run(["ffmpeg", "-y", "-i", video_path, "-map", "0:a?", temp_audio], capture_output=True)
    has_audio = os.path.exists(temp_audio) and os.path.getsize(temp_audio) > 0

    vf_filters = []
    af_filters = []

    # RULE 2: Camera Movement
    if camera_movement:
        vf_filters.append("zoompan=z='min(zoom+0.0005,1.04)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1280x720")

    # RULE 4: Cinematic LUT / Grade
    if lut_style == "orange_teal":
        vf_filters.append("eq=contrast=1.1:saturation=1.2,colorbalance=rs=0.1:bs=-0.1")
    elif lut_style == "desaturated":
        vf_filters.append("eq=saturation=0.7:contrast=1.05")
    elif lut_style == "punchy":
        vf_filters.append("eq=contrast=1.15:saturation=1.3")
    else:
        vf_filters.append("eq=contrast=1.05:saturation=1.05")

    # RULE 9: Film Grain
    if grain_intensity > 0:
        vf_filters.append(f"noise=alls={grain_intensity}:allf=t+u")

    # RULE 10 & 12: Audio Warmth + Formant Variation
    if has_audio:
        if audio_warmth:
            af_filters.append("equalizer=f=300:width_type=h:width=200:g=2")
            af_filters.append("equalizer=f=5000:width_type=h:width=2000:g=-1")
            af_filters.append("aecho=0.8:0.9:40:0.05")
            
        # Subtle pitch randomization (Rule 12 fallback logic in FFmpeg)
        af_filters.append("asetrate=44100*1.002,aresample=44100")

    cmd = ["ffmpeg", "-y", "-i", video_path]
    if vf_filters: cmd.extend(["-vf", ",".join(vf_filters)])
    if af_filters: cmd.extend(["-af", ",".join(af_filters)])
    
    cmd.extend(["-c:v", "libx264", "-preset", "fast", "-crf", "18", "-c:a", "aac", "-b:a", "192k", output_path])
    subprocess.run(cmd, check=True, capture_output=True)
    
    if has_audio: os.remove(temp_audio)
    logger.info(f"Human Feel processing complete: {output_path}")
    return output_path
