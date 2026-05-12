# MY STUDIO — ARCHITECTURAL BLUEPRINT

> Generated from CONTEXT.md — the single source of truth.
> This document defines the complete architecture, every file, every connection, every decision.

---

## 1. Project Overview

**MY STUDIO** is a universal web application combining 50+ open source AI models into one platform. It takes any input — text, URL, video, audio, article, or idea — and produces professional-grade video content indistinguishable from Hollywood productions. Built by Abdul Anas (@abdulanasbuilds), a solo founder in Ghana, using AI coding tools on a borrowed laptop during weekends.

The platform replaces $486+/month worth of tools (HeyGen, Opus Clips, Descript, Premiere Pro, and 10+ others) at zero cost to the user. It consists of 16 interconnected modules spanning avatar creation, cinematic film generation, viral content intelligence, competitor analysis, voice dubbing across 200 languages, and automated post-production with human-feel processing.

**Architecture Pattern:** Turborepo monorepo deploying to 4 platforms — Vercel (frontend), Modal.com (GPU backend), Cloudflare Workers (edge automation), and Supabase (database + auth). All AI inference runs as serverless GPU functions on Modal.com. The frontend never calls GPU functions directly — all requests flow through Next.js API routes.

---

## 2. Complete Folder Structure

```
my-studio/
│
├── CONTEXT.md                          ← Single source of truth (read first)
├── PLAN.md                             ← This file — architectural blueprint
├── CLAUDE.md                           ← AI agent coding rules
├── AGENTS.md                           ← AI agent behavioral guide
├── README.md                           ← Public project documentation
├── package.json                        ← Root Turborepo workspace config
├── turbo.json                          ← Turborepo pipeline configuration
├── .gitignore                          ← Never commit secrets, builds, node_modules
├── .npmrc                              ← Package manager config
│
├── .github/
│   └── workflows/
│       ├── validate.yml                ← CI: type-check, lint, py_compile on push
│       └── deploy.yml                  ← CD: deploy workers on push to main
│
├── apps/
│   ├── web/                            ← Next.js 14 frontend → Vercel
│   │   ├── package.json                ← All frontend dependencies
│   │   ├── tsconfig.json               ← Strict TypeScript + path aliases
│   │   ├── next.config.ts              ← Security headers + image domains
│   │   ├── tailwind.config.ts          ← Design system tokens
│   │   ├── postcss.config.js           ← PostCSS for Tailwind
│   │   ├── middleware.ts               ← Supabase SSR auth protection
│   │   ├── app/
│   │   │   ├── globals.css             ← Tailwind directives + custom styles
│   │   │   ├── layout.tsx              ← Root layout: Inter font, dark bg, providers
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   │       └── page.tsx        ← Login page: email+password, Supabase auth
│   │   │   ├── (studio)/
│   │   │   │   ├── layout.tsx          ← Studio shell: sidebar + mobile tabs
│   │   │   │   ├── avatar/
│   │   │   │   │   └── page.tsx        ← M01: Avatar Studio (full UI)
│   │   │   │   ├── movie/
│   │   │   │   │   └── page.tsx        ← M02: Movie Generator
│   │   │   │   ├── documentary/
│   │   │   │   │   └── page.tsx        ← M03: Documentary Engine
│   │   │   │   ├── editor/
│   │   │   │   │   └── page.tsx        ← M04: Professional Editor
│   │   │   │   ├── remix/
│   │   │   │   │   └── page.tsx        ← M05: Content Remix
│   │   │   │   ├── rivals/
│   │   │   │   │   └── page.tsx        ← M06: Rival Intelligence
│   │   │   │   ├── news/
│   │   │   │   │   └── page.tsx        ← M07: News Studio
│   │   │   │   ├── workflow/
│   │   │   │   │   └── page.tsx        ← M08: Workflow Studio
│   │   │   │   ├── audio/
│   │   │   │   │   └── page.tsx        ← M09: Audio Studio
│   │   │   │   ├── thumbnails/
│   │   │   │   │   └── page.tsx        ← M10: Thumbnail Engine
│   │   │   │   ├── clipper/
│   │   │   │   │   └── page.tsx        ← M11: Clipper
│   │   │   │   ├── remixer/
│   │   │   │   │   └── page.tsx        ← M12: Content Remixer
│   │   │   │   ├── viral-db/
│   │   │   │   │   └── page.tsx        ← M13: Viral Database
│   │   │   │   ├── spy/
│   │   │   │   │   └── page.tsx        ← M14: Competitor Spy
│   │   │   │   ├── dubbing/
│   │   │   │   │   └── page.tsx        ← M15: Voice Dubbing
│   │   │   │   ├── library/
│   │   │   │   │   └── page.tsx        ← Content library (all outputs)
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx        ← User settings + avatar management
│   │   │   └── api/
│   │   │       ├── generate/
│   │   │       │   ├── avatar/
│   │   │       │   │   └── route.ts    ← POST: trigger avatar generation
│   │   │       │   ├── movie/
│   │   │       │   │   └── route.ts    ← POST: trigger movie generation
│   │   │       │   ├── documentary/
│   │   │       │   │   └── route.ts    ← POST: trigger documentary generation
│   │   │       │   ├── clip/
│   │   │       │   │   └── route.ts    ← POST: trigger clip extraction
│   │   │       │   ├── remix/
│   │   │       │   │   └── route.ts    ← POST: trigger content remix
│   │   │       │   ├── dub/
│   │   │       │   │   └── route.ts    ← POST: trigger voice dubbing
│   │   │       │   └── thumbnail/
│   │   │       │       └── route.ts    ← POST: trigger thumbnail generation
│   │   │       ├── rivals/
│   │   │       │   ├── analyze/
│   │   │       │   │   └── route.ts    ← POST: analyze a competitor
│   │   │       │   └── [id]/
│   │   │       │       └── route.ts    ← GET/DELETE: rival by ID
│   │   │       ├── status/
│   │   │       │   └── [jobId]/
│   │   │       │       └── route.ts    ← GET: poll job status
│   │   │       ├── upload/
│   │   │       │   └── route.ts        ← POST: upload to Cloudinary
│   │   │       └── webhooks/
│   │   │           └── job-complete/
│   │   │               └── route.ts    ← POST: Modal callback on completion
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx          ← Variants: primary|secondary|ghost|danger|outline
│   │   │   │   ├── Card.tsx            ← Dark surface card with border
│   │   │   │   ├── Progress.tsx        ← Linear progress bar
│   │   │   │   ├── ComingSoon.tsx      ← Locked module placeholder
│   │   │   │   ├── VideoPlayer.tsx     ← Custom HTML5 player, dark theme
│   │   │   │   ├── StepProgress.tsx    ← Multi-step generation progress
│   │   │   │   ├── AvatarProfile.tsx   ← Avatar face + voice status display
│   │   │   │   ├── Toast.tsx           ← Toast notification system
│   │   │   │   ├── Modal.tsx           ← Modal/dialog component
│   │   │   │   ├── Badge.tsx           ← Status badges (active, coming soon, etc.)
│   │   │   │   ├── Input.tsx           ← Text input with label + error
│   │   │   │   ├── Select.tsx          ← Dropdown select
│   │   │   │   ├── Switch.tsx          ← Toggle switch
│   │   │   │   ├── Slider.tsx          ← Range slider
│   │   │   │   ├── Tabs.tsx            ← Tab navigation
│   │   │   │   └── DropZone.tsx        ← Drag-and-drop file upload
│   │   │   ├── editor/
│   │   │   │   ├── Timeline.tsx        ← Video timeline component
│   │   │   │   ├── ClipCard.tsx        ← Individual clip in results
│   │   │   │   ├── EditCommandBar.tsx  ← Natural language edit input
│   │   │   │   └── PlatformPreview.tsx ← Preview in TikTok/Reels/YouTube format
│   │   │   ├── workflow/
│   │   │   │   ├── NodeCanvas.tsx      ← React Flow canvas
│   │   │   │   ├── NodeTypes.tsx       ← Custom node definitions
│   │   │   │   └── EdgeTypes.tsx       ← Custom edge definitions
│   │   │   └── player/
│   │   │       └── VideoPlayer.tsx     ← Extended player for editor module
│   │   └── lib/
│   │       ├── supabase.ts             ← Browser + server client factories
│   │       ├── modal.ts                ← triggerGeneration + getJobStatus
│   │       ├── cloudinary.ts           ← uploadFile + deleteFile
│   │       ├── rate-limit.ts           ← Upstash Redis rate limiters
│   │       └── cn.ts                   ← Tailwind class merge utility
│   │
│   ├── backend/                        ← Python 3.11 → Modal.com
│   │   ├── main.py                     ← Modal app: all endpoints + image def
│   │   ├── security.py                 ← Auth verification + CORS headers
│   │   ├── db.py                       ← Supabase client + job status updates
│   │   ├── storage.py                  ← Cloudinary upload/delete
│   │   ├── requirements.txt            ← All Python deps with pinned versions
│   │   ├── pipelines/
│   │   │   ├── __init__.py
│   │   │   ├── avatar_pipeline.py      ← M01: face + voice + animate + enhance
│   │   │   ├── movie_pipeline.py       ← M02: script + storyboard + scenes + score
│   │   │   ├── documentary_pipeline.py ← M03: sources + narrate + assemble
│   │   │   ├── clipper_pipeline.py     ← M11: ingest + transcribe + score + clip
│   │   │   ├── dubbing_pipeline.py     ← M15: transcribe + translate + clone + sync
│   │   │   ├── remix_pipeline.py       ← M05/M12: analyze + remix scripts
│   │   │   ├── thumbnail_pipeline.py   ← M10: generate + A/B variants
│   │   │   └── audio_pipeline.py       ← M09: music + SFX + voice production
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── hunyuan_avatar.py       ← HunyuanVideo-Avatar inference
│   │   │   ├── hunyuan_video.py        ← HunyuanVideo 1.5 inference
│   │   │   ├── skyreels.py             ← SkyReels-V3 inference
│   │   │   ├── cogvideo.py             ← CogVideoX 1.5 inference
│   │   │   ├── flux.py                 ← FLUX.1-schnell image generation
│   │   │   ├── sovits.py               ← GPT-SoVITS voice cloning + TTS
│   │   │   ├── musetalk.py             ← MuseTalk fast lip sync
│   │   │   ├── esrgan.py               ← Real-ESRGAN video enhancement
│   │   │   ├── musicgen.py             ← MusicGen music generation
│   │   │   ├── demucs.py               ← Demucs audio separation
│   │   │   ├── whisper_model.py        ← WhisperX word-level transcription
│   │   │   ├── filmaster.py            ← FilMaster cinematic intelligence
│   │   │   └── mediapipe_tracker.py    ← MediaPipe face tracking + crop
│   │   ├── intelligence/
│   │   │   ├── __init__.py
│   │   │   ├── viral_scorer.py         ← 12-signal viral moment scoring
│   │   │   ├── content_remixer.py      ← Analyze + generate remix scripts
│   │   │   ├── competitor_spy.py       ← Multi-platform competitor analysis
│   │   │   ├── script_writer.py        ← Gemini screenplay generation
│   │   │   ├── edit_interpreter.py     ← Natural language edit commands
│   │   │   └── trend_detector.py       ← Trending topic detection
│   │   └── postproduction/
│   │       ├── __init__.py
│   │       ├── human_feel.py           ← 12 rules to make AI content feel human
│   │       ├── ffmpeg_utils.py         ← All FFmpeg utility functions
│   │       ├── color_grading.py        ← LUT application + color correction
│   │       ├── audio_mixing.py         ← Multi-track audio mixing
│   │       └── caption_engine.py       ← Remotion caption rendering
│   │
│   └── workers/                        ← JavaScript → Cloudflare Workers
│       ├── news-monitor/
│       │   ├── index.js                ← RSS + Firecrawl news ingestion
│       │   └── wrangler.toml           ← Cloudflare config + cron
│       ├── trend-detector/
│       │   ├── index.js                ← Serper API trending topics
│       │   └── wrangler.toml
│       ├── viral-hunter/
│       │   ├── index.js                ← YouTube API + analysis pipeline
│       │   └── wrangler.toml
│       └── rival-watcher/
│           ├── index.js                ← Monitor competitor accounts
│           └── wrangler.toml
│
├── packages/
│   ├── config/
│   │   ├── package.json                ← @my-studio/config package
│   │   ├── index.ts                    ← Central config from env vars
│   │   ├── feature-flags.ts            ← 16 feature flags
│   │   └── environments/
│   │       ├── personal.env.example    ← Template for personal dev
│   │       └── selfhost.env.example    ← Template for self-hosting
│   ├── types/
│   │   ├── package.json                ← @my-studio/types package
│   │   └── index.ts                    ← All TypeScript type definitions
│   └── validators/
│       ├── package.json                ← @my-studio/validators package
│       └── schemas.ts                  ← All Zod validation schemas
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_core_schema.sql         ← content_jobs, content_library, user_profile, etc.
│   │   ├── 002_avatar_schema.sql       ← avatar_profiles, voice_samples
│   │   ├── 003_clipper_schema.sql      ← content_clips
│   │   ├── 004_rival_schema.sql        ← rival_profiles, rival_posts, content_remixes
│   │   ├── 005_viral_db_schema.sql     ← viral_content (shared)
│   │   └── 006_notifications_schema.sql ← notifications + triggers
│   └── functions/
│       └── on-job-complete/
│           └── index.ts                ← Edge function: notify on job complete
│
├── remotion/
│   ├── captions/
│   │   ├── HormoziStyle.tsx            ← Bold white, word highlight yellow
│   │   ├── NetflixStyle.tsx            ← Clean serif, bottom position
│   │   ├── TikTokPop.tsx              ← Pop-in animation per word
│   │   └── BreakingNews.tsx            ← Lower third with red bar
│   ├── graphics/
│   │   ├── LowerThird.tsx              ← Name/title overlay
│   │   ├── NewsChyron.tsx              ← News ticker bar
│   │   └── IntroOutro.tsx              ← Intro/outro sequences
│   └── thumbnails/
│       ├── FaceHook.tsx                ← Face-focused thumbnail
│       └── CinematicScene.tsx          ← Cinematic scene thumbnail
│
├── docs/
│   ├── ARCHITECTURE.md                 ← Technical architecture deep dive
│   ├── MODULES.md                      ← Module-by-module documentation
│   ├── SELF_HOSTING.md                 ← Self-hosting guide
│   └── API.md                          ← API endpoint documentation
│
└── scripts/
    ├── setup.sh                        ← Initial setup script
    ├── validate-env.ts                 ← Validate all env vars present
    └── download-models.py              ← Download all model weights
```

**Total: ~130 files across 4 deployment targets.**

---

## 3. Tech Stack Decisions & Justifications

| Decision | Choice | Why |
|----------|--------|-----|
| Frontend framework | Next.js 14 App Router | Server components, API routes, Vercel free tier, best React DX |
| Language (frontend) | TypeScript strict | Catches bugs before runtime, better AI agent code quality |
| Styling | Tailwind CSS | Utility-first, fast iteration, works great with AI agents |
| Animation | Framer Motion | Best React animation library, declarative API |
| Backend compute | Modal.com | Serverless GPU, pay-per-use, $30 free/month, Python native |
| Database | Supabase PostgreSQL | Free tier generous, built-in auth, RLS, realtime, edge functions |
| Edge workers | Cloudflare Workers | Free tier, cron triggers, global edge, perfect for monitoring |
| Storage | Cloudinary | Free 10GB, video transformations, CDN delivery |
| Rate limiting | Upstash Redis | Serverless Redis, free tier, works from edge |
| Monorepo | Turborepo | Fast builds, shared packages, single repo for all targets |
| CI/CD | GitHub Actions | Free for public repos, integrates with all deployment targets |
| Forms | React Hook Form + Zod | Performant forms, schema validation shared with API routes |
| Icons | Lucide React | Consistent, tree-shakeable, large icon set |

### Why NOT Other Choices

| Rejected | Why |
|----------|-----|
| Docker/K8s | Overkill for solo dev, Modal.com handles GPU orchestration |
| AWS Lambda | No GPU support, complex setup, expensive for video |
| Firebase | No PostgreSQL, weaker RLS, vendor lock-in |
| Prisma | Adds complexity, Supabase client is sufficient |
| Redux/Zustand | Overkill — React Server Components + URL state sufficient |
| tRPC | Adds complexity, standard REST is clearer for Modal integration |

---

## 4. Open Source Model Map

### By Module

| Module | Primary Model | Fallback | GPU Tier | Modal Volume |
|--------|--------------|----------|----------|-------------|
| M01 Avatar | HunyuanVideo-Avatar | MuseTalk (fast) | A100 / A10G | /models/hunyuan-avatar |
| M01 Voice | GPT-SoVITS | XTTS-v2 | A10G | /models/sovits |
| M01 Enhance | Real-ESRGAN | — | T4 | /models/esrgan |
| M02 Video | SkyReels-V3 | HunyuanVideo 1.5 | A100 | /models/skyreels |
| M02 Script | Gemini 3.1 Pro | — | CPU (API) | — |
| M02 Storyboard | FLUX.1-schnell | — | A10G | /models/flux |
| M02 Score | MusicGen | — | A10G | /models/musicgen |
| M02 Cinema | FilMaster | KupkaProd | CPU | /models/filmaster |
| M03 Transcribe | WhisperX | Whisper Large v3 | T4 | /models/whisper |
| M03 Translate | NLLB-200 | — | T4 | /models/nllb |
| M09 Music | AudioCraft/MusicGen | — | A10G | /models/musicgen |
| M09 Separate | Demucs | — | T4 | /models/demucs |
| M09 Voice | Coqui XTTS-v2 | GPT-SoVITS | A10G | /models/xtts |
| M10 Thumbnail | FLUX.1-dev | FLUX.1-schnell | A10G | /models/flux |
| M11 Clip | ViralCutter + ClipsAI | — | T4 | — |
| M11 Track | MediaPipe + YOLOv8 | — | T4 | /models/yolov8 |
| M11 Score | Gemini 3 Flash | — | CPU (API) | — |
| M12 Analyze | Gemini 3.1 Pro | — | CPU (API) | — |
| M14 Scrape | Instaloader/TikTok-Api | Playwright | CPU | — |
| M15 Lip Sync | MuseTalk | — | A10G | /models/musetalk |
| M15 Clone | XTTS-v2 | GPT-SoVITS | A10G | /models/xtts |
| M16 Process | FFmpeg + LUTs | — | CPU | — |

### GPU Allocation Strategy

| GPU | Models | Cost/hr (approx) | Use Case |
|-----|--------|-------------------|----------|
| A100 (80GB) | HunyuanVideo-Avatar, SkyReels-V3, CogVideoX | $3.40 | Heavy video generation |
| A10G (24GB) | GPT-SoVITS, FLUX.1, MusicGen, XTTS-v2, MuseTalk | $1.10 | Medium inference |
| T4 (16GB) | Real-ESRGAN, Whisper, MediaPipe, NLLB-200, Demucs | $0.59 | Light inference |
| CPU | Gemini API calls, Supabase updates, Cloudinary uploads, FFmpeg | $0.07 | Non-GPU tasks |

---

## 5. Complete Connection Architecture

### Request Flow: Generation

```
1. User clicks "Generate" on frontend
2. Frontend POST → /api/generate/[module] (Next.js API route)
3. API route:
   a. getUser() — verify authentication
   b. Zod validate input
   c. checkRateLimit() — Upstash Redis
   d. INSERT into content_jobs (status: "queued")
   e. POST to Modal /generate/[module] with auth headers
   f. Return { accepted: true, jobId }
4. Modal receives request:
   a. verify_request() — check token + timestamp
   b. Run pipeline steps, update_job_status() at each step
   c. Upload output to Cloudinary
   d. update_job_status("complete", output_url)
   e. Return success
5. Frontend polls /api/status/[jobId] every 3 seconds
6. /api/status reads from Supabase content_jobs table
7. When status = "complete", frontend shows result
```

### Request Flow: Edge Workers

```
1. Cloudflare cron trigger fires (every 3-6 hours)
2. Worker fetches data (YouTube API, RSS, Instaloader, etc.)
3. Worker processes/filters results
4. Worker upserts to Supabase via REST API (service role key)
5. If alert condition met → insert notification row
6. Frontend reads notifications via Supabase realtime subscription
```

### Data Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────>│   Vercel     │────>│   Modal.com  │
│   (React)    │<────│  (Next.js)   │<────│   (Python)   │
└──────────────┘     └──────┬───────┘     └──────┬───────┘
                            │                     │
                     ┌──────▼───────┐      ┌──────▼───────┐
                     │   Supabase   │      │  Cloudinary  │
                     │ (PostgreSQL) │      │  (Storage)   │
                     └──────┬───────┘      └──────────────┘
                            │
                     ┌──────▼───────┐
                     │  Cloudflare  │
                     │  (Workers)   │
                     └──────────────┘
```

---

## 6. Security Layers (All 6)

### Layer 1 — HTTPS (Transport)
- Automatic via Vercel, Modal.com, Cloudflare
- All endpoints are HTTPS-only
- No configuration needed

### Layer 2 — API Authentication (Modal)
- Every Modal web endpoint checks `API_SECRET_TOKEN`
- Requests include timestamp; rejected if >5 minutes old (replay attack prevention)
- Implementation: `security.py::verify_request()`

```python
def verify_request(data: dict) -> bool:
    token = data.get("api_token")
    timestamp = data.get("timestamp", 0)
    if token != os.environ["API_SECRET_TOKEN"]:
        return False
    if abs(time.time() - timestamp) > 300:  # 5 minutes
        return False
    return True
```

### Layer 3 — Supabase RLS (Data Isolation)
- Row Level Security enabled on every table
- Users can only read/write their own data
- Exception: `viral_content` table allows SELECT for all authenticated users
- Workers use service role key (bypasses RLS — by design)

```sql
-- Standard policy pattern
CREATE POLICY "users_own_data" ON table_name
  FOR ALL USING (auth.uid() = user_id);
```

### Layer 4 — Zod Validation (Input)
- Every API route validates input with Zod schemas
- Shared schemas in `packages/validators/schemas.ts`
- Invalid input returns 400 with safe error message

### Layer 5 — Rate Limiting (Abuse Prevention)
- Upstash Redis sliding window counters
- Generation: 10 requests per hour per user
- API: 60 requests per minute per user
- Auth: 5 attempts per 15 minutes per IP

### Layer 6 — Secret Management
- All secrets in environment variables only
- Never in source code, never in NEXT_PUBLIC_ prefixed vars
- Separate secret groups per deployment target
- `.env` files in `.gitignore`

### Security Headers (next.config.ts)
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 7. Database Schema Overview

### Table Dependency Order (migrations run 001 → 006)

```
001_core_schema.sql
├── schema_migrations     — Version tracking
├── user_profile          — Auto-created on signup (trigger)
├── content_jobs          — All generation jobs (all 16 modules)
├── content_library       — Completed content items
├── workflows             — M08 workflow definitions
└── content_presets        — Saved generation settings

002_avatar_schema.sql
├── avatar_profiles       — Face + voice model per user
└── voice_samples         — Reference audio uploads

003_clipper_schema.sql
└── content_clips         — Individual clip records with viral scores

004_rival_schema.sql
├── rival_profiles        — Tracked competitor accounts
├── rival_posts           — Individual posts from rivals
└── content_remixes       — Remix analysis results

005_viral_db_schema.sql
└── viral_content         — Shared library (all users can read)

006_notifications_schema.sql
└── notifications         — Alerts: rival viral, job complete, trends
```

### Key Relationships

```
auth.users (Supabase built-in)
    │
    ├──> user_profile (1:1, auto-created via trigger)
    ├──> content_jobs (1:many)
    ├──> content_library (1:many)
    ├──> avatar_profiles (1:many)
    ├──> content_clips (1:many)
    ├──> rival_profiles (1:many)
    ├──> content_remixes (1:many)
    ├──> workflows (1:many)
    ├──> content_presets (1:many)
    └──> notifications (1:many)

content_jobs ──> content_library (on completion)
rival_profiles ──> rival_posts (1:many)
content_jobs ──> content_clips (source_job_id)
```

---

## 8. Deployment Architecture

### One Repo, Four Platforms

```
GitHub Repository (Turborepo)
    │
    ├── apps/web/         → Vercel
    │   Auto-deploy on push to main
    │   Build: next build
    │   Runtime: Node.js 20 serverless
    │
    ├── apps/backend/     → Modal.com
    │   Manual deploy: modal deploy main.py
    │   Runtime: Python 3.11 + GPU containers
    │   Volumes: persistent model weight storage
    │
    ├── apps/workers/     → Cloudflare Workers
    │   Auto-deploy via GitHub Actions
    │   Runtime: V8 isolates at edge
    │   Cron triggers for background jobs
    │
    └── supabase/         → Supabase
        Manual: paste SQL in dashboard
        Runtime: PostgreSQL 15
        Edge Functions: Deno runtime
```

### Deployment Commands

```bash
# Frontend (automatic via Vercel GitHub integration)
git push origin main

# Backend (manual from laptop)
cd apps/backend
modal deploy main.py

# Workers (automatic via GitHub Actions on push to main)
# Or manual:
cd apps/workers/viral-hunter
npx wrangler deploy

# Database (manual in Supabase dashboard)
# Paste each migration SQL file in order
```

---

## 9. Environment Variables Map

### Vercel (apps/web)

| Variable | Purpose | Public? |
|----------|---------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | Yes |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key | Yes |
| SUPABASE_SERVICE_ROLE_KEY | Supabase admin access | No |
| MODAL_BASE_URL | Modal deployment URL | No |
| MODAL_API_SECRET_TOKEN | Auth token for Modal | No |
| NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME | Cloudinary cloud name | Yes |
| CLOUDINARY_API_KEY | Cloudinary API key | No |
| CLOUDINARY_API_SECRET | Cloudinary API secret | No |
| UPSTASH_REDIS_REST_URL | Upstash Redis URL | No |
| UPSTASH_REDIS_REST_TOKEN | Upstash Redis token | No |
| DEPLOYMENT_MODE | "production" or "development" | No |
| FEATURE_AVATAR | Enable M01 (default: true) | No |
| FEATURE_MOVIE | Enable M02 | No |
| FEATURE_DOCUMENTARY | Enable M03 | No |
| FEATURE_EDITOR | Enable M04 | No |
| FEATURE_REMIX | Enable M05 | No |
| FEATURE_RIVALS | Enable M06 | No |
| FEATURE_NEWS | Enable M07 | No |
| FEATURE_WORKFLOW | Enable M08 | No |
| FEATURE_AUDIO | Enable M09 | No |
| FEATURE_THUMBNAILS | Enable M10 | No |
| FEATURE_CLIPPER | Enable M11 | No |
| FEATURE_REMIXER | Enable M12 | No |
| FEATURE_VIRAL_DB | Enable M13 | No |
| FEATURE_SPY | Enable M14 | No |
| FEATURE_DUBBING | Enable M15 | No |
| FEATURE_HUMAN_FEEL | Enable M16 | No |

### Modal (apps/backend)

| Variable | Purpose |
|----------|---------|
| SUPABASE_URL | Supabase project URL |
| SUPABASE_SERVICE_ROLE_KEY | Admin access for job updates |
| CLOUDINARY_CLOUD_NAME | Upload destination |
| CLOUDINARY_API_KEY | Cloudinary auth |
| CLOUDINARY_API_SECRET | Cloudinary auth |
| HUGGINGFACE_TOKEN | Model weight downloads |
| GEMINI_API_KEY | Gemini API for intelligence |
| API_SECRET_TOKEN | Verify requests from frontend |
| FIRECRAWL_API_KEY | Web scraping API |
| OPENROUTER_API_KEY | Fallback LLM routing |
| SERPER_API_KEY | Google Search API |

### Cloudflare Workers

| Variable | Purpose |
|----------|---------|
| SUPABASE_URL | Data storage |
| SUPABASE_SERVICE_ROLE_KEY | Admin access |
| SERPER_API_KEY | Google trends |
| NEWS_API_KEY | News aggregation |
| YOUTUBE_API_KEY | YouTube trending |

---

## 10. Module Build Sequence

### Phase 1: Foundation (Weekend 1)
**Goal:** Working infrastructure, zero modules

| Step | Task | Files |
|------|------|-------|
| 1.1 | Root monorepo config | package.json, turbo.json, .gitignore |
| 1.2 | Shared packages | packages/config/*, packages/types/*, packages/validators/* |
| 1.3 | Database migrations | supabase/migrations/001-006 |
| 1.4 | Backend skeleton | apps/backend/main.py, security.py, db.py, storage.py |
| 1.5 | Frontend shell | apps/web/* (all pages as ComingSoon except avatar) |
| 1.6 | CI/CD | .github/workflows/* |

**Deliverable:** Login works, sidebar shows all modules, backend health check passes.

### Phase 2: M01 Avatar Studio (Weekend 2)
**Goal:** First working end-to-end module

- Backend: avatar_pipeline.py, hunyuan_avatar.py, sovits.py, musetalk.py, esrgan.py
- Frontend: avatar/page.tsx (full UI), generate/avatar/route.ts
- Test: Upload face, clone voice, generate video, download

### Phase 3: M11 Clipper (Weekend 3)
**Goal:** Highest-demand feature

- Backend: clipper_pipeline.py, viral_scorer.py, mediapipe_tracker.py, whisper_model.py
- Frontend: clipper/page.tsx, generate/clip/route.ts
- Remotion: All 4 caption styles

### Phase 4: M12 Remixer + M13 Viral DB (Weekend 4)
**Goal:** Content intelligence tools

- Backend: content_remixer.py, remix_pipeline.py
- Workers: viral-hunter/index.js
- Frontend: remixer/page.tsx, viral-db/page.tsx

### Phase 5: M14 Spy + M06 Rivals (Weekend 5)
**Goal:** Competitive advantage

- Backend: competitor_spy.py
- Workers: rival-watcher/index.js
- Frontend: spy/page.tsx, rivals/page.tsx

### Phase 6: M02 Movie Generator (Weekend 6)
**Goal:** Flagship feature

- Backend: movie_pipeline.py, skyreels.py, filmaster.py, flux.py, musicgen.py
- Frontend: movie/page.tsx

### Phase 7: M15 Voice Dubbing (Weekend 7)
**Goal:** African language support

- Backend: dubbing_pipeline.py (Whisper + NLLB-200 + XTTS + MuseTalk)
- Frontend: dubbing/page.tsx

### Phase 8: M09 Audio + M16 Human Feel (Weekend 8)
**Goal:** Polish and quality

- Backend: audio_pipeline.py, human_feel.py (full implementation)
- Frontend: audio/page.tsx

### Phase 9: M03 Documentary + M05 Content Remix (Weekend 9)
**Goal:** Content repurposing

- Backend: documentary_pipeline.py, remix_pipeline.py
- Frontend: documentary/page.tsx, remix/page.tsx

### Phase 10: M04 Editor + M10 Thumbnails (Weekend 10)
**Goal:** Professional tools

- Backend: edit_interpreter.py, thumbnail_pipeline.py
- Frontend: editor/page.tsx, thumbnails/page.tsx

### Phase 11: M07 News + M08 Workflow (Weekend 11)
**Goal:** Automation

- Workers: news-monitor/index.js, trend-detector/index.js
- Frontend: news/page.tsx, workflow/page.tsx (React Flow)

---

## 11. Feature Flag Strategy

All 16 modules are gated by feature flags. Flags are read from environment variables at runtime.

```typescript
// packages/config/feature-flags.ts
export const FEATURES = {
  AVATAR: process.env.FEATURE_AVATAR !== 'false',     // true by default
  MOVIE: process.env.FEATURE_MOVIE === 'true',        // false by default
  DOCUMENTARY: process.env.FEATURE_DOCUMENTARY === 'true',
  EDITOR: process.env.FEATURE_EDITOR === 'true',
  REMIX: process.env.FEATURE_REMIX === 'true',
  RIVALS: process.env.FEATURE_RIVALS === 'true',
  NEWS: process.env.FEATURE_NEWS === 'true',
  WORKFLOW: process.env.FEATURE_WORKFLOW === 'true',
  AUDIO: process.env.FEATURE_AUDIO === 'true',
  THUMBNAILS: process.env.FEATURE_THUMBNAILS === 'true',
  CLIPPER: process.env.FEATURE_CLIPPER === 'true',
  REMIXER: process.env.FEATURE_REMIXER === 'true',
  VIRAL_DB: process.env.FEATURE_VIRAL_DB === 'true',
  SPY: process.env.FEATURE_SPY === 'true',
  DUBBING: process.env.FEATURE_DUBBING === 'true',
  HUMAN_FEEL: process.env.FEATURE_HUMAN_FEEL === 'true',
} as const;
```

**How flags are used:**
1. **Sidebar:** Disabled modules show "Coming Soon" badge, link is not clickable
2. **Pages:** Disabled modules render `<ComingSoon>` component
3. **API routes:** Disabled modules return 403 "Module not enabled"
4. **Backend:** Not affected — endpoints exist but won't be called

**Enabling a module:**
1. Set `FEATURE_[NAME]=true` in Vercel environment variables
2. Redeploy (automatic on next push, or manual redeploy)

---

## 12. File-by-File Task List

### Root Files

| File | Description | Priority |
|------|-------------|----------|
| CONTEXT.md | Single source of truth — complete project spec | Done |
| PLAN.md | This file — architectural blueprint | Done |
| CLAUDE.md | AI agent coding rules and conventions | Phase 1 |
| AGENTS.md | AI agent behavioral guide | Phase 1 |
| README.md | Public-facing project documentation | Phase 1 |
| package.json | Turborepo workspace: workspaces, scripts | Phase 1 |
| turbo.json | Pipeline: build, dev, lint, type-check | Phase 1 |
| .gitignore | node_modules, .env, .next, __pycache__, dist | Phase 1 |

### packages/config/

| File | Description | Priority |
|------|-------------|----------|
| package.json | @my-studio/config deps (no external deps needed) | Phase 1 |
| index.ts | Config object from env vars: deployment, storage, security, brand | Phase 1 |
| feature-flags.ts | 16 feature flags, isEnabled() function | Phase 1 |
| environments/personal.env.example | All env vars with explanatory comments | Phase 1 |
| environments/selfhost.env.example | Self-host specific env vars | Phase 1 |

### packages/types/

| File | Description | Priority |
|------|-------------|----------|
| package.json | @my-studio/types (no deps) | Phase 1 |
| index.ts | All TypeScript types: jobs, modules, profiles, requests, responses | Phase 1 |

### packages/validators/

| File | Description | Priority |
|------|-------------|----------|
| package.json | @my-studio/validators (dep: zod) | Phase 1 |
| schemas.ts | All Zod schemas for API input validation | Phase 1 |

### supabase/migrations/

| File | Description | Priority |
|------|-------------|----------|
| 001_core_schema.sql | content_jobs, content_library, user_profile, workflows, presets | Phase 1 |
| 002_avatar_schema.sql | avatar_profiles, voice_samples | Phase 1 |
| 003_clipper_schema.sql | content_clips | Phase 1 |
| 004_rival_schema.sql | rival_profiles, rival_posts, content_remixes | Phase 1 |
| 005_viral_db_schema.sql | viral_content (shared) | Phase 1 |
| 006_notifications_schema.sql | notifications + job complete trigger | Phase 1 |

### supabase/functions/

| File | Description | Priority |
|------|-------------|----------|
| on-job-complete/index.ts | Edge function: insert notification when job completes | Phase 1 |

### apps/backend/

| File | Description | Priority |
|------|-------------|----------|
| main.py | Modal app definition, all endpoints, image, volumes | Phase 1 |
| security.py | verify_request(), get_cors_headers(), require_auth | Phase 1 |
| db.py | get_supabase(), update_job_status(), get_job(), save_to_library() | Phase 1 |
| storage.py | configure_cloudinary(), upload_video/image/audio(), delete_file() | Phase 1 |
| requirements.txt | All Python deps with pinned versions | Phase 1 |

### apps/backend/pipelines/

| File | Description | Priority |
|------|-------------|----------|
| __init__.py | Package init | Phase 1 |
| avatar_pipeline.py | M01: face + voice + animate + enhance + upload | Phase 2 |
| movie_pipeline.py | M02: script + storyboard + scenes + score + assemble | Phase 6 |
| documentary_pipeline.py | M03: sources + transcribe + narrate + assemble | Phase 9 |
| clipper_pipeline.py | M11: ingest + transcribe + score + clip + export | Phase 3 |
| dubbing_pipeline.py | M15: transcribe + translate + clone + sync + mix | Phase 7 |
| remix_pipeline.py | M05/M12: analyze + generate remix scripts | Phase 4 |
| thumbnail_pipeline.py | M10: generate thumbnails + A/B variants | Phase 10 |
| audio_pipeline.py | M09: music + SFX + voice production | Phase 8 |

### apps/backend/models/

| File | Description | Priority |
|------|-------------|----------|
| __init__.py | Package init | Phase 1 |
| hunyuan_avatar.py | HunyuanVideo-Avatar load + generate | Phase 2 |
| hunyuan_video.py | HunyuanVideo 1.5 load + generate | Phase 6 |
| skyreels.py | SkyReels-V3 load + generate | Phase 6 |
| cogvideo.py | CogVideoX 1.5 load + generate | Phase 6 |
| flux.py | FLUX.1-schnell/dev load + generate | Phase 6 |
| sovits.py | GPT-SoVITS clone_voice + generate_speech | Phase 2 |
| musetalk.py | MuseTalk fast lip sync | Phase 2 |
| esrgan.py | Real-ESRGAN video enhancement | Phase 2 |
| musicgen.py | MusicGen music generation | Phase 6 |
| demucs.py | Demucs audio separation | Phase 7 |
| whisper_model.py | WhisperX word-level transcription | Phase 3 |
| filmaster.py | FilMaster cinematic intelligence | Phase 6 |
| mediapipe_tracker.py | MediaPipe face tracking + smart crop | Phase 3 |

### apps/backend/intelligence/

| File | Description | Priority |
|------|-------------|----------|
| __init__.py | Package init | Phase 1 |
| viral_scorer.py | 12-signal viral moment scoring via Gemini | Phase 3 |
| content_remixer.py | Analyze viral content + generate remix scripts | Phase 4 |
| competitor_spy.py | Multi-platform competitor analysis | Phase 5 |
| script_writer.py | Gemini screenplay/script generation | Phase 6 |
| edit_interpreter.py | Natural language to FFmpeg commands | Phase 10 |
| trend_detector.py | Trending topic detection and scoring | Phase 4 |

### apps/backend/postproduction/

| File | Description | Priority |
|------|-------------|----------|
| __init__.py | Package init | Phase 1 |
| human_feel.py | 12 rules to make AI content feel human | Phase 2 (stub), Phase 8 (full) |
| ffmpeg_utils.py | All FFmpeg utility functions (full implementation) | Phase 1 |
| color_grading.py | LUT application + color correction | Phase 8 |
| audio_mixing.py | Multi-track audio mixing with FFmpeg | Phase 8 |
| caption_engine.py | Remotion caption rendering integration | Phase 3 |

### apps/web/ (key files)

| File | Description | Priority |
|------|-------------|----------|
| package.json | All frontend deps | Phase 1 |
| tsconfig.json | Strict TS + path aliases | Phase 1 |
| next.config.ts | Security headers + image domains | Phase 1 |
| tailwind.config.ts | Design system tokens | Phase 1 |
| middleware.ts | Supabase SSR auth redirect | Phase 1 |
| app/globals.css | Tailwind directives + custom styles | Phase 1 |
| app/layout.tsx | Root layout: font, bg, providers | Phase 1 |
| app/(auth)/login/page.tsx | Login UI | Phase 1 |
| app/(studio)/layout.tsx | Sidebar + mobile tabs | Phase 1 |
| All 16 module pages | ComingSoon or full UI | Phase 1-11 |
| All API routes | Auth + validation + Modal trigger | Phase 1-11 |
| All UI components | Button, Card, etc. | Phase 1 |
| lib/supabase.ts | Browser + server clients | Phase 1 |
| lib/modal.ts | triggerGeneration + getJobStatus | Phase 1 |
| lib/cloudinary.ts | Upload + delete | Phase 1 |
| lib/rate-limit.ts | Upstash rate limiters | Phase 1 |
| lib/cn.ts | Tailwind class merge | Phase 1 |

### apps/workers/

| File | Description | Priority |
|------|-------------|----------|
| news-monitor/index.js | RSS + Firecrawl news ingestion | Phase 11 |
| news-monitor/wrangler.toml | Cloudflare config | Phase 11 |
| trend-detector/index.js | Serper API trending topics | Phase 4 |
| trend-detector/wrangler.toml | Cloudflare config | Phase 4 |
| viral-hunter/index.js | YouTube API + analysis | Phase 4 |
| viral-hunter/wrangler.toml | Cloudflare config | Phase 4 |
| rival-watcher/index.js | Monitor competitor accounts | Phase 5 |
| rival-watcher/wrangler.toml | Cloudflare config | Phase 5 |

### remotion/

| File | Description | Priority |
|------|-------------|----------|
| captions/HormoziStyle.tsx | Bold white, word highlight yellow | Phase 3 |
| captions/NetflixStyle.tsx | Clean serif, bottom position | Phase 3 |
| captions/TikTokPop.tsx | Pop-in animation per word | Phase 3 |
| captions/BreakingNews.tsx | Lower third with red bar | Phase 3 |
| graphics/LowerThird.tsx | Name/title overlay | Phase 6 |
| graphics/NewsChyron.tsx | News ticker bar | Phase 11 |
| graphics/IntroOutro.tsx | Intro/outro sequences | Phase 6 |
| thumbnails/FaceHook.tsx | Face-focused thumbnail | Phase 10 |
| thumbnails/CinematicScene.tsx | Cinematic scene thumbnail | Phase 10 |

### CI/CD

| File | Description | Priority |
|------|-------------|----------|
| .github/workflows/validate.yml | Type-check + lint + py_compile on push | Phase 1 |
| .github/workflows/deploy.yml | Deploy workers on push to main | Phase 1 |

### Scripts

| File | Description | Priority |
|------|-------------|----------|
| scripts/setup.sh | Initial project setup | Phase 1 |
| scripts/validate-env.ts | Validate all env vars present | Phase 1 |
| scripts/download-models.py | Download all model weights to Modal volumes | Phase 2 |

### Docs

| File | Description | Priority |
|------|-------------|----------|
| docs/ARCHITECTURE.md | Technical architecture deep dive | Phase 1 |
| docs/MODULES.md | Module-by-module documentation | Phase 2+ |
| docs/SELF_HOSTING.md | Self-hosting guide | Phase 11 |
| docs/API.md | API endpoint documentation | Phase 2+ |

---

## 13. Agent Skills Activation Map

### Per-Phase Skill Usage

| Phase | Primary Skills | Purpose |
|-------|---------------|---------|
| Phase 1 (Foundation) | Architecture planning, TypeScript strict | Set up all infrastructure correctly |
| Phase 2 (Avatar) | GPU function patterns, UI components, Modal deployment | First working module |
| Phase 3 (Clipper) | GPU functions, FFmpeg, Remotion, UI components | Video processing pipeline |
| Phase 4 (Remixer/Viral) | Gemini API, Cloudflare Workers, data dashboards | Intelligence tools |
| Phase 5 (Spy/Rivals) | Web scraping, Cloudflare Workers, data viz | Competitor analysis |
| Phase 6 (Movie) | Heavy GPU, multi-model orchestration, UI | Complex pipeline |
| Phase 7 (Dubbing) | Multi-language, audio processing, lip sync | Translation pipeline |
| Phase 8 (Audio/HumanFeel) | Audio engineering, FFmpeg advanced, color science | Polish |
| Phase 9 (Doc/Remix) | Content analysis, multi-source, assembly | Content repurposing |
| Phase 10 (Editor/Thumb) | NL processing, image generation, React Flow | Professional tools |
| Phase 11 (News/Workflow) | RSS, automation, visual programming | Automation |

### Custom Skills (to create in .claude/skills/my-studio/)

| Skill File | Triggers | Purpose |
|------------|----------|---------|
| my-studio-architecture.md | "add module", "new feature", "architecture" | Enforce architecture patterns |
| my-studio-modal-gpu.md | "GPU function", "pipeline", "inference" | Modal GPU function patterns |
| my-studio-supabase-rls.md | "database", "table", "migration", "RLS" | Database security patterns |
| my-studio-security.md | "API route", "endpoint", "auth" | 6-layer security enforcement |
| my-studio-ui-components.md | "component", "UI", "page", "design" | Design system compliance |
| my-studio-open-source-models.md | Model names, "integrate", "AI model" | Model reference guide |

---

## 14. Risk Register & Mitigation

### High Risk

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Modal free tier exhausted | Backend stops working | High | Monitor usage, optimize cold starts, use keep_warm=1 only on critical endpoints |
| GPU model too large for Modal | Can't run inference | Medium | Use quantized models (4-bit), split across volumes, use fallback models |
| Cloudinary 10GB limit hit | No more uploads | High | Implement cleanup of old content, compress outputs, warn at 8GB |
| Supabase free tier limits | Auth/DB stops | Medium | 500MB DB limit — monitor, archive old jobs, use JSONB efficiently |
| HuggingFace rate limits | Can't download models | Low | Download once to Modal volumes, cache aggressively |

### Medium Risk

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Open source model breaks/updates | Pipeline fails | Medium | Pin specific commits/versions, test before upgrading |
| Gemini API changes | Intelligence features break | Medium | Abstract behind interface, support OpenRouter fallback |
| Instagram/TikTok blocks scraping | Spy module fails | High | Playwright fallback, respect rate limits, rotate user agents |
| Vercel cold starts slow | Poor UX on first load | Low | Minimize bundle size, use edge runtime where possible |
| WhisperX accuracy issues | Bad transcriptions | Low | Offer manual correction UI, use Whisper Large v3 as fallback |

### Low Risk

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Turborepo config issues | Build problems | Low | Keep config simple, test locally before push |
| CORS issues between services | API calls fail | Low | Standardize CORS headers in security.py |
| TypeScript strict catches real bugs | Slower development | Low | This is actually a benefit — fix types, don't bypass |
| Weekend-only development | Slow progress | High | Clear module-per-weekend plan, CONTEXT.md ensures continuity |

### Cost Monitoring

| Service | Free Tier | Alert At | Action |
|---------|-----------|----------|--------|
| Modal | $30/month | $25 | Reduce keep_warm, batch requests |
| Supabase | 500MB DB, 1GB storage | 400MB | Archive old jobs, compress JSONB |
| Cloudinary | 10GB | 8GB | Clean old outputs, compress |
| Vercel | 100GB bandwidth | 80GB | Optimize assets, use CDN |
| Upstash | 10K commands/day | 8K | Optimize rate limit checks |
| Cloudflare | 100K requests/day | 80K | Reduce cron frequency if needed |

---

*PLAN.md is the architectural blueprint. CONTEXT.md is the source of truth. Together they define every aspect of MY STUDIO.*
