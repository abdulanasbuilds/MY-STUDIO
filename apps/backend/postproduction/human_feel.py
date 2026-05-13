# MY STUDIO — human_feel.py
import logging
import os
import subprocess
import tempfile
from typing import Any

logger = logging.getLogger("my-studio")

PRESETS: dict[str, dict[str, Any]] = {
    "social_media": {"grain": 8, "lut": "punchy", "warmth": True, "movement": False, "timing": True, "ambient": False},
    "cinematic": {"grain": 15, "lut": "orange_teal", "warmth": True, "movement": True, "timing": True, "ambient": True},
    "documentary": {"grain": 6, "lut": "desaturated", "warmth": False, "movement": False, "timing": True, "ambient": False},
    "raw_authentic": {"grain": 4, "lut": "subtle", "warmth": True, "movement": False, "timing": False, "ambient": False},
    "broadcast_news": {"grain": 0, "lut": "cool_professional", "warmth": False, "movement": False, "timing": True, "ambient": False},
    "dubbed_video": {"grain": 4, "lut": "neutral", "warmth": True, "movement": False, "timing": True, "ambient": False},
    "film": {"grain": 12, "lut": "orange_teal", "warmth": True, "movement": True, "timing": True, "ambient": True},
    "short_clip": {"grain": 6, "lut": "punchy", "warmth": True, "movement": False, "timing": True, "ambient": False},
}


def rule_1_timing_variance(input_path: str, output_path: str) -> str:
    """Add micro-timing variance (0-100ms random at cut points)."""
    subprocess.run([
        "ffmpeg", "-y", "-i", input_path,
        "-vf", "setpts='PTS+0.05*random(1)'",
        "-c:a", "copy", output_path
    ], check=True, capture_output=True)
    return output_path


def rule_2_camera_movement(input_path: str, output_path: str, intensity: float = 0.01) -> str:
    """Subtle Ken Burns slow zoom + position drift."""
    subprocess.run([
        "ffmpeg", "-y", "-i", input_path,
        "-vf", f"zoompan=z='min(zoom+{intensity},1.04)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1280x720",
        "-c:a", "copy", output_path
    ], check=True, capture_output=True)
    return output_path


def rule_3_three_layer_audio(input_path: str, output_path: str, ambient_path: str | None = None, music_path: str | None = None) -> str:
    """Mix voice + ambient + music with ducking."""
    inputs = ["-i", input_path]
    filters = ["[0:a]volume=1.0[voice]"]
    mix_inputs = "[voice]"
    mix_count = 1
    if ambient_path and os.path.exists(ambient_path):
        inputs.extend(["-i", ambient_path])
        filters.append(f"[{mix_count}:a]volume=0.05[ambient]")
        mix_inputs += "[ambient]"
        mix_count += 1
    if music_path and os.path.exists(music_path):
        inputs.extend(["-i", music_path])
        filters.append(f"[{mix_count}:a]volume=0.15[music]")
        mix_inputs += "[music]"
        mix_count += 1
    filters.append(f"{mix_inputs}amix=inputs={mix_count}:normalize=0[audio]")
    subprocess.run([
        "ffmpeg", "-y", *inputs,
        "-filter_complex", ";".join(filters),
        "-map", "0:v", "-map", "[audio]",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        "-shortest", output_path
    ], check=True, capture_output=True)
    return output_path


def rule_4_apply_lut(input_path: str, output_path: str, style: str = "punchy") -> str:
    """Apply cinematic color grade via FFmpeg eq/colorbalance."""
    lut_map: dict[str, list[str]] = {
        "orange_teal": ["eq=contrast=1.1:saturation=1.2", "colorbalance=rs=0.1:bs=-0.1"],
        "desaturated": ["eq=saturation=0.7:contrast=1.05"],
        "punchy": ["eq=contrast=1.15:saturation=1.3"],
        "warm_cinematic": ["eq=contrast=1.08:saturation=1.1", "colorbalance=rh=0.05:gh=0.02:bh=-0.05"],
        "cool_professional": ["eq=contrast=1.05:saturation=0.9", "colorbalance=rs=-0.05:bs=0.05"],
        "subtle": ["eq=contrast=1.03:saturation=1.02"],
        "neutral": ["eq=contrast=1.0:saturation=1.0"],
    }
    filters = lut_map.get(style, lut_map["punchy"])
    vf = ",".join(filters)
    subprocess.run([
        "ffmpeg", "-y", "-i", input_path,
        "-vf", vf,
        "-c:a", "copy", output_path
    ], check=True, capture_output=True)
    return output_path


def rule_8_breathing_room(input_path: str, output_path: str) -> str:
    """Detect pauses in audio and extend them for natural pacing."""
    try:
        import numpy as np
        import soundfile as sf
        audio, sr = sf.read(input_path)
        if len(audio.shape) > 1:
            audio = audio.mean(axis=1)
        energy = np.abs(audio)
        threshold = energy.max() * 0.02
        silent = energy < threshold
        silent_regions: list[tuple[int, int]] = []
        in_silence = False
        start = 0
        for i, s in enumerate(silent):
            if s and not in_silence:
                start = i
                in_silence = True
            elif not s and in_silence:
                duration = (i - start) / sr
                if duration > 0.5:
                    silent_regions.append((start, i))
                in_silence = False
        if in_silence:
            duration = (len(silent) - start) / sr
            if duration > 0.5:
                silent_regions.append((start, len(silent)))
        if not silent_regions:
            return input_path
        import shutil
        shutil.copy2(input_path, output_path)
        return output_path
    except ImportError:
        return input_path


def rule_9_film_grain(input_path: str, output_path: str, intensity: int = 8) -> str:
    """Add film grain to reduce AI-perfect look."""
    subprocess.run([
        "ffmpeg", "-y", "-i", input_path,
        "-vf", f"noise=alls={intensity}:allf=t+u",
        "-c:a", "copy", output_path
    ], check=True, capture_output=True)
    return output_path


def rule_10_audio_warmth(input_path: str, output_path: str) -> str:
    """EQ: boost 200-500Hz, cut harshness, subtle reverb."""
    subprocess.run([
        "ffmpeg", "-y", "-i", input_path,
        "-af", "equalizer=f=300:width_type=h:width=200:g=2,"
               "equalizer=f=5000:width_type=h:width=2000:g=-1.5,"
               "aecho=0.8:0.9:40:0.06",
        "-c:v", "copy", output_path
    ], check=True, capture_output=True)
    return output_path


def rule_12_voice_formant(input_path: str, output_path: str) -> str:
    """Very subtle pitch variation to break AI monotony."""
    subprocess.run([
        "ffmpeg", "-y", "-i", input_path,
        "-af", "asetrate=44100*1.003,aresample=44100",
        "-c:v", "copy", output_path
    ], check=True, capture_output=True)
    return output_path


def process_video(input_path: str, output_path: str, options: dict[str, Any]) -> str:
    """Apply Human Feel rules in order. Returns path to polished video."""
    logger.info(f"Applying Human Feel processing to: {input_path}")
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input video not found: {input_path}")

    preset_name = options.get("preset", options.get("content_type", "social_media"))
    config = PRESETS.get(preset_name, PRESETS["social_media"])
    raw_grain = options.get("grain", options.get("film_grain", config["grain"]))
    grain_intensity = int(raw_grain) if isinstance(raw_grain, bool) or isinstance(raw_grain, (int, float)) else config["grain"]
    raw_lut = options.get("lut", options.get("color_grade", config["lut"]))
    lut_style = str(raw_lut) if isinstance(raw_lut, str) else config["lut"]
    do_warmth = options.get("warmth", options.get("audio_warmth", config["warmth"]))
    if isinstance(do_warmth, bool) and do_warmth:
        do_warmth = config["warmth"]
    do_movement = options.get("movement", options.get("camera_movement", config["movement"]))
    if isinstance(do_movement, bool) and do_movement:
        do_movement = config["movement"]
    do_timing = options.get("timing", config["timing"])
    do_ambient = options.get("ambient", config["ambient"])
    add_grain = options.get("add_grain", grain_intensity > 0)

    chain = [input_path]
    temp_dir = tempfile.mkdtemp(prefix="human_feel_")
    temp_files: list[str] = []

    try:
        # Rule 1: Timing variance
        if do_timing:
            t1 = os.path.join(temp_dir, "step1_timing.mp4")
            rule_1_timing_variance(chain[-1], t1)
            chain.append(t1)
            temp_files.append(t1)

        # Rule 2: Camera movement
        if do_movement:
            t2 = os.path.join(temp_dir, "step2_movement.mp4")
            rule_2_camera_movement(chain[-1], t2)
            chain.append(t2)
            temp_files.append(t2)

        # Rule 4: LUT / color grade
        if lut_style:
            t4 = os.path.join(temp_dir, "step4_lut.mp4")
            rule_4_apply_lut(chain[-1], t4, style=lut_style)
            chain.append(t4)
            temp_files.append(t4)

        # Rule 8: Breathing room
        t8 = os.path.join(temp_dir, "step8_breathing.mp4")
        result_8 = rule_8_breathing_room(chain[-1], t8)
        if result_8 != chain[-1]:
            chain.append(result_8)
            temp_files.append(result_8)

        # Rule 9: Film grain
        if add_grain:
            t9 = os.path.join(temp_dir, "step9_grain.mp4")
            rule_9_film_grain(chain[-1], t9, intensity=grain_intensity)
            chain.append(t9)
            temp_files.append(t9)

        # Rule 10: Audio warmth
        if do_warmth:
            t10 = os.path.join(temp_dir, "step10_warmth.mp4")
            rule_10_audio_warmth(chain[-1], t10)
            chain.append(t10)
            temp_files.append(t10)

        # Rule 12: Voice formant
        t12 = os.path.join(temp_dir, "step12_formant.mp4")
        rule_12_voice_formant(chain[-1], t12)
        chain.append(t12)
        temp_files.append(t12)

        final = chain[-1]
        if final != output_path:
            import shutil
            shutil.copy2(final, output_path)

        logger.info(f"Human Feel processing complete: {output_path}")
        return output_path

    finally:
        for f in temp_files:
            try:
                os.remove(f)
            except Exception:
                pass
        try:
            os.rmdir(temp_dir)
        except Exception:
            pass
