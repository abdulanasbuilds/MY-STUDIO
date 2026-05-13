# MY STUDIO — models/musetalk.py
import logging
import os
import subprocess
from pathlib import Path
from typing import Any

logger = logging.getLogger("my-studio")

MODEL_DIR = "/models/musetalk"


def load_musetalk(model_path: str = MODEL_DIR) -> dict[str, Any]:
    weights_path = Path(model_path)
    if not weights_path.exists():
        raise FileNotFoundError(
            f"MuseTalk weights not found at {model_path}. "
            "Run scripts/download-models.py first."
        )
    logger.info("Loading MuseTalk 1.5 model...")
    import torch
    from musetalk import MuseTalk
    model = MuseTalk(
        model_path=str(weights_path / "musetalk.json"),
        checkpoint_path=str(weights_path / "musetalk.pth"),
        device="cuda",
    )
    model.half()
    logger.info("MuseTalk model loaded successfully.")
    return {"model": model, "model_path": model_path}


def generate_lipsync_video(
    face_path: str,
    audio_path: str,
    output_path: str,
    model: dict[str, Any] | None = None,
) -> str:
    if not os.path.exists(face_path):
        raise FileNotFoundError(f"Face file not found: {face_path}")
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
    logger.info(f"Generating lip-sync: face={face_path}, audio={audio_path}")
    if model is None:
        model = load_musetalk()
    face_ext = Path(face_path).suffix.lower()
    is_video = face_ext in (".mp4", ".avi", ".mov", ".mkv", ".webm")
    if is_video:
        result_path = _lipsync_video_input(face_path, audio_path, output_path, model)
    else:
        result_path = _lipsync_image_input(face_path, audio_path, output_path, model)
    logger.info(f"Lip-sync video generated: {result_path}")
    return result_path


def _lipsync_video_input(
    video_path: str,
    audio_path: str,
    output_path: str,
    model: dict[str, Any],
) -> str:
    import tempfile, shutil
    with tempfile.TemporaryDirectory(prefix="musetalk_") as tmpdir:
        frames_dir = os.path.join(tmpdir, "frames")
        os.makedirs(frames_dir, exist_ok=True)
        subprocess.run([
            "ffmpeg", "-y", "-i", video_path,
            "-vf", "fps=25",
            os.path.join(frames_dir, "frame_%06d.png"),
        ], check=True, capture_output=True)
        frame_files = sorted(Path(frames_dir).glob("frame_*.png"))
        musetalk = model["model"]
        for frame_file in frame_files:
            musetalk.process(str(frame_file), audio_path)
        subprocess.run([
            "ffmpeg", "-y", "-framerate", "25",
            "-i", os.path.join(frames_dir, "frame_%06d.png"),
            "-i", audio_path,
            "-c:v", "libx264", "-preset", "fast", "-crf", "18",
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
            "-shortest", output_path,
        ], check=True, capture_output=True)
    return output_path


def _lipsync_image_input(
    image_path: str,
    audio_path: str,
    output_path: str,
    model: dict[str, Any],
) -> str:
    import tempfile, shutil
    duration = _get_audio_duration(audio_path)
    num_frames = int(duration * 25)
    musetalk = model["model"]
    with tempfile.TemporaryDirectory(prefix="musetalk_") as tmpdir:
        frames_dir = os.path.join(tmpdir, "frames")
        os.makedirs(frames_dir, exist_ok=True)
        for i in range(num_frames):
            frame_path = os.path.join(frames_dir, f"frame_{i:06d}.png")
            musetalk.process(image_path, audio_path, output_frame=str(frame_path))
        subprocess.run([
            "ffmpeg", "-y", "-framerate", "25",
            "-i", os.path.join(frames_dir, "frame_%06d.png"),
            "-i", audio_path,
            "-c:v", "libx264", "-preset", "fast", "-crf", "18",
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
            "-shortest", output_path,
        ], check=True, capture_output=True)
    return output_path


def _get_audio_duration(audio_path: str) -> float:
    result = subprocess.run([
        "ffprobe", "-v", "quiet", "-show_entries", "format=duration",
        "-of", "csv=p=0", audio_path,
    ], capture_output=True, text=True)
    return float(result.stdout.strip())
