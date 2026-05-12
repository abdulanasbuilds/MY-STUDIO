# Skill: my-studio-open-source-models

## Triggers
- "HunyuanVideo", "GPT-SoVITS", "SkyReels", "MuseTalk", "WhisperX", "FLUX",
  "MusicGen", "Demucs", "model", "integrate", "open source", "AI model"

## Purpose
Complete reference for all 50+ open source models used in MY STUDIO.

---

## Model Selection Guide

| Task | Premium Model | Fast/Fallback Model |
|------|--------------|---------------------|
| Avatar talking head | HunyuanVideo-Avatar (A100) | MuseTalk (A10G, 3x faster) |
| Voice generation | GPT-SoVITS (A10G, cloned voice) | XTTS-v2 (A10G, multilingual) |
| Video generation (long) | SkyReels-V3 (A100) | HunyuanVideo 1.5 (A100) |
| Video generation (short) | CogVideoX 1.5 (A100) | FLUX + AnimateDiff (A10G) |
| Lip sync | HunyuanVideo-Avatar (quality) | MuseTalk (speed) |
| Video enhancement | Real-ESRGAN (T4) | — |
| Transcription | WhisperX (T4, word-level) | Whisper Large v3 (T4) |
| Translation | NLLB-200 (T4, 200 languages, offline) | — |
| Music generation | MusicGen (A10G) | — |
| Audio separation | Demucs (T4) | — |
| Image generation | FLUX.1-dev (A10G) | FLUX.1-schnell (A10G, faster) |
| Face tracking | MediaPipe (T4) | YOLOv8 (T4) |
| Viral detection | ViralCutter + Gemini (CPU) | — |
| Intelligence | Gemini 3.1 Pro (CPU/API) | Gemini 3 Flash (faster) |

---

## Complete Model Reference

### HunyuanVideo-Avatar
- **GitHub:** https://github.com/Tencent-Hunyuan/HunyuanVideo-Avatar
- **GPU:** A100 (80GB)
- **Input:** Face image + audio file
- **Output:** MP4 video with animated face
- **Modal Volume:** `/models/hunyuan-avatar`
- **Used by:** M01 Avatar Studio (premium mode)

### GPT-SoVITS
- **GitHub:** https://github.com/RVC-Boss/GPT-SoVITS
- **GPU:** A10G (24GB)
- **Input:** Reference audio (for cloning) + text
- **Output:** WAV audio in cloned voice
- **Modal Volume:** `/models/sovits`
- **Languages:** en, zh, ja, ko, fr, es, de, ar, ha, sw
- **Used by:** M01 Avatar Studio, M02 Movie Generator

### MuseTalk 1.5
- **GitHub:** https://github.com/TMElyralab/MuseTalk
- **GPU:** A10G (24GB)
- **Input:** Face image/video + audio file
- **Output:** MP4 video with lip sync
- **Modal Volume:** `/models/musetalk`
- **Used by:** M01 Avatar Studio (fast mode), M15 Voice Dubbing

### Real-ESRGAN
- **GitHub:** https://github.com/xinntao/Real-ESRGAN
- **GPU:** T4 (16GB)
- **Input:** Video or image file
- **Output:** Upscaled video/image (2x or 4x)
- **Modal Volume:** `/models/esrgan`
- **Used by:** M01 Avatar Studio

### SkyReels-V3
- **GitHub:** https://github.com/SkyworkAI/SkyReels-V2
- **GPU:** A100 (80GB)
- **Input:** Text prompt + settings
- **Output:** MP4 video (10s-60s)
- **Frame counts:** 257=10s, 377=15s, 737=30s, 1457=60s
- **Modal Volume:** `/models/skyreels`
- **Used by:** M02 Movie Generator

### FLUX.1 (schnell + dev)
- **GitHub:** https://github.com/black-forest-labs/FLUX.1-schnell
- **GPU:** A10G (24GB)
- **Input:** Text prompt
- **Output:** PNG image
- **Modal Volume:** `/models/flux`
- **Used by:** M02 Movie (storyboards), M10 Thumbnails

### MusicGen (AudioCraft)
- **GitHub:** https://github.com/facebookresearch/audiocraft
- **GPU:** A10G (24GB)
- **Input:** Text prompt describing music
- **Output:** WAV audio
- **Modal Volume:** `/models/musicgen`
- **Used by:** M02 Movie Generator, M09 Audio Studio

### FilMaster
- **Website:** https://filmaster-ai.github.io
- **GPU:** CPU
- **Input:** Screenplay/scene descriptions
- **Output:** Cinematic editing decisions, rhythm control
- **Modal Volume:** `/models/filmaster`
- **Used by:** M02 Movie Generator

### WhisperX
- **GitHub:** https://github.com/m-bain/whisperX
- **GPU:** T4 (16GB)
- **Input:** Audio/video file
- **Output:** Word-level timestamped transcript (JSON)
- **Modal Volume:** `/models/whisper`
- **Used by:** M11 Clipper, M12 Remixer, M15 Dubbing, M03 Documentary

### Demucs
- **GitHub:** https://github.com/facebookresearch/demucs
- **GPU:** T4 (16GB)
- **Input:** Audio file
- **Output:** Separated tracks (vocals, drums, bass, other)
- **Modal Volume:** `/models/demucs`
- **Used by:** M09 Audio Studio, M15 Voice Dubbing

### Coqui XTTS-v2
- **GitHub:** https://github.com/coqui-ai/TTS
- **GPU:** A10G (24GB)
- **Input:** Text + reference audio (for voice cloning)
- **Output:** WAV audio in cloned voice
- **Modal Volume:** `/models/xtts`
- **Languages:** 17 languages natively
- **Used by:** M15 Voice Dubbing, M09 Audio Studio

### NLLB-200
- **HuggingFace:** facebook/nllb-200-distilled-600M
- **GPU:** T4 (16GB)
- **Input:** Text + source language + target language
- **Output:** Translated text
- **Modal Volume:** `/models/nllb`
- **Languages:** 200 languages, fully offline
- **Used by:** M15 Voice Dubbing, M03 Documentary

### MediaPipe
- **GitHub:** https://github.com/google/mediapipe
- **GPU:** T4 (16GB) or CPU
- **Input:** Video frames
- **Output:** Face landmarks, pose data
- **Used by:** M11 Clipper (face tracking for crop)

### YOLOv8
- **GitHub:** https://github.com/ultralytics/ultralytics
- **GPU:** T4 (16GB)
- **Input:** Video frames
- **Output:** Object detection bounding boxes
- **Modal Volume:** `/models/yolov8`
- **Used by:** M11 Clipper (person detection)

### CogVideoX 1.5
- **GitHub:** https://github.com/zai-org/CogVideo
- **GPU:** A100 (80GB)
- **Input:** Text prompt
- **Output:** MP4 video
- **Modal Volume:** `/models/cogvideo`
- **Used by:** M02 Movie Generator (alternate)

### HunyuanVideo 1.5
- **GitHub:** https://github.com/Tencent-Hunyuan/HunyuanVideo
- **GPU:** A100 (80GB)
- **Input:** Text prompt + optional image
- **Output:** MP4 video
- **Modal Volume:** `/models/hunyuan-video`
- **Used by:** M03 Documentary Engine

---

## Python Import Patterns

```python
# WhisperX
import whisperx
model = whisperx.load_model("large-v3", device="cuda")
result = model.transcribe(audio_path, batch_size=16)

# Demucs
from demucs import pretrained
from demucs.apply import apply_model
model = pretrained.get_model("htdemucs")
sources = apply_model(model, wav_tensor)

# MusicGen
from audiocraft.models import MusicGen
model = MusicGen.get_pretrained("facebook/musicgen-medium")
model.set_generation_params(duration=30)
wav = model.generate(["cinematic orchestral score"])

# Real-ESRGAN
from realesrgan import RealESRGANer
upsampler = RealESRGANer(scale=4, model_path="RealESRGAN_x4plus.pth")
output, _ = upsampler.enhance(img)

# FLUX.1
from diffusers import FluxPipeline
pipe = FluxPipeline.from_pretrained("black-forest-labs/FLUX.1-schnell")
image = pipe("cinematic still of a hero").images[0]

# MediaPipe
import mediapipe as mp
face_detection = mp.solutions.face_detection.FaceDetection(min_detection_confidence=0.5)
results = face_detection.process(frame_rgb)

# NLLB-200
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
model = AutoModelForSeq2SeqLM.from_pretrained("facebook/nllb-200-distilled-600M")
tokenizer = AutoTokenizer.from_pretrained("facebook/nllb-200-distilled-600M")
```

---

## Common Errors and Fixes

| Error | Model | Fix |
|-------|-------|-----|
| CUDA OOM | Any A100 model | Reduce batch size, use fp16, or try smaller variant |
| Model not found | Any | Check Volume path, ensure download-models.py ran |
| Slow first inference | Any | Normal cold start — second call is fast |
| Audio format error | WhisperX, Demucs | Convert to WAV 16kHz mono first |
| Image dimension error | FLUX, ESRGAN | Resize to expected dimensions first |
| Language not supported | GPT-SoVITS | Fall back to XTTS-v2 for unsupported languages |
