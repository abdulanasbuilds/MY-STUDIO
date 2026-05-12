# MY STUDIO — AGENT BEHAVIOR GUIDE

> This file defines how AI agents should behave when working on MY STUDIO.
> Read CONTEXT.md and CLAUDE.md before this file.

---

## Before Writing Any Code

1. Read CONTEXT.md completely — understand the full project
2. Read CLAUDE.md — understand the rules and conventions
3. Read PLAN.md — understand the architecture and build sequence
4. Check which files already exist (do not overwrite working code)
5. Read the specific file you are about to modify
6. Understand what connects to that file (imports, exports, data flow)
7. Check the current build phase — do not build modules out of sequence

---

## Core Principles

### 1. Name Is MY STUDIO
- The project is called **MY STUDIO** — never "Nexus Studio"
- Workspace packages use `@my-studio/*` prefix
- Brand references use "MY STUDIO" or "@abdulanasbuilds Studio"

### 2. One Task at a Time
- Never modify more than 3 files in one response
- Always verify each file compiles before moving on
- After every major change: run `npm run type-check`
- Complete current task fully before starting next task

### 3. Follow the Build Sequence
- Phase 1 (Foundation) must be complete before Phase 2
- Each module builds on shared packages created in Phase 1
- Feature flags gate module availability — respect them
- Do not implement a module that depends on unbuilt modules

### 4. Test Before Moving On
- After creating a file: verify it has no syntax errors
- After creating an API route: verify auth + validation are present
- After creating a pipeline: verify try/except/finally pattern
- After creating a component: verify named export, no `any` types

---

## How to Handle Each File Type

### TypeScript Files (apps/web/)
```
1. Check CLAUDE.md import order rules
2. Named exports only — never export default
3. Strict types — no 'any', no 'as any', no @ts-ignore
4. Functional components only — no class components
5. Use Framer Motion for animations
6. Use Lucide React for icons (never emoji as icons)
7. Mobile-first design — 375px minimum
8. Use design system colors from CLAUDE.md
```

### Python Files (apps/backend/)
```
1. Type hints on ALL parameters and return types
2. Docstrings on all public functions
3. os.environ["KEY"] for secrets — never hardcode
4. try/except/finally on all pipelines
5. update_job_status() at every step
6. Temp file cleanup in finally block
7. Explicit timeout on Modal GPU functions
```

### SQL Files (supabase/migrations/)
```
1. Numbered prefix: 001, 002, 003...
2. NEVER skip a number
3. RLS enabled on EVERY table
4. Policies scoped to auth.uid() = user_id
5. Indexes on user_id, created_at, status
6. Foreign keys where tables relate
7. INSERT INTO schema_migrations at end of each file
```

### API Route Files (apps/web/app/api/)
```
1. getUser() first — return 401 if no user
2. Zod safeParse() — return 400 if invalid
3. checkRateLimit() — return 429 if exceeded
4. Feature flag check — return 403 if disabled
5. Process request — call Modal or Supabase
6. Return safe error messages — no internals
```

---

## Error Handling Protocol

1. Read the full error message — do not guess
2. Check the file that caused the error
3. Check what that file imports from — follow the chain
4. Fix the root cause, not symptoms
5. Verify the fix does not break other files
6. If unsure, check CONTEXT.md for the intended behavior

### Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `export default` detected | Wrong export style | Change to named export |
| `any` type used | Missing type definition | Add proper type from @my-studio/types |
| `getSession()` used | Wrong auth method | Change to `getUser()` |
| Missing RLS policy | Table created without policy | Add policy before merge |
| Direct Modal call from client | Architecture violation | Route through /api route |
| Hardcoded secret | Security violation | Move to env var |
| No rate limit check | Security violation | Add checkRateLimit() |
| No Zod validation | Security violation | Add schema.safeParse() |

---

## Commit Format

```
feat: [module] [what was built]
fix: [module] [what was fixed]
chore: [what maintenance was done]
docs: [what was documented]
```

### Examples
```
feat: avatar studio voice cloning endpoint
feat: clipper viral scoring with 12 signals
fix: avatar pipeline temp file cleanup
chore: update dependencies
docs: add self-hosting guide
```

---

## Module Implementation Checklist

When implementing any module, complete ALL items:

### Backend
- [ ] Pipeline file with full try/except/finally pattern
- [ ] Model files with load + run functions
- [ ] update_job_status() at every major step
- [ ] Temp file cleanup in finally block
- [ ] Type hints on all functions
- [ ] Docstrings on public functions

### Frontend
- [ ] Page component with named export
- [ ] Feature flag check (show ComingSoon if disabled)
- [ ] API route with auth + validation + rate limit
- [ ] Loading states on all async actions
- [ ] Error states with user-friendly messages
- [ ] Mobile-responsive layout (375px minimum)
- [ ] Design system colors applied

### Database
- [ ] Migration file with next number in sequence
- [ ] RLS enabled on all new tables
- [ ] Policies scoped to user_id
- [ ] Indexes on frequently queried columns
- [ ] Foreign keys where appropriate

### Testing
- [ ] API route returns 401 without auth
- [ ] API route returns 400 with invalid input
- [ ] API route returns 429 when rate limited
- [ ] Pipeline handles errors gracefully
- [ ] Frontend shows progress during generation
- [ ] Frontend handles completion correctly
- [ ] Frontend handles errors with toast

---

## Connection Patterns

### Frontend → API Route → Modal (Generation)

```typescript
// Frontend: trigger generation
const response = await fetch('/api/generate/avatar', {
  method: 'POST',
  body: JSON.stringify({ script, avatarId, qualityMode }),
});
const { jobId } = await response.json();

// Frontend: poll status
const poll = setInterval(async () => {
  const res = await fetch(`/api/status/${jobId}`);
  const job = await res.json();
  setProgress(job);
  if (job.status === 'complete' || job.status === 'failed') {
    clearInterval(poll);
  }
}, 3000);
```

### API Route → Modal

```typescript
// API route: forward to Modal
const modalResponse = await fetch(`${process.env.MODAL_BASE_URL}/generate/avatar`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...parsed.data,
    job_id: jobId,
    api_token: process.env.MODAL_API_SECRET_TOKEN,
    timestamp: Math.floor(Date.now() / 1000),
  }),
});
```

### Modal → Supabase (Status Updates)

```python
# Pipeline: update status at each step
update_job_status(job_id, "processing", "voice_generation", 15)
# ... do voice generation ...
update_job_status(job_id, "processing", "avatar_animation", 30)
# ... do animation ...
update_job_status(job_id, "complete", "done", 100, output_url=url)
```

---

## GPU Allocation Reference

| GPU | Use For | Cost |
|-----|---------|------|
| A100 (80GB) | HunyuanVideo-Avatar, SkyReels-V3, CogVideoX | Heavy video gen |
| A10G (24GB) | GPT-SoVITS, FLUX.1, MusicGen, XTTS-v2, MuseTalk | Medium inference |
| T4 (16GB) | Real-ESRGAN, Whisper, MediaPipe, NLLB-200, Demucs | Light inference |
| CPU | Gemini API, Supabase updates, Cloudinary uploads, FFmpeg | Non-GPU tasks |

---

## What NOT to Do

1. **Do NOT** use `export default` anywhere
2. **Do NOT** use the `any` type
3. **Do NOT** call Modal directly from the browser
4. **Do NOT** use `getSession()` — always `getUser()`
5. **Do NOT** hardcode secrets in source code
6. **Do NOT** create tables without RLS policies
7. **Do NOT** skip feature flag checks
8. **Do NOT** forget rate limiting on API routes
9. **Do NOT** leave temp files uncleaned in pipelines
10. **Do NOT** skip Zod validation on API inputs
11. **Do NOT** use class components
12. **Do NOT** name component files `index.tsx`
13. **Do NOT** build modules out of sequence
14. **Do NOT** use emojis as icons (use Lucide React)
15. **Do NOT** expose error internals to the client

---

*This guide ensures consistent, secure, high-quality code across all AI agents working on MY STUDIO.*
