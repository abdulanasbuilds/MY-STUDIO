# MY STUDIO — AI AGENT GUIDE

> Every AI agent must read this file completely before writing any code.
> This file defines the absolute rules, conventions, and patterns for MY STUDIO.

---

## What This Project Is

MY STUDIO is a universal web application combining 50+ open source AI models into one platform. It takes any input — text, URL, video, audio, article, or idea — and produces professional-grade video content indistinguishable from Hollywood productions. Built by Abdul Anas (@abdulanasbuilds), a solo founder in Ghana, using AI coding tools on a borrowed laptop during weekends.

The platform consists of 16 interconnected modules deployed across 4 platforms: Vercel (Next.js frontend), Modal.com (Python GPU backend), Cloudflare Workers (edge automation), and Supabase (PostgreSQL database + auth). All AI inference runs as serverless GPU functions on Modal.com. The frontend never calls GPU functions directly — all requests flow through Next.js API routes to Modal endpoints.

---

## The 16 Modules

| # | Module | Primary Open Source Tools |
|---|--------|--------------------------|
| M01 | Avatar Studio | HunyuanVideo-Avatar + GPT-SoVITS + Real-ESRGAN |
| M02 | Movie Generator | SkyReels-V3 + KupkaProd + FilMaster + MusicGen |
| M03 | Documentary Engine | Whisper + NLLB-200 + HunyuanVideo + FFmpeg |
| M04 | Professional Editor | FFmpeg + Remotion + natural language commands |
| M05 | Content Remix | yt-dlp + Whisper + Gemini + format conversion |
| M06 | Rival Intelligence | Firecrawl + yt-dlp + Gemini + pattern analysis |
| M07 | News Studio | RSS + Firecrawl + Gemini + avatar auto-posting |
| M08 | Workflow Studio | React Flow node-based visual automation builder |
| M09 | Audio Studio | AudioCraft/MusicGen + Demucs + Matchering + XTTS |
| M10 | Thumbnail Engine | FLUX.1 + Remotion + A/B testing + all platforms |
| M11 | Nexus Clipper | ViralCutter + WhisperX + MediaPipe + YOLOv8 |
| M12 | Content Remixer | Gemini analysis + script reversal + remix gen |
| M13 | Viral Database | Cloudflare Workers + Serper + YouTube API + Supabase |
| M14 | Competitor Spy | Instaloader + TikTok-Api + Playwright + Gemini |
| M15 | Voice Dubbing | Whisper + NLLB-200 + XTTS + MuseTalk lip sync |
| M16 | Human Feel Engine | FFmpeg + LUTs + Remotion + 12 professional rules |

---

## ABSOLUTE RULES

### TypeScript Rules (NEVER VIOLATE)

1. **Named exports ONLY** — never use `export default`
2. **TypeScript strict: true** — never use the `any` type
3. **Zod validation** on every API route input
4. **getUser() server-side** — NEVER use getSession()
5. **All secrets in env vars** — NEVER in source code
6. **Every feature behind feature flag** — starts `false` (except AVATAR)
7. **@supabase/ssr** for server-side Supabase client — never @supabase/auth-helpers
8. **Database changes as numbered migration files ONLY** — never modify DB directly
9. **No class components** — functional components only
10. **No `index.ts` for components** — use descriptive names (Button.tsx, not index.tsx)

### Python Rules (NEVER VIOLATE)

1. **Type hints on ALL function signatures** — parameters and return types
2. **Pydantic v2 models** for all data structures
3. **os.environ["KEY"]** — never hardcode secrets
4. **Explicit timeout** on every Modal GPU function
5. **API_SECRET_TOKEN check** on every web endpoint
6. **update_job_status()** at every major pipeline step
7. **Temp file cleanup** in `finally` blocks always
8. **Docstrings** on all public functions

### Architecture Rules (NEVER VIOLATE)

1. **Frontend -> /api routes -> Modal** — never direct calls from browser to Modal
2. **Modal endpoints always verify auth token** via security.py
3. **CORS headers** on all Modal web endpoints
4. **Rate limiting** on all frontend API routes
5. **Security headers** in next.config.ts
6. **RLS policies** on every Supabase table
7. **Feature flags** checked before rendering pages and processing API requests

---

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| React components | PascalCase | `Button.tsx`, `StepProgress.tsx` |
| Utility files | camelCase | `supabase.ts`, `rate-limit.ts` |
| API routes | Always `route.ts` | `app/api/generate/avatar/route.ts` |
| Python files | snake_case | `avatar_pipeline.py`, `ffmpeg_utils.py` |
| SQL migrations | Numbered prefix | `001_core_schema.sql`, `002_avatar_schema.sql` |
| Config files | kebab-case | `feature-flags.ts`, `turbo.json` |
| Never | `index.ts` for components | Use `Button.tsx`, not `index.tsx` |

---

## Import Order (TypeScript)

Always follow this order, separated by blank lines:

```typescript
// 1. React and Next.js imports
import { useState, useEffect } from 'react';
import { NextRequest, NextResponse } from 'next/server';

// 2. Third-party libraries
import { motion } from 'framer-motion';
import { z } from 'zod';

// 3. @my-studio/* workspace packages
import { FEATURES, isEnabled } from '@my-studio/config';
import type { ContentJob, JobStatus } from '@my-studio/types';
import { generateAvatarSchema } from '@my-studio/validators';

// 4. Local imports (./relative)
import { createServerClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
```

---

## When Adding New Features

1. Add feature flag in `packages/config/feature-flags.ts` (default: `false`)
2. Create database migration file if needed (next number in sequence)
3. Create feature branch: `git checkout -b feature/[module-name]`
4. Build on branch, test, then merge when complete
5. Enable flag in Vercel env vars when ready for production

---

## Security Checklist (Every API Route)

Every API route in `apps/web/app/api/` MUST include:

- [ ] `getUser()` called first — return 401 if no user
- [ ] Zod schema `.safeParse()` on all inputs — return 400 if invalid
- [ ] `checkRateLimit(user.id, limiter)` — return 429 if exceeded
- [ ] No secrets in client-side code (nothing sensitive in `NEXT_PUBLIC_` vars)
- [ ] Modal called server-side only (never expose MODAL_BASE_URL to browser)
- [ ] Error messages never expose internal details (no stack traces, no secret names)

### API Route Template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';
import { someSchema } from '@my-studio/validators';

export async function POST(request: NextRequest) {
  // 1. Auth
  const supabase = createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate
  const body = await request.json();
  const parsed = someSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // 3. Rate limit
  const limited = await checkRateLimit(user.id, 'generation');
  if (limited) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // 4. Process
  // ...
}
```

---

## Modal Backend Patterns

### Every Pipeline Function

```python
def run_pipeline(data: dict) -> str:
    job_id = data["job_id"]
    temp_files: list[str] = []
    try:
        update_job_status(job_id, "processing", "step_name", 10)
        # ... do work ...
        # ... track temp files ...
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

### Every Web Endpoint

```python
@app.function()
@modal.web_endpoint(method="POST")
def generate_something(data: dict) -> dict:
    from security import verify_request, get_cors_headers
    if not verify_request(data):
        return {"error": "Unauthorized"}, 401
    # ... process ...
    headers = get_cors_headers()
    return {"status": "accepted", "job_id": job_id}
```

---

## Design System (FIXED — NEVER CHANGE)

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#080808` | Page background |
| Surface-1 | `#111111` | Cards, panels |
| Surface-2 | `#1a1a1a` | Elevated surfaces |
| Border | `#2a2a2a` | All borders |
| Primary | `#6366f1` | Buttons, links, active states |
| Secondary | `#8b5cf6` | Secondary actions |
| Success | `#10b981` | Success states, "Active" badges |
| Warning | `#f59e0b` | "Coming Soon" badges, warnings |
| Error | `#ef4444` | Error states, destructive actions |
| Text-primary | `#f9fafb` | Main text |
| Text-secondary | `#9ca3af` | Muted text, labels |
| Font | Inter | All text |
| Design | Mobile-first | 375px minimum width |
| Cards | `rounded-xl` | All card components |

---

## Open Source Model References

### Avatar & Lip Sync
- HunyuanVideo-Avatar: https://github.com/Tencent-Hunyuan/HunyuanVideo-Avatar
- GPT-SoVITS: https://github.com/RVC-Boss/GPT-SoVITS
- MuseTalk 1.5: https://github.com/TMElyralab/MuseTalk
- SadTalker: https://github.com/OpenTalker/SadTalker
- LivePortrait: https://github.com/KwaiVGI/LivePortrait
- Real-ESRGAN: https://github.com/xinntao/Real-ESRGAN

### Cinematic Video
- SkyReels-V3: https://github.com/SkyworkAI/SkyReels-V2
- Open-Sora 2.0: https://github.com/hpcaitech/Open-Sora
- HunyuanVideo 1.5: https://github.com/Tencent-Hunyuan/HunyuanVideo
- CogVideoX 1.5: https://github.com/zai-org/CogVideo
- ConsisID: https://github.com/PKU-YuanGroup/ConsisID
- Wan2.1: https://github.com/Wan-Video/Wan2.1
- FLUX.1-schnell: https://github.com/black-forest-labs/FLUX.1-schnell
- AnimateDiff: https://github.com/guoyww/animatediff
- VideoTuna: https://github.com/VideoVerses/VideoTuna
- LTX-Video: https://github.com/Lightricks/LTX-Video

### Cinematic Intelligence
- FilMaster: https://filmaster-ai.github.io
- KupkaProd: https://github.com/Matticusnicholas/KupkaProd-Cinema-Pipeline
- TokenFlow: https://github.com/omerbt/TokenFlow
- DiffSynth-Studio: https://github.com/modelscope/DiffSynth-Studio

### Audio Production
- AudioCraft/MusicGen: https://github.com/facebookresearch/audiocraft
- Demucs: https://github.com/facebookresearch/demucs
- Coqui XTTS-v2: https://github.com/coqui-ai/TTS
- VoiceFixer: https://github.com/haoheliu/voicefixer
- Matchering: https://github.com/sergree/matchering
- WhisperX: https://github.com/m-bain/whisperX
- Whisper Large v3: https://github.com/openai/whisper

### Clipping & Viral
- ViralCutter: https://github.com/RafaelGodoyEbert/ViralCutter
- ClipsAI: https://github.com/ClipsAI/clipsai
- FunClip: https://github.com/modelscope/FunClip
- OpenShorts: https://github.com/mutonby/openshorts
- Vinci-Clips: https://github.com/tryvinci/vinci-clips

### Face Tracking
- MediaPipe: https://github.com/google/mediapipe
- YOLOv8: https://github.com/ultralytics/ultralytics
- InsightFace: https://github.com/deepinsight/insightface
- OpenCV: https://github.com/opencv/opencv-python

### Competitor Intelligence
- Instaloader: https://github.com/instaloader/instaloader
- TikTok-Api: https://github.com/davidteather/TikTok-Api
- Playwright: https://github.com/microsoft/playwright-python
- Crawl4AI: https://github.com/unclecode/crawl4ai
- Firecrawl: https://github.com/mendableai/firecrawl

### Content Analysis
- PySceneDetect: https://github.com/Breakthrough/PySceneDetect
- CLIP: https://github.com/openai/CLIP
- Trafilatura: https://github.com/adbar/trafilatura
- Newspaper4k: https://github.com/codelucas/newspaper4k
- yt-dlp: https://github.com/yt-dlp/yt-dlp
- NLLB-200: https://huggingface.co/facebook/nllb-200-distilled-600M

### Video Processing
- FFmpeg: system package
- MoviePy: https://github.com/Zulko/moviepy
- Remotion: https://github.com/remotion-dev/remotion
- ProPainter: https://github.com/sczhou/ProPainter
- RIFE: https://github.com/hzwer/ECCV2022-RIFE
- DepthFlow: https://github.com/BrokenSource/DepthFlow
- BackgroundRemover: https://github.com/nadermx/backgroundremover

### Image Generation
- FLUX.1-dev: https://github.com/black-forest-labs/FLUX.1-dev
- Stable Diffusion 3.5: https://huggingface.co/stabilityai/stable-diffusion-3.5-large
- IP-Adapter: https://github.com/tencent-ailab/IP-Adapter
- ControlNet: https://github.com/lllyasviel/ControlNet
- InstantID: https://github.com/InstantX-Team/InstantID
- PhotoMaker: https://github.com/TencentARC/PhotoMaker

---

## Current Build Status

**Phase:** STARTING — Foundation files created
**Working:** CONTEXT.md, PLAN.md, CLAUDE.md, AGENTS.md
**Next task:** Project structure creation (all folders and skeleton files)

*Update this section at the start of every new coding session.*
