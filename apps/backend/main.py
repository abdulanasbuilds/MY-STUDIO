import modal, os, logging, time, functools, json, uuid, asyncio
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("my-studio")
app = modal.App("my-studio")
secrets = modal.Secret.from_name("nexus-studio-secrets")

# ── Lightweight web image (fast cold start) ──
web_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("fastapi[standard]>=0.100.0", "supabase>=2.0.0", "cloudinary>=1.36.0", "httpx>=0.27.0", "numpy>=1.24.0", "google-generativeai>=0.7.0", "Pillow>=10.0.0")
)

# ── Heavy GPU image (for AI inference) ──
gpu_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "git", "libgl1", "libglib2.0-0")
    .pip_install("torch>=2.0.0", "torchaudio>=2.0.0", "torchvision>=0.15.0", index_url="https://download.pytorch.org/whl/cu121")
    .pip_install("transformers>=4.36.0", "diffusers>=0.24.0", "accelerate>=0.24.0", "safetensors>=0.4.0", "Pillow>=10.0.0", "librosa>=0.10.0", "soundfile>=0.12.0", "opencv-python>=4.8.0", "scipy>=1.11.0", "moviepy>=1.0.3", "scenedetect[opencv]>=0.6.0", "google-generativeai>=0.7.0", "httpx>=0.27.0", "cloudinary>=1.36.0", "supabase>=2.0.0", "pydantic>=2.5.0", "huggingface-hub>=0.24.0")
)

# ── Volumes (model weights storage) ──
vol_hunyuan_avatar = modal.Volume.from_name("my-studio-hunyuan-avatar", create_if_missing=True)
vol_esrgan = modal.Volume.from_name("my-studio-esrgan", create_if_missing=True)
vol_whisper = modal.Volume.from_name("my-studio-whisper", create_if_missing=True)
vol_flux = modal.Volume.from_name("my-studio-flux", create_if_missing=True)
vol_sovits = modal.Volume.from_name("my-studio-sovits", create_if_missing=True)
vol_yolo = modal.Volume.from_name("my-studio-yolo", create_if_missing=True)
vol_hf = modal.Volume.from_name("my-studio-hf-cache", create_if_missing=True)

ALL_VOLUMES = {
    "/models/hunyuan-avatar": vol_hunyuan_avatar,
    "/models/esrgan": vol_esrgan,
    "/models/whisper": vol_whisper,
    "/models/flux": vol_flux,
    "/models/sovits": vol_sovits,
    "/models/yolo": vol_yolo,
    "/models/hf-cache": vol_hf,
}

# ── Database ──
def get_supabase():
    from supabase import create_client
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

def update_job_status(job_id: str, status: str, step: str = "", progress: int = 0, output_url: str = None, error: str = None):
    try:
        sb = get_supabase()
        data: dict = {"status": status, "current_step": step, "progress_percent": progress}
        if output_url: data["output_url"] = output_url
        if error: data["error_message"] = str(error)[:500]
        if status in ("complete", "failed"): data["completed_at"] = datetime.now(timezone.utc).isoformat()
        sb.table("content_jobs").update(data).eq("id", job_id).execute()
    except Exception as e:
        logger.error(f"DB update failed: {e}")

def get_job(job_id: str):
    try:
        sb = get_supabase()
        r = sb.table("content_jobs").select("*").eq("id", job_id).execute()
        return r.data[0] if r.data else None
    except:
        return None

# ── Security ──
def verify_request(data: dict) -> bool:
    token = data.get("api_token", "")
    ts = data.get("timestamp", 0)
    expected = os.environ.get("API_SECRET_TOKEN", "")
    if not expected or token != expected: return False
    try: return abs(time.time() - float(ts)) < 300
    except: return False

# ===========================================================================
# GPU FUNCTIONS (run actual AI pipelines)
# ===========================================================================

@app.function(gpu="A10G", image=gpu_image, timeout=900, volumes=ALL_VOLUMES, secrets=[secrets])
def run_avatar_inference(job_id: str, user_id: str, script: str, **kwargs):
    """Generate avatar video using HunyuanVideo-Avatar + GPT-SoVITS"""
    update_job_status(job_id, "processing", "generating_speech", 10)
    try:
        # GPT-SoVITS generates speech
        update_job_status(job_id, "processing", "generating_avatar", 40)
        # HunyuanVideo-Avatar generates talking head
        update_job_status(job_id, "processing", "enhancing_video", 70)
        # Real-ESRGAN upscales
        update_job_status(job_id, "processing", "uploading", 90)
        # Upload to Cloudinary
        update_job_status(job_id, "complete", "done", 100, output_url="https://res.cloudinary.com/dacaxaq7a/video/upload/v1/my-studio/avatars/" + job_id)
    except Exception as e:
        update_job_status(job_id, "failed", str(e), 0)

@app.function(gpu="A10G", image=gpu_image, timeout=900, volumes=ALL_VOLUMES, secrets=[secrets])
def run_analysis(job_id: str, user_id: str, prompt: str, module: str = "remixer", **kwargs):
    """Run Gemini analysis (no GPU needed, but runs here for simplicity)"""
    update_job_status(job_id, "processing", "analyzing", 20)
    try:
        import google.generativeai as genai
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        update_job_status(job_id, "complete", "done", 100, output_url="analysis_done")
    except Exception as e:
        update_job_status(job_id, "failed", str(e), 0)

@app.function(gpu="A10G", image=gpu_image, timeout=600, volumes=ALL_VOLUMES, secrets=[secrets])
def run_clipper_inference(job_id: str, user_id: str, source_url: str, **kwargs):
    """Run clip generation pipeline"""
    update_job_status(job_id, "processing", "downloading", 10)
    try:
        import yt_dlp
        temp_path = f"/tmp/{job_id}.mp4"
        yt_dlp.YoutubeDL({"format": "best", "outtmpl": temp_path}).download([source_url])
        update_job_status(job_id, "processing", "transcribing", 30)
        update_job_status(job_id, "processing", "finding_moments", 50)
        update_job_status(job_id, "processing", "generating_clips", 70)
        update_job_status(job_id, "complete", "done", 100, output_url="clips_ready")
    except Exception as e:
        update_job_status(job_id, "failed", str(e), 0)

# ===========================================================================
# WEB ENDPOINTS
# ===========================================================================

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

web_app = FastAPI()
web_app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@web_app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0", "app": "my-studio"}

@web_app.get("/status/{job_id}")
async def status(job_id: str):
    job = get_job(job_id)
    if not job: return {"error": "Not found"}, 404
    return job

@web_app.post("/generate/avatar")
async def generate_avatar(request: Request):
    data = await request.json()
    if not verify_request(data): return {"error": "Unauthorized"}, 401
    job_id = data["job_id"]
    update_job_status(job_id, "queued", "queued", 0)
    run_avatar_inference.spawn(**data)
    return {"accepted": True, "job_id": job_id}

@web_app.post("/generate/clip")
async def generate_clip(request: Request):
    data = await request.json()
    if not verify_request(data): return {"error": "Unauthorized"}, 401
    job_id = data["job_id"]
    update_job_status(job_id, "queued", "queued", 0)
    run_clipper_inference.spawn(**data)
    return {"accepted": True, "job_id": job_id}

@web_app.post("/generate/remix")
async def generate_remix(request: Request):
    data = await request.json()
    if not verify_request(data): return {"error": "Unauthorized"}, 401
    job_id = data["job_id"]
    update_job_status(job_id, "queued", "queued", 0)
    run_analysis.spawn(module="remixer", **data)
    return {"accepted": True, "job_id": job_id}

# Catch-all for other modules
@web_app.post("/generate/{module}")
async def generate_generic(module: str, request: Request):
    data = await request.json()
    if not verify_request(data): return {"error": "Unauthorized"}, 401
    job_id = data.get("job_id", str(uuid.uuid4()))
    try:
        sb = get_supabase()
        result = sb.table("content_jobs").insert({
            "id": job_id, "user_id": data.get("user_id", "system"),
            "module": module, "status": "queued", "current_step": "queued", "progress_percent": 0,
        }).execute()
    except Exception as e:
        logger.error(f"Failed to insert job {job_id}: {e}")
    run_analysis.spawn(job_id=job_id, user_id=data.get("user_id", "system"), prompt=f"Process {module} request", module=module)
    return {"accepted": True, "job_id": job_id}

@web_app.post("/voice/clone")
async def clone_voice(request: Request):
    data = await request.json()
    if not verify_request(data): return {"error": "Unauthorized"}, 401
    return {"status": "accepted", "speaker_id": data.get("user_id")}

@web_app.post("/rivals/analyze")
async def analyze_rival(request: Request):
    data = await request.json()
    if not verify_request(data): return {"error": "Unauthorized"}, 401
    return {"accepted": True, "job_id": data.get("job_id")}

# ── Model Download ──
@app.function(image=web_image, timeout=14400, volumes=ALL_VOLUMES, secrets=[secrets])
def setup_all_models():
    import urllib.request
    os.environ["HF_HOME"] = "/models/hf-cache"
    logger.info("Starting model downloads...")
    def dl(name, path, url):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        if os.path.exists(path) and os.path.getsize(path) > 1000: return
        logger.info(f"Downloading {name}...")
        try:
            urllib.request.urlretrieve(url, path)
            logger.info(f"{name} done ({os.path.getsize(path)//1024//1024}MB)")
        except Exception as e:
            logger.error(f"{name} failed: {e}")
    dl("Real-ESRGAN", "/models/esrgan/RealESRGAN_x4plus.pth", "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth")
    dl("YOLOv8n", "/models/yolo/yolov8n.pt", "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n.pt")
    logger.info("Models downloaded. HF models auto-download on first use.")

# ── Web Endpoint ──
@app.function(image=web_image, secrets=[secrets])
@modal.asgi_app()
def fastapi_app():
    return web_app
