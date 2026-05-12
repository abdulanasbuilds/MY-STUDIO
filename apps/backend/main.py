# MY STUDIO — main.py
# PURPOSE: Modal app definition, image config, volumes, secrets, and all web endpoints
# CONNECTS TO: security.py, db.py, storage.py, all pipelines
# DEPLOY: modal deploy apps/backend/main.py

import logging
from typing import Any

import modal

logger = logging.getLogger("my-studio")

# ---------------------------------------------------------------------------
# Modal App
# ---------------------------------------------------------------------------
app = modal.App("my-studio")

# ---------------------------------------------------------------------------
# Secrets
# ---------------------------------------------------------------------------
secrets = modal.Secret.from_name("my-studio-secrets")

# ---------------------------------------------------------------------------
# Container Image
# ---------------------------------------------------------------------------
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "git", "libgl1", "libglib2.0-0")
    .pip_install(
        # Core
        "pydantic==2.9.2",
        "supabase==2.9.1",
        "cloudinary==1.41.0",
        "httpx==0.27.2",
        # Video
        "moviepy==1.0.3",
        "opencv-python-headless==4.10.0.84",
        "yt-dlp==2024.11.4",
        "scenedetect[opencv]==0.6.4",
        # Audio
        "librosa==0.10.2",
        "soundfile==0.12.1",
        "matchering==2.0.6",
        # AI
        "transformers==4.46.3",
        "diffusers==0.31.0",
        "accelerate==1.1.1",
        "safetensors==0.4.5",
        "sentencepiece==0.2.0",
        "google-generativeai==0.8.3",
        # Science
        "numpy==1.26.4",
        "scipy==1.14.1",
        "Pillow==10.4.0",
        # Intelligence
        "trafilatura==1.12.2",
        "newspaper4k==0.9.3.1",
        "firecrawl-py==1.4.0",
        # Face
        "mediapipe==0.10.18",
        "ultralytics==8.3.32",
        # Utilities
        "tqdm==4.67.0",
    )
)

# ---------------------------------------------------------------------------
# GPU Image (extends base with PyTorch + CUDA)
# ---------------------------------------------------------------------------
gpu_image = (
    image
    .pip_install(
        "torch==2.4.1",
        "torchaudio==2.4.1",
        "torchvision==0.19.1",
        index_url="https://download.pytorch.org/whl/cu121",
    )
)

# ---------------------------------------------------------------------------
# Model Volumes — persistent storage for downloaded model weights
# ---------------------------------------------------------------------------
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

# ---------------------------------------------------------------------------
# Imports (lazy — only available inside Modal containers)
# ---------------------------------------------------------------------------
from security import verify_request, get_cors_headers
from db import get_job, update_job_status


# ===========================================================================
# HEALTH CHECK
# ===========================================================================
@app.function(image=image, secrets=[secrets])
@modal.web_endpoint(method="GET", label="my-studio-health")
def health() -> dict[str, str]:
    """Health check endpoint.
    
    Returns:
        Status, version, and app name.
    """
    return {"status": "ok", "version": "0.1.0", "app": "my-studio"}


# ===========================================================================
# CORS PREFLIGHT HANDLER
# ===========================================================================
@app.function(image=image)
@modal.web_endpoint(method="OPTIONS", label="my-studio-options")
def options() -> tuple[dict[str, str], int, dict[str, str]]:
    """Handle CORS preflight requests for all endpoints.
    
    Returns:
        Empty body with CORS headers and 204 status.
    """
    return {}, 204, get_cors_headers()


# ===========================================================================
# JOB STATUS
# ===========================================================================
@app.function(image=image, secrets=[secrets])
@modal.web_endpoint(method="GET", label="my-studio-status")
def status(job_id: str) -> tuple[dict[str, Any], int, dict[str, str]]:
    """Get the current status of a content generation job.
    
    Args:
        job_id: UUID of the job to check.
    
    Returns:
        Job data with CORS headers, or 404 if not found.
    """
    job = get_job(job_id)
    if job is None:
        return {"error": "Job not found"}, 404, get_cors_headers()
    return job, 200, get_cors_headers()


# ===========================================================================
# GENERATE — Avatar (M01)
# ===========================================================================
@app.function(
    image=gpu_image,
    secrets=[secrets],
    gpu="A100",
    timeout=600,
    volumes={
        "/models/hunyuan-avatar": vol_hunyuan_avatar,
        "/models/sovits": vol_sovits,
        "/models/musetalk": vol_musetalk,
        "/models/esrgan": vol_esrgan,
    },
)
@modal.web_endpoint(method="POST", label="my-studio-generate-avatar")
def generate_avatar(data: dict[str, Any]) -> tuple[dict[str, Any], int, dict[str, str]]:
    """Generate an AI avatar video from script + voice + face.
    
    Pipeline: GPT-SoVITS voice clone -> HunyuanVideo-Avatar -> MuseTalk lip sync -> Real-ESRGAN enhance
    
    Args:
        data: Request containing script, avatar_id, voice_id, quality_mode, job_id.
    
    Returns:
        Accepted response with job_id, or 401 if unauthorized.
    """
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401, get_cors_headers()
    
    job_id: str = data["job_id"]
    update_job_status(job_id, "processing", "initializing", 0)
    
    try:
        from pipelines.avatar_pipeline import run_avatar_pipeline
        output_url = run_avatar_pipeline(data)
        update_job_status(job_id, "complete", "done", 100, output_url=output_url)
        return {"job_id": job_id, "status": "complete", "output_url": output_url}, 200, get_cors_headers()
    except Exception as e:
        logger.error(f"Avatar generation failed: {e}")
        update_job_status(job_id, "failed", "error", 0, error=str(e))
        return {"job_id": job_id, "status": "failed", "error": "Generation failed"}, 500, get_cors_headers()


# ===========================================================================
# GENERATE — Movie (M02)
# ===========================================================================
@app.function(
    image=gpu_image,
    secrets=[secrets],
    gpu="A100",
    timeout=900,
    volumes={
        "/models/hunyuan-video": vol_hunyuan_video,
        "/models/skyreels": vol_skyreels,
        "/models/cogvideo": vol_cogvideo,
        "/models/flux": vol_flux,
        "/models/musicgen": vol_musicgen,
    },
)
@modal.web_endpoint(method="POST", label="my-studio-generate-movie")
def generate_movie(data: dict[str, Any]) -> tuple[dict[str, Any], int, dict[str, str]]:
    """Generate a short film from a screenplay.
    
    Pipeline: Gemini screenplay -> FLUX.1 storyboard -> HunyuanVideo/SkyReels scenes -> MusicGen score -> FFmpeg assembly
    
    Args:
        data: Request containing screenplay, style, duration, quality_mode, job_id.
    
    Returns:
        Accepted response with job_id.
    """
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401, get_cors_headers()
    
    job_id: str = data["job_id"]
    update_job_status(job_id, "processing", "initializing", 0)
    
    try:
        from pipelines.movie_pipeline import run_movie_pipeline
        output_url = run_movie_pipeline(data)
        update_job_status(job_id, "complete", "done", 100, output_url=output_url)
        return {"job_id": job_id, "status": "complete", "output_url": output_url}, 200, get_cors_headers()
    except Exception as e:
        logger.error(f"Movie generation failed: {e}")
        update_job_status(job_id, "failed", "error", 0, error=str(e))
        return {"job_id": job_id, "status": "failed", "error": "Generation failed"}, 500, get_cors_headers()


# ===========================================================================
# GENERATE — Documentary (M03)
# ===========================================================================
@app.function(
    image=gpu_image,
    secrets=[secrets],
    gpu="A100",
    timeout=900,
    volumes={
        "/models/hunyuan-video": vol_hunyuan_video,
        "/models/flux": vol_flux,
        "/models/whisper": vol_whisper,
        "/models/musicgen": vol_musicgen,
    },
)
@modal.web_endpoint(method="POST", label="my-studio-generate-documentary")
def generate_documentary(data: dict[str, Any]) -> tuple[dict[str, Any], int, dict[str, str]]:
    """Generate a documentary from a topic/research.
    
    Pipeline: Gemini research -> Gemini narration -> FLUX.1 visuals -> HunyuanVideo scenes -> assembly
    
    Args:
        data: Request containing topic, style, duration, voice, job_id.
    
    Returns:
        Accepted response with job_id.
    """
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401, get_cors_headers()
    
    job_id: str = data["job_id"]
    update_job_status(job_id, "processing", "initializing", 0)
    
    try:
        from pipelines.documentary_pipeline import run_documentary_pipeline
        output_url = run_documentary_pipeline(data)
        update_job_status(job_id, "complete", "done", 100, output_url=output_url)
        return {"job_id": job_id, "status": "complete", "output_url": output_url}, 200, get_cors_headers()
    except Exception as e:
        logger.error(f"Documentary generation failed: {e}")
        update_job_status(job_id, "failed", "error", 0, error=str(e))
        return {"job_id": job_id, "status": "failed", "error": "Generation failed"}, 500, get_cors_headers()


# ===========================================================================
# GENERATE — Clip (M04 Clipper)
# ===========================================================================
@app.function(
    image=gpu_image,
    secrets=[secrets],
    gpu="T4",
    timeout=300,
    volumes={
        "/models/whisper": vol_whisper,
        "/models/filmaster": vol_filmaster,
    },
)
@modal.web_endpoint(method="POST", label="my-studio-generate-clip")
def generate_clip(data: dict[str, Any]) -> tuple[dict[str, Any], int, dict[str, str]]:
    """Extract viral clips from long-form video.
    
    Pipeline: yt-dlp download -> Whisper transcription -> Gemini scoring -> FFmpeg extraction -> vertical crop
    
    Args:
        data: Request containing video_url, platform, min_duration, max_duration, job_id.
    
    Returns:
        Accepted response with job_id.
    """
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401, get_cors_headers()
    
    job_id: str = data["job_id"]
    update_job_status(job_id, "processing", "initializing", 0)
    
    try:
        from pipelines.clipper_pipeline import run_clipper_pipeline
        output_url = run_clipper_pipeline(data)
        update_job_status(job_id, "complete", "done", 100, output_url=output_url)
        return {"job_id": job_id, "status": "complete", "output_url": output_url}, 200, get_cors_headers()
    except Exception as e:
        logger.error(f"Clipper generation failed: {e}")
        update_job_status(job_id, "failed", "error", 0, error=str(e))
        return {"job_id": job_id, "status": "failed", "error": "Generation failed"}, 500, get_cors_headers()


# ===========================================================================
# GENERATE — Remix (M06)
# ===========================================================================
@app.function(
    image=gpu_image,
    secrets=[secrets],
    gpu="A100",
    timeout=600,
    volumes={
        "/models/hunyuan-video": vol_hunyuan_video,
        "/models/flux": vol_flux,
        "/models/whisper": vol_whisper,
    },
)
@modal.web_endpoint(method="POST", label="my-studio-generate-remix")
def generate_remix(data: dict[str, Any]) -> tuple[dict[str, Any], int, dict[str, str]]:
    """Remix a viral video with a new creative angle.
    
    Pipeline: Analyze viral video -> Gemini remix script -> Generate new visuals -> Assembly
    
    Args:
        data: Request containing source_url, remix_angle, style, job_id.
    
    Returns:
        Accepted response with job_id.
    """
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401, get_cors_headers()
    
    job_id: str = data["job_id"]
    update_job_status(job_id, "processing", "initializing", 0)
    
    try:
        from pipelines.remix_pipeline import run_remix_pipeline
        output_url = run_remix_pipeline(data)
        update_job_status(job_id, "complete", "done", 100, output_url=output_url)
        return {"job_id": job_id, "status": "complete", "output_url": output_url}, 200, get_cors_headers()
    except Exception as e:
        logger.error(f"Remix generation failed: {e}")
        update_job_status(job_id, "failed", "error", 0, error=str(e))
        return {"job_id": job_id, "status": "failed", "error": "Generation failed"}, 500, get_cors_headers()


# ===========================================================================
# GENERATE — Dub (M15)
# ===========================================================================
@app.function(
    image=gpu_image,
    secrets=[secrets],
    gpu="A10G",
    timeout=600,
    volumes={
        "/models/whisper": vol_whisper,
        "/models/nllb": vol_nllb,
        "/models/xtts": vol_xtts,
        "/models/musetalk": vol_musetalk,
    },
)
@modal.web_endpoint(method="POST", label="my-studio-generate-dub")
def generate_dub(data: dict[str, Any]) -> tuple[dict[str, Any], int, dict[str, str]]:
    """Dub a video into another language with lip sync.
    
    Pipeline: Whisper transcription -> NLLB translation -> XTTS-v2 voice clone -> MuseTalk lip sync
    
    Args:
        data: Request containing video_url, target_language, voice_mode, job_id.
    
    Returns:
        Accepted response with job_id.
    """
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401, get_cors_headers()
    
    job_id: str = data["job_id"]
    update_job_status(job_id, "processing", "initializing", 0)
    
    try:
        from pipelines.dubbing_pipeline import run_dubbing_pipeline
        output_url = run_dubbing_pipeline(data)
        update_job_status(job_id, "complete", "done", 100, output_url=output_url)
        return {"job_id": job_id, "status": "complete", "output_url": output_url}, 200, get_cors_headers()
    except Exception as e:
        logger.error(f"Dubbing generation failed: {e}")
        update_job_status(job_id, "failed", "error", 0, error=str(e))
        return {"job_id": job_id, "status": "failed", "error": "Generation failed"}, 500, get_cors_headers()


# ===========================================================================
# GENERATE — Thumbnail (M10)
# ===========================================================================
@app.function(
    image=gpu_image,
    secrets=[secrets],
    gpu="A10G",
    timeout=120,
    volumes={
        "/models/flux": vol_flux,
    },
)
@modal.web_endpoint(method="POST", label="my-studio-generate-thumbnail")
def generate_thumbnail(data: dict[str, Any]) -> tuple[dict[str, Any], int, dict[str, str]]:
    """Generate a thumbnail image using FLUX.1.
    
    Pipeline: FLUX.1 image generation -> Cloudinary upload
    
    Args:
        data: Request containing prompt, style, aspect_ratio, job_id.
    
    Returns:
        Accepted response with job_id.
    """
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401, get_cors_headers()
    
    job_id: str = data["job_id"]
    update_job_status(job_id, "processing", "initializing", 0)
    
    try:
        from pipelines.thumbnail_pipeline import run_thumbnail_pipeline
        output_url = run_thumbnail_pipeline(data)
        update_job_status(job_id, "complete", "done", 100, output_url=output_url)
        return {"job_id": job_id, "status": "complete", "output_url": output_url}, 200, get_cors_headers()
    except Exception as e:
        logger.error(f"Thumbnail generation failed: {e}")
        update_job_status(job_id, "failed", "error", 0, error=str(e))
        return {"job_id": job_id, "status": "failed", "error": "Generation failed"}, 500, get_cors_headers()


# ===========================================================================
# CLONE VOICE
# ===========================================================================
@app.function(
    image=gpu_image,
    secrets=[secrets],
    gpu="A10G",
    timeout=300,
    volumes={
        "/models/sovits": vol_sovits,
    },
)
@modal.web_endpoint(method="POST", label="my-studio-clone-voice")
def clone_voice(data: dict[str, Any]) -> tuple[dict[str, Any], int, dict[str, str]]:
    """Clone a voice from an audio sample using GPT-SoVITS.
    
    Args:
        data: Request containing audio_url, voice_name, user_id, job_id.
    
    Returns:
        Accepted response with job_id and voice_id.
    """
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401, get_cors_headers()
    
    job_id: str = data["job_id"]
    update_job_status(job_id, "processing", "initializing", 0)
    
    try:
        from models.sovits import clone_voice as do_clone
        voice_id = do_clone(
            audio_url=data["audio_url"],
            voice_name=data["voice_name"],
            user_id=data["user_id"],
        )
        update_job_status(job_id, "complete", "done", 100, metadata={"voice_id": voice_id})
        return {"job_id": job_id, "status": "complete", "voice_id": voice_id}, 200, get_cors_headers()
    except Exception as e:
        logger.error(f"Voice cloning failed: {e}")
        update_job_status(job_id, "failed", "error", 0, error=str(e))
        return {"job_id": job_id, "status": "failed", "error": "Voice cloning failed"}, 500, get_cors_headers()
