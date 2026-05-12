# MY STUDIO — COMPLETE PROJECT CONTEXT

> **Read this file completely before doing anything.**
> This file contains the full project specification including all 16 modules,
> all open source tools, all tech stack decisions, all code rules, and all design decisions.

---

## Project Identity

- **Name:** MY STUDIO
- **Creator:** Abdul Anas (@abdulanasbuilds)
- **Location:** Ghana
- **Build Method:** AI coding tools on a borrowed laptop, weekends only
- **License:** Open Source
- **Google Doc:** https://docs.google.com/document/d/e/2PACX-1vQ3TW9mrBNrNWKlGNbUfatuFCTDff-Q2-xO6EbsbTq0FFy1cT_DL5NjahQXaT2ASNNjY0BGqD2cNvAp/pub

---

## What MY STUDIO Is

A universal web application combining 50+ open source AI models into one platform. Takes any input (text, URL, video, audio, article, idea) and produces professional-grade video content indistinguishable from Hollywood productions.

**Replaces:**
| Tool | Monthly Cost |
|------|-------------|
| HeyGen | $89/mo |
| Opus Clips | $29/mo |
| Descript | $24/mo |
| Premiere Pro | $55/mo |
| 10+ other tools | $289+/mo |
| **Total replacement value** | **$486+/mo** |
| **Cost to MY STUDIO user** | **$0/mo** |

---

## The 16 Modules

| # | Module | Description | Primary Open Source Tools |
|---|--------|-------------|--------------------------|
| M01 | Avatar Studio | AI talking head videos from text | HunyuanVideo-Avatar + GPT-SoVITS + Real-ESRGAN |
| M02 | Movie Generator | Full cinematic films from prompts | SkyReels-V3 + KupkaProd + FilMaster + MusicGen |
| M03 | Documentary Engine | Auto documentaries from sources | Whisper + NLLB-200 + HunyuanVideo + FFmpeg |
| M04 | Professional Editor | NL command video editing | FFmpeg + Remotion + natural language commands |
| M05 | Content Remix | Reformat content across platforms | yt-dlp + Whisper + Gemini + format conversion |
| M06 | Rival Intelligence | Analyze competitor strategies | Firecrawl + yt-dlp + Gemini + pattern analysis |
| M07 | News Studio | Auto news content from RSS feeds | RSS + Firecrawl + Gemini + avatar auto-posting |
| M08 | Workflow Studio | Visual automation builder | React Flow node-based visual automation builder |
| M09 | Audio Studio | Music, SFX, voice production | AudioCraft/MusicGen + Demucs + Matchering + XTTS |
| M10 | Thumbnail Engine | AI thumbnails with A/B testing | FLUX.1 + Remotion + A/B testing + all platforms |
| M11 | Nexus Clipper | Viral clip extraction from long video | ViralCutter + WhisperX + MediaPipe + YOLOv8 |
| M12 | Content Remixer | Analyze viral content + remix scripts | Gemini analysis + script reversal + remix gen |
| M13 | Viral Database | Shared library of viral content | Cloudflare Workers + Serper + YouTube API + Supabase |
| M14 | Competitor Spy | Track competitor accounts + alerts | Instaloader + TikTok-Api + Playwright + Gemini |
| M15 | Voice Dubbing | Translate + dub videos in 200 languages | Whisper + NLLB-200 + XTTS + MuseTalk lip sync |
| M16 | Human Feel Engine | Make AI content feel human | FFmpeg + LUTs + Remotion + 12 professional rules |

---

## Complete Tech Stack

### Frontend
- **Framework:** Next.js 14 App Router
- **Language:** TypeScript (strict: true)
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **Deployment:** Vercel (free tier)

### Backend
- **Language:** Python 3.11
- **Compute:** Modal.com (GPU compute, $30 free/month)
- **Pattern:** All AI models run as serverless GPU functions
- **Deployment:** Modal.com

### Database
- **Provider:** Supabase
- **Engine:** PostgreSQL
- **Features:** Auth + Realtime + RLS + Edge Functions

### Edge Workers
- **Provider:** Cloudflare Workers
- **Purpose:** News monitoring, viral hunting, rival watching

### Storage
- **Provider:** Cloudinary
- **Purpose:** All video/image/audio output
- **Tier:** Free 10GB

### Queue & Rate Limiting
- **Provider:** Upstash Redis
- **Purpose:** Rate limiting + job queuing
- **Tier:** Free tier

### Monorepo
- **Tool:** Turborepo
- **Pattern:** One GitHub repo, multiple deployments

### CI/CD
- **Provider:** GitHub Actions
- **Pattern:** Auto-validate on push

---

## Complete Open Source AI Models

### Avatar & Lip Sync
- **HunyuanVideo-Avatar:** github.com/Tencent-Hunyuan/HunyuanVideo-Avatar
- **GPT-SoVITS:** github.com/RVC-Boss/GPT-SoVITS
- **MuseTalk 1.5:** github.com/TMElyralab/MuseTalk
- **SadTalker:** github.com/OpenTalker/SadTalker
- **LivePortrait:** github.com/KwaiVGI/LivePortrait
- **Real-ESRGAN:** github.com/xinntao/Real-ESRGAN

### Cinematic Video
- **SkyReels-V3:** github.com/SkyworkAI/SkyReels-V2
- **Open-Sora 2.0:** github.com/hpcaitech/Open-Sora
- **HunyuanVideo 1.5:** github.com/Tencent-Hunyuan/HunyuanVideo
- **CogVideoX 1.5:** github.com/zai-org/CogVideo
- **ConsisID:** github.com/PKU-YuanGroup/ConsisID
- **Wan2.1:** github.com/Wan-Video/Wan2.1
- **FLUX.1-schnell:** github.com/black-forest-labs/FLUX.1-schnell
- **AnimateDiff:** github.com/guoyww/animatediff
- **VideoTuna:** github.com/VideoVerses/VideoTuna
- **LTX-Video:** github.com/Lightricks/LTX-Video

### Cinematic Intelligence
- **FilMaster:** filmaster-ai.github.io
- **KupkaProd:** github.com/Matticusnicholas/KupkaProd-Cinema-Pipeline
- **TokenFlow:** github.com/omerbt/TokenFlow
- **DiffSynth-Studio:** github.com/modelscope/DiffSynth-Studio

### Audio Production
- **AudioCraft/MusicGen:** github.com/facebookresearch/audiocraft
- **Demucs:** github.com/facebookresearch/demucs
- **Coqui XTTS-v2:** github.com/coqui-ai/TTS
- **VoiceFixer:** github.com/haoheliu/voicefixer
- **Matchering:** github.com/sergree/matchering
- **WhisperX:** github.com/m-bain/whisperX
- **Whisper Large v3:** github.com/openai/whisper

### Clipping & Viral
- **ViralCutter:** github.com/RafaelGodoyEbert/ViralCutter
- **ClipsAI:** github.com/ClipsAI/clipsai
- **FunClip:** github.com/modelscope/FunClip
- **OpenShorts:** github.com/mutonby/openshorts
- **Vinci-Clips:** github.com/tryvinci/vinci-clips

### Face Tracking
- **MediaPipe:** google/mediapipe
- **YOLOv8:** github.com/ultralytics/ultralytics
- **InsightFace:** github.com/deepinsight/insightface
- **OpenCV:** opencv/opencv-python

### Competitor Intelligence
- **Instaloader:** github.com/instaloader/instaloader
- **TikTok-Api:** github.com/davidteather/TikTok-Api
- **Playwright:** github.com/microsoft/playwright-python
- **Crawl4AI:** github.com/unclecode/crawl4ai
- **Firecrawl:** github.com/mendableai/firecrawl

### Content Analysis
- **PySceneDetect:** github.com/Breakthrough/PySceneDetect
- **CLIP:** openai/CLIP
- **Trafilatura:** github.com/adbar/trafilatura
- **Newspaper4k:** github.com/codelucas/newspaper4k
- **yt-dlp:** github.com/yt-dlp/yt-dlp
- **NLLB-200:** facebook/nllb-200-distilled-600M

### Video Processing
- **FFmpeg:** system package — backbone of all video work
- **MoviePy:** github.com/Zulko/moviepy
- **Remotion:** github.com/remotion-dev/remotion
- **ProPainter:** github.com/sczhou/ProPainter
- **RIFE:** github.com/hzwer/ECCV2022-RIFE
- **DepthFlow:** github.com/BrokenSource/DepthFlow
- **BackgroundRemover:** github.com/nadermx/backgroundremover
- **SceneDetect:** github.com/Breakthrough/PySceneDetect

### Image Generation
- **FLUX.1-dev:** github.com/black-forest-labs/FLUX.1-dev
- **Stable Diffusion 3.5:** Stability-AI/stable-diffusion-3.5
- **IP-Adapter:** github.com/tencent-ailab/IP-Adapter
- **ControlNet:** github.com/lllyasviel/ControlNet
- **InstantID:** github.com/InstantX-Team/InstantID
- **PhotoMaker:** github.com/TencentARC/PhotoMaker

---

## Absolute Code Rules (NEVER VIOLATE)

### TypeScript Rules
- Named exports ONLY — never default exports
- TypeScript strict: true — never use 'any' type
- Zod validation on every API route input
- getUser() server-side — NEVER getSession()
- All secrets in env vars — NEVER in source code
- Every feature behind feature flag (starts false)
- @supabase/ssr for server-side Supabase client
- Database changes as numbered migration files ONLY
- No class components — functional only

### Python Rules
- Type hints on ALL function signatures
- Pydantic v2 models for all data structures
- os.environ["KEY"] — never hardcode secrets
- Explicit timeout on every Modal GPU function
- API_SECRET_TOKEN check on every web endpoint
- update_job_status() at every major pipeline step
- Temp file cleanup in finally blocks always

### Architecture Rules
- Frontend -> /api routes -> Modal (never direct calls)
- Modal endpoints always verify auth token
- CORS headers on all Modal web endpoints
- Rate limiting on all frontend API routes
- Security headers in next.config.ts
- RLS policies on every Supabase table

---

## Design System (FIXED — NEVER CHANGE)

| Token | Value |
|-------|-------|
| Background | #080808 |
| Surface-1 | #111111 |
| Surface-2 | #1a1a1a |
| Border | #2a2a2a |
| Primary | #6366f1 |
| Secondary | #8b5cf6 |
| Success | #10b981 |
| Warning | #f59e0b |
| Error | #ef4444 |
| Text-primary | #f9fafb |
| Text-secondary | #9ca3af |
| Font | Inter |
| Design approach | Mobile-first |
| Card style | rounded-xl |

---

## Environment Variables

### Vercel (Frontend)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
MODAL_BASE_URL
MODAL_API_SECRET_TOKEN
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
DEPLOYMENT_MODE
FEATURE_AVATAR (through FEATURE_SPY — all 16 flags)
```

### Modal (Backend)
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
HUGGINGFACE_TOKEN
GEMINI_API_KEY
API_SECRET_TOKEN
FIRECRAWL_API_KEY
OPENROUTER_API_KEY
SERPER_API_KEY
```

### Cloudflare (Edge Workers)
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SERPER_API_KEY
NEWS_API_KEY
YOUTUBE_API_KEY
```

---

## Security Architecture (6 Layers)

1. **Layer 1 — HTTPS:** Automatic via Vercel/Modal/Cloudflare
2. **Layer 2 — API Auth:** Bearer token on all Modal endpoints + 5-min timestamp window
3. **Layer 3 — Supabase RLS:** Row-level security on every table, user-scoped data
4. **Layer 4 — Zod Validation:** All API inputs validated with Zod schemas
5. **Layer 5 — Rate Limiting:** Upstash Redis — generation (10/hr), API (60/min), auth (5/15min)
6. **Layer 6 — Secret Management:** All secrets in env vars only, never in source code

---

## Connection Architecture

```
User (Phone/Browser)
    |
    v
Vercel (Next.js Frontend)
    |
    ├── /api/generate/* ──> Modal.com (GPU Functions)
    |                           |
    |                           ├── Supabase (update job status)
    |                           ├── Cloudinary (upload output)
    |                           └── HuggingFace (model weights)
    |
    ├── /api/status/* ──> Supabase (read job status)
    |
    ├── /api/upload/* ──> Cloudinary (direct upload)
    |
    └── Supabase Auth (login/signup)

Cloudflare Workers (Edge — runs on cron)
    |
    ├── News Monitor ──> RSS + Firecrawl ──> Supabase
    ├── Trend Detector ──> Serper API ──> Supabase
    ├── Viral Hunter ──> YouTube API ──> Modal (analyze) ──> Supabase
    └── Rival Watcher ──> Instaloader/TikTok-Api ──> Supabase (+ notifications)
```

---

## Module Build Sequence (Priority Order)

| Phase | Weekend | Modules | Why This Order |
|-------|---------|---------|----------------|
| 1 | Weekend 1 | Foundation (packages, DB, backend skeleton, frontend shell) | Everything depends on this |
| 2 | Weekend 2 | M01 Avatar Studio | First working module, proves the stack |
| 3 | Weekend 3 | M11 Clipper | Highest user demand feature |
| 4 | Weekend 4 | M12 Remixer + M13 Viral DB | Growth intelligence tools |
| 5 | Weekend 5 | M14 Spy + M06 Rivals | Competitive advantage |
| 6 | Weekend 6 | M02 Movie Generator | Flagship wow feature |
| 7 | Weekend 7 | M15 Voice Dubbing | African language support |
| 8 | Weekend 8 | M09 Audio Studio + M16 Human Feel | Polish & quality |
| 9 | Weekend 9 | M03 Documentary + M05 Content Remix | Content repurposing |
| 10 | Weekend 10 | M04 Editor + M10 Thumbnails | Professional tools |
| 11 | Weekend 11 | M07 News Studio + M08 Workflow | Automation |

---

## File Naming Conventions

- React components: PascalCase (`Button.tsx`)
- Utility files: camelCase (`supabase.ts`)
- API routes: always `route.ts`
- Python files: snake_case (`avatar_pipeline.py`)
- SQL files: numbered (`001_description.sql`)
- Never: `index.ts` for components

## Import Order (TypeScript)

1. React and Next.js imports
2. Third-party libraries
3. @my-studio/* workspace packages
4. Local imports (./relative)

---

## Commit Format

```
feat: [module] [what was built]
fix: [module] [what was fixed]
chore: [what maintenance was done]

Example: "feat: avatar studio voice cloning endpoint"
```

---

## Feature Flag Strategy

All 16 modules gated by feature flags. All start `false` except AVATAR (`true`).

```
FEATURE_AVATAR=true       (M01 — enabled by default)
FEATURE_MOVIE=false       (M02)
FEATURE_DOCUMENTARY=false (M03)
FEATURE_EDITOR=false      (M04)
FEATURE_REMIX=false       (M05)
FEATURE_RIVALS=false      (M06)
FEATURE_NEWS=false        (M07)
FEATURE_WORKFLOW=false    (M08)
FEATURE_AUDIO=false       (M09)
FEATURE_THUMBNAILS=false  (M10)
FEATURE_CLIPPER=false     (M11)
FEATURE_REMIXER=false     (M12)
FEATURE_VIRAL_DB=false    (M13)
FEATURE_SPY=false         (M14)
FEATURE_DUBBING=false     (M15)
FEATURE_HUMAN_FEEL=false  (M16)
```

Enable in Vercel env vars when module is ready.

---

## Deployment Architecture

```
One GitHub Repo (Turborepo monorepo)
    |
    ├── apps/web/       ──> Vercel (auto-deploy on push to main)
    ├── apps/backend/   ──> Modal.com (manual: modal deploy main.py)
    ├── apps/workers/   ──> Cloudflare (auto-deploy via GitHub Actions)
    └── supabase/       ──> Supabase (manual: run SQL in dashboard)
```

---

*This is the single source of truth for MY STUDIO. Every AI agent, every session, every file references this document.*
