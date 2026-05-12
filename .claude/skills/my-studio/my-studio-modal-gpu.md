# Skill: my-studio-modal-gpu

## Triggers
- "GPU function", "modal function", "AI model", "pipeline", "inference", "generate video"

## Purpose
Expert knowledge for writing Modal.com GPU functions and AI model pipelines.

---

## GPU Allocation Guide

| GPU | VRAM | Models | Cost/hr |
|-----|------|--------|---------|
| A100 (80GB) | 80GB | HunyuanVideo-Avatar, SkyReels-V3, CogVideoX, HunyuanVideo 1.5 | ~$3.40 |
| A10G (24GB) | 24GB | GPT-SoVITS, FLUX.1, MusicGen, XTTS-v2, MuseTalk, ClipsAI | ~$1.10 |
| T4 (16GB) | 16GB | Real-ESRGAN, Whisper, MediaPipe, NLLB-200, Demucs, YOLOv8 | ~$0.59 |
| CPU | — | Gemini API calls, Supabase updates, Cloudinary uploads, FFmpeg | ~$0.07 |

---

## Required Patterns

### Every Pipeline Function

```python
def run_pipeline(data: dict) -> str:
    """Run the full pipeline for [module].

    Args:
        data: Dict containing job_id, user inputs, and settings.

    Returns:
        Output URL from Cloudinary.
    """
    job_id: str = data["job_id"]
    temp_files: list[str] = []

    try:
        # Step 1
        update_job_status(job_id, "processing", "step_1_name", 10)
        temp_path = do_step_1(data)
        temp_files.append(temp_path)

        # Step 2
        update_job_status(job_id, "processing", "step_2_name", 30)
        output_path = do_step_2(temp_path)
        temp_files.append(output_path)

        # Upload
        update_job_status(job_id, "processing", "uploading", 90)
        url = upload_video(output_path, job_id, "outputs")

        # Done
        update_job_status(job_id, "complete", "done", 100, output_url=url)
        return url

    except Exception as e:
        update_job_status(job_id, "failed", "error", 0, error=str(e))
        raise

    finally:
        for f in temp_files:
            if os.path.exists(f):
                os.remove(f)
```

### Every Modal Web Endpoint

```python
@app.function(
    gpu="A10G",
    timeout=600,
    secrets=[modal.Secret.from_name("my-studio-secrets")],
    volumes={"/models/sovits": sovits_volume},
)
@modal.web_endpoint(method="POST")
def generate_avatar(data: dict) -> dict:
    """Generate avatar video from text script."""
    from security import verify_request, get_cors_headers

    if not verify_request(data):
        return JSONResponse(
            content={"error": "Unauthorized"},
            status_code=401,
            headers=get_cors_headers(),
        )

    job_id = data.get("job_id", str(uuid.uuid4()))

    # Run pipeline in background (non-blocking)
    run_avatar_pipeline.spawn(data)

    return JSONResponse(
        content={"status": "accepted", "job_id": job_id},
        headers=get_cors_headers(),
    )
```

### Every CORS Preflight Handler

```python
@app.function()
@modal.web_endpoint(method="OPTIONS")
def cors_preflight() -> dict:
    """Handle CORS preflight requests."""
    from security import get_cors_headers
    return JSONResponse(content={}, headers=get_cors_headers())
```

---

## Volume Mounting

Each model gets its own Modal Volume for persistent weight storage:

```python
# Volume definitions
hunyuan_avatar_volume = modal.Volume.from_name("my-studio-hunyuan-avatar", create_if_missing=True)
sovits_volume = modal.Volume.from_name("my-studio-sovits", create_if_missing=True)
esrgan_volume = modal.Volume.from_name("my-studio-esrgan", create_if_missing=True)
whisper_volume = modal.Volume.from_name("my-studio-whisper", create_if_missing=True)
flux_volume = modal.Volume.from_name("my-studio-flux", create_if_missing=True)
musicgen_volume = modal.Volume.from_name("my-studio-musicgen", create_if_missing=True)
musetalk_volume = modal.Volume.from_name("my-studio-musetalk", create_if_missing=True)
skyreels_volume = modal.Volume.from_name("my-studio-skyreels", create_if_missing=True)
demucs_volume = modal.Volume.from_name("my-studio-demucs", create_if_missing=True)
nllb_volume = modal.Volume.from_name("my-studio-nllb", create_if_missing=True)
xtts_volume = modal.Volume.from_name("my-studio-xtts", create_if_missing=True)
yolov8_volume = modal.Volume.from_name("my-studio-yolov8", create_if_missing=True)
filmaster_volume = modal.Volume.from_name("my-studio-filmaster", create_if_missing=True)
cogvideo_volume = modal.Volume.from_name("my-studio-cogvideo", create_if_missing=True)
hunyuan_video_volume = modal.Volume.from_name("my-studio-hunyuan-video", create_if_missing=True)
temp_volume = modal.Volume.from_name("my-studio-temp", create_if_missing=True)
```

---

## Cold Start Mitigation

```python
# Keep warm ONLY on critical endpoints (costs money when idle)
@app.function(
    gpu="A10G",
    keep_warm=1,  # Only for most-used endpoints
    ...
)
```

Only use `keep_warm=1` on:
- Avatar generation (most used)
- Clip generation (most used)

All other endpoints: `keep_warm=0` (default) — cold start is acceptable.

---

## Timeout Guidelines

| Task Type | Timeout | Example |
|-----------|---------|---------|
| Health check | 30s | GET /health |
| Voice cloning | 300s | clone_voice() |
| Avatar video | 600s | HunyuanVideo-Avatar |
| Movie scene | 900s | SkyReels-V3 |
| Full movie | 1800s | movie_pipeline (multiple scenes) |
| Clip extraction | 600s | clipper_pipeline |
| Dubbing | 900s | dubbing_pipeline |

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| CUDA out of memory | Model too large for GPU | Use smaller GPU or quantize model |
| Volume not found | Volume not created | Add `create_if_missing=True` |
| Timeout exceeded | Pipeline too slow | Increase timeout or optimize |
| ImportError | Package not in image | Add to image pip_install list |
| Permission denied on /models | Volume not mounted | Check volumes dict in @app.function |
