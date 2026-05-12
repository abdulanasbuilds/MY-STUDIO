# MY STUDIO — download-models.py
# PURPOSE: Download all AI model weights to Modal volumes
# Run: modal run scripts/download-models.py
# See PLAN.md Section 4 for model-to-volume mapping

"""
Model download script for MY STUDIO.

Downloads all required model weights to their respective Modal volumes.
Each model is downloaded once and persisted in a named volume.

Usage:
    modal run scripts/download-models.py

Models to download:
    - HunyuanVideo-Avatar -> /models/hunyuan-avatar
    - GPT-SoVITS -> /models/sovits
    - MuseTalk -> /models/musetalk
    - Real-ESRGAN -> /models/esrgan
    - SkyReels-V3 -> /models/skyreels
    - FLUX.1-schnell -> /models/flux
    - MusicGen -> /models/musicgen
    - Demucs -> /models/demucs
    - WhisperX -> /models/whisper
    - NLLB-200 -> /models/nllb
    - XTTS-v2 -> /models/xtts
    - YOLOv8 -> /models/yolov8
"""


def main() -> None:
    """Download all model weights."""
    print("MY STUDIO — Model Download Script")
    print("=" * 40)
    print("Not yet implemented.")
    print("See PLAN.md for model list and volume mapping.")
    print("Each model will be implemented when its module is built.")


if __name__ == "__main__":
    main()
