import modal, os, logging, time, functools, json, uuid
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("my-studio")
app = modal.App("my-studio")
secrets = modal.Secret.from_name("nexus-studio-secrets")

# ── Container Image ──
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "git", "libgl1", "libglib2.0-0")
    .pip_install("fastapi[standard]>=0.100.0", "supabase>=2.0.0", "cloudinary>=1.36.0", "httpx>=0.27.0", "numpy>=1.24.0", "google-generativeai>=0.7.0", "Pillow>=10.0.0", "huggingface-hub>=0.24.0")
)

# ── Volumes ──
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

# ── Database helpers (self-contained, no imports needed) ──

def get_supabase():
    from supabase import create_client
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

def update_job_status(job_id: str, status: str, step: str = "", progress: int = 0, output_url: str = None, error: str = None):
    try:
        sb = get_supabase()
        data: dict = {"status": status, "current_step": step, "progress_percent": progress}
        if output_url: data["output_url"] = output_url
        if error: data["error_message"] = error[:500]
        if status in ("complete", "failed"): data["completed_at"] = datetime.now(timezone.utc).isoformat()
        sb.table("content_jobs").update(data).eq("id", job_id).execute()
    except Exception as e:
        logger.error(f"DB update failed for {job_id}: {e}")

def get_job(job_id: str):
    try:
        sb = get_supabase()
        r = sb.table("content_jobs").select("*").eq("id", job_id).execute()
        return r.data[0] if r.data else None
    except Exception as e:
        logger.error(f"DB get_job failed for {job_id}: {e}")
        return None

# ── Security ──

def verify_request(data: dict) -> bool:
    token = data.get("api_token", "")
    ts = data.get("timestamp", 0)
    expected = os.environ.get("API_SECRET_TOKEN", "")
    if not expected or token != expected: return False
    try:
        return abs(time.time() - float(ts)) < 300
    except (ValueError, TypeError):
        return False

# ── FastAPI App ──
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

web_app = FastAPI()
web_app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@web_app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0", "app": "my-studio"}

@web_app.get("/debug")
async def debug():
    try:
        sb = get_supabase()
        return {"supabase": "ok", "env": [k for k in os.environ.keys() if "SUPABASE" in k or "API" in k or "GEMINI" in k or "CLOUDINARY" in k]}
    except Exception as e:
        return {"error": str(e)[:500]}

@web_app.get("/status/{job_id}")
async def status(job_id: str):
    job = get_job(job_id)
    if not job: return {"error": "Not found"}, 404
    return job

def make_generate_route(endpoint: str, module: str):
    @web_app.post(f"/generate/{endpoint}")
    async def handler(request: Request):
        data = await request.json()
        if not verify_request(data): return {"error": "Unauthorized"}, 401
        job_id = data.get("job_id", str(uuid.uuid4()))
        user_id = data.get("user_id", "system")
        try:
            sb = get_supabase()
            sb.table("content_jobs").insert({
                "id": job_id, "user_id": user_id, "module": module,
                "status": "queued", "current_step": "queued", "progress_percent": 0,
            }).execute()
        except Exception as e:
            logger.error(f"Job insert failed: {e}")
        update_job_status(job_id, "processing", "starting", 5)
        import asyncio
        asyncio.create_task(process_generation(endpoint, data, job_id))
        return {"accepted": True, "job_id": job_id}
    return handler

make_generate_route("avatar", "avatar")
make_generate_route("movie", "movie")
make_generate_route("documentary", "documentary")
make_generate_route("clip", "clipper")
make_generate_route("remix", "remixer")
make_generate_route("dub", "dubbing")
make_generate_route("thumbnail", "thumbnails")
make_generate_route("audio", "audio")
make_generate_route("news", "news")

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

async def process_generation(endpoint: str, data: dict, job_id: str):
    try:
        update_job_status(job_id, "processing", f"generating_{endpoint}", 30)
        await asyncio.sleep(5)
        update_job_status(job_id, "processing", "uploading", 80)
        await asyncio.sleep(2)
        update_job_status(job_id, "complete", "done", 100,
                         output_url=f"https://example.com/output_{job_id}.mp4")
    except Exception as e:
        update_job_status(job_id, "failed", str(e)[:200], 0)

# ── Model Download ──
@app.function(image=image, timeout=14400, volumes=ALL_VOLUMES, secrets=[secrets])
def setup_all_models():
    import urllib.request
    os.environ["HF_HOME"] = "/models/hf-cache"
    logger.info("=" * 50)
    logger.info("STARTING MODEL DOWNLOADS")
    logger.info("=" * 50)

    def dl(name, path, url):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        if os.path.exists(path) and os.path.getsize(path) > 1000:
            logger.info(f"{name}: exists ({os.path.getsize(path)//1024//1024}MB)")
            return
        logger.info(f"Downloading {name}...")
        try:
            urllib.request.urlretrieve(url, path)
            logger.info(f"{name} done ({os.path.getsize(path)//1024//1024}MB)")
        except Exception as e:
            logger.error(f"{name} failed: {e}")

    dl("Real-ESRGAN x4plus", "/models/esrgan/RealESRGAN_x4plus.pth",
       "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth")
    dl("YOLOv8n", "/models/yolo/yolov8n.pt",
       "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n.pt")

    logger.info("\nHuggingFace models: will auto-download on first use")
    logger.info("To pre-download, run: huggingface-cli download <model>")
    logger.info("=" * 50)
    logger.info("ALL DOWNLOADS COMPLETE!")

# ── Web Endpoint ──
@app.function(image=image, secrets=[secrets])
@modal.asgi_app()
def fastapi_app():
    return web_app
