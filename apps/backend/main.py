import modal

app = modal.App("my-studio")
secrets = modal.Secret.from_name("nexus-studio-secrets")

web_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("fastapi[standard]>=0.100.0", "pydantic>=2.5.0", "supabase>=2.0.0", "cloudinary>=1.36.0", "httpx>=0.27.0", "numpy>=1.24.0", "google-generativeai>=0.7.0", "tqdm>=4.66.0")
)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

web_app = FastAPI()
web_app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@web_app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0", "app": "my-studio"}

@app.function(image=web_image, secrets=[secrets])
@modal.asgi_app()
def fastapi_app():
    return web_app
