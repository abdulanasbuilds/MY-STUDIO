# Skill: my-studio-architecture

## Triggers
- "add module", "new feature", "integrate model", "connect to", "architecture decision"

## Purpose
Enforces MY STUDIO architectural patterns when making structural decisions.

---

## Rules

### Before Building Any Feature
1. Add feature flag in `packages/config/feature-flags.ts` (default: `false`)
2. Create database migration file if tables are needed (next number in sequence)
3. Create feature branch: `git checkout -b feature/[name]`
4. Build on branch, merge when complete
5. Enable flag in Vercel env vars when production-ready

### Named Exports Only
```typescript
// CORRECT
export function AvatarPage() { ... }
export const config = { ... };

// WRONG — never do this
export default function AvatarPage() { ... }
```

### No Direct Modal Calls From Frontend
```
CORRECT: Browser → /api/generate/avatar → Modal
WRONG:   Browser → Modal directly
```

### Polling Pattern for Long-Running Jobs
```
1. Frontend POST to /api/generate/[module]
2. API route creates job in Supabase (status: "queued")
3. API route forwards to Modal with job_id
4. API route returns { jobId } immediately
5. Frontend polls /api/status/[jobId] every 3 seconds
6. Modal updates Supabase at each pipeline step
7. Frontend shows progress from Supabase data
8. When status = "complete" → show result
```

---

## Decision Tree: Where Does This Run?

```
Is it GPU compute (AI model inference)?
  YES → Modal.com
  NO ↓

Is it a scheduled background task?
  YES → Cloudflare Workers (cron)
  NO ↓

Is it triggered by a database change?
  YES → Supabase Edge Function
  NO ↓

Is it an API endpoint called by the frontend?
  YES → Next.js API Route (apps/web/app/api/)
  NO ↓

Is it a user-facing page?
  YES → Next.js Page (apps/web/app/(studio)/)
  NO → Probably doesn't belong in the project
```

---

## Module Addition Checklist

When adding a new module:

1. [ ] Feature flag added in `packages/config/feature-flags.ts`
2. [ ] Types added in `packages/types/index.ts`
3. [ ] Zod schema added in `packages/validators/schemas.ts`
4. [ ] Database migration created (if needed)
5. [ ] Pipeline file created in `apps/backend/pipelines/`
6. [ ] Model file(s) created in `apps/backend/models/`
7. [ ] API route created in `apps/web/app/api/generate/[module]/`
8. [ ] Page created in `apps/web/app/(studio)/[module]/`
9. [ ] Sidebar link added in `apps/web/app/(studio)/layout.tsx`
10. [ ] Feature flag check in both page and API route

---

## Connection Patterns

### Frontend → API → Modal → Supabase → Frontend

```
User action → fetch('/api/generate/avatar') → POST Modal /generate/avatar
                                                    ↓
                                              update_job_status()
                                                    ↓
                                              upload to Cloudinary
                                                    ↓
                                              update_job_status("complete")
                                                    ↓
Frontend polls /api/status/[jobId] ← reads Supabase content_jobs table
```

### Cloudflare Worker → Supabase

```
Cron trigger → fetch external API → process data → upsert Supabase
                                                        ↓
                                                  insert notification (if alert)
                                                        ↓
                                                  Frontend reads via realtime
```
