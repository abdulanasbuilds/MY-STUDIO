# MY STUDIO — main.py
import logging
from typing import Any

import modal

logger = logging.getLogger("my-studio")

app = modal.App("my-studio")
secrets = modal.Secret.from_name("nexus-studio-secrets")

# Image with FastAPI (needed for web endpoints)
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "git", "libgl1", "libglib2.0-0")
    .pip_install(
        "fastapi[standard]==0.115.6",
        "pydantic==2.9.2",
        "supabase==2.9.1",
        "cloudinary==1.41.0",
        "httpx==0.27.2",
        "moviepy==1.0.3",
        "opencv-python-headless==4.10.0.84",
        "yt-dlp==2024.11.4",
        "scenedetect[opencv]==0.6.4",
        "librosa==0.10.2",
        "soundfile==0.12.1",
        "matchering==2.0.6",
        "transformers==4.46.3",
        "diffusers==0.31.0",
        "accelerate==1.1.1",
        "safetensors==0.4.5",
        "sentencepiece==0.2.0",
        "google-generativeai==0.8.3",
        "numpy==1.26.4",
        "scipy==1.14.1",
        "Pillow==10.4.0",
        "trafilatura==1.12.2",
        "newspaper4k==0.9.3.1",
        "firecrawl-py==1.4.0",
        "mediapipe==0.10.18",
        "ultralytics==8.3.32",
        "tqdm==4.67.0",
    )
)

# GPU image (extends base with PyTorch)
gpu_image = image.pip_install(
    "torch==2.4.1", "torchaudio==2.4.1", "torchvision==0.19.1",
    index_url="https://download.pytorch.org/whl/cu121",
)

# All model volumes
vol_hunyuan_avatar = modal.Volume.from_name("my-studio-hunyuan-avatar", create_if_missing=True)
vol_hunyuan_video = modal.Volume.from_name("my-studio-hunyuan-video", create_if_missing=True)
vol_skyreels = modal.Volume.from_name("my-studio-skyreels", create_if_missing=True)
vol_cogvideo = modal.Volume.from_name("my-studio-cogvideo", create_if_missing=True)
vol_flux = modal.Volume.from_name("my-studio-flux", create_if_missing=True)
vol_sovits = modal.Volume.from_name("my-studio-sovits", create_if_missing=True)
vol_musetalk = modal.Volume.from_name("my-studio-musetalk", create_if_missing=True)
vol_esrgan = modal.Volume.from_name("my-studio-esrgan", create_if_missing=True)
vol_musicgen = modal.Volume.from_name("my-studio-musicgen", create_if_missing=True)
vol_demucs = modal.Volume.from_name("my-studio-demucs", create_if_missing=True)
vol_whisper = modal.Volume.from_name("my-studio-whisper", create_if_missing=True)
vol_nllb = modal.Volume.from_name("my-studio-nllb", create_if_missing=True)
vol_xtts = modal.Volume.from_name("my-studio-xtts", create_if_missing=True)
vol_filmaster = modal.Volume.from_name("my-studio-filmaster", create_if_missing=True)
vol_yolo = modal.Volume.from_name("my-studio-yolo", create_if_missing=True)
vol_voicefixer = modal.Volume.from_name("my-studio-voicefixer", create_if_missing=True)

ALL_VOLUMES = {
    "/models/hunyuan-avatar": vol_hunyuan_avatar,
    "/models/hunyuan-video": vol_hunyuan_video,
    "/models/skyreels": vol_skyreels,
    "/models/cogvideo": vol_cogvideo,
    "/models/flux": vol_flux,
    "/models/sovits": vol_sovits,
    "/models/musetalk": vol_musetalk,
    "/models/esrgan": vol_esrgan,
    "/models/musicgen": vol_musicgen,
    "/models/demucs": vol_demucs,
    "/models/whisper": vol_whisper,
    "/models/nllb": vol_nllb,
    "/models/xtts": vol_xtts,
    "/models/filmaster": vol_filmaster,
    "/models/yolo": vol_yolo,
    "/models/voicefixer": vol_voicefixer,
}

from security import verify_request, get_cors_headers
from db import get_job, update_job_status

# ---- FastAPI web app ----
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

web_app = FastAPI()

web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@web_app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0", "app": "my-studio"}

@web_app.get("/status/{job_id}")
async def status(job_id: str):
    job = get_job(job_id)
    if not job:
        return {"error": "Not found"}, 404
    return job

@web_app.post("/generate/avatar")
async def generate_avatar(request: Request):
    data = await request.json()
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401
    from pipelines.avatar_pipeline import run_avatar_pipeline
    import asyncio
    asyncio.create_task(run_avatar_pipeline(data))
    return {"accepted": True, "job_id": data["job_id"]}

@web_app.post("/generate/movie")
async def generate_movie(request: Request):
    data = await request.json()
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401
    from pipelines.movie_pipeline import run_movie_pipeline
    import asyncio
    asyncio.create_task(run_movie_pipeline(data))
    return {"accepted": True, "job_id": data["job_id"]}

@web_app.post("/generate/documentary")
async def generate_documentary(request: Request):
    data = await request.json()
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401
    from pipelines.documentary_pipeline import run_documentary_pipeline
    import asyncio
    asyncio.create_task(run_documentary_pipeline(data))
    return {"accepted": True, "job_id": data["job_id"]}

@web_app.post("/generate/clip")
async def generate_clip(request: Request):
    data = await request.json()
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401
    from pipelines.clipper_pipeline import run_clipper_pipeline
    import asyncio
    asyncio.create_task(run_clipper_pipeline(data))
    return {"accepted": True, "job_id": data["job_id"]}

@web_app.post("/generate/remix")
async def generate_remix(request: Request):
    data = await request.json()
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401
    from pipelines.remix_pipeline import run_remix_pipeline
    import asyncio
    asyncio.create_task(run_remix_pipeline(data))
    return {"accepted": True, "job_id": data["job_id"]}

@web_app.post("/generate/dub")
async def generate_dub(request: Request):
    data = await request.json()
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401
    from pipelines.dubbing_pipeline import run_dubbing_pipeline
    import asyncio
    asyncio.create_task(run_dubbing_pipeline(data))
    return {"accepted": True, "job_id": data["job_id"]}

@web_app.post("/generate/thumbnail")
async def generate_thumbnail(request: Request):
    data = await request.json()
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401
    from pipelines.thumbnail_pipeline import run_thumbnail_pipeline
    import asyncio
    asyncio.create_task(run_thumbnail_pipeline(data))
    return {"accepted": True, "job_id": data["job_id"]}

@web_app.post("/generate/audio")
async def generate_audio(request: Request):
    data = await request.json()
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401
    from pipelines.audio_pipeline import run_audio_pipeline
    import asyncio
    asyncio.create_task(run_audio_pipeline(data))
    return {"accepted": True, "job_id": data["job_id"]}

@web_app.post("/voice/clone")
async def clone_voice(request: Request):
    data = await request.json()
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401
    from models.sovits import clone_voice, load_sovits
    model = load_sovits()
    clone_voice(data["audio_url"], data["user_id"], model=model)
    return {"status": "accepted"}

@web_app.post("/rivals/analyze")
async def analyze_rival(request: Request):
    data = await request.json()
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401
    from intelligence.competitor_spy import run_competitor_spy_pipeline
    import asyncio
    asyncio.create_task(run_competitor_spy_pipeline(data))
    return {"accepted": True, "job_id": data["job_id"]}

@web_app.post("/generate/news")
async def generate_news(request: Request):
    data = await request.json()
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401
    from pipelines.news_pipeline import run_news_pipeline
    import asyncio
    asyncio.create_task(run_news_pipeline(data))
    return {"accepted": True, "job_id": data["job_id"]}

@web_app.post("/generate/edit")
async def generate_edit(request: Request):
    data = await request.json()
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401
    from intelligence.edit_interpreter import apply_edit_sequence
    import asyncio
    asyncio.create_task(apply_edit_sequence(data))
    return {"accepted": True, "job_id": data["job_id"]}

@app.function(image=image, secrets=[secrets])
@modal.asgi_app()
def fastapi_app():
    return web_app
