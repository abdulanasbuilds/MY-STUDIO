# Skill: my-studio-security

## Triggers
- "API route", "endpoint", "auth", "security", "authentication", "authorization", "secrets"

## Purpose
Enforces the 6-layer security architecture on every API route and endpoint.

---

## The 6 Security Layers

### Layer 1: HTTPS (Transport)
- Automatic via Vercel, Modal.com, Cloudflare
- No configuration needed
- All endpoints are HTTPS-only

### Layer 2: API Authentication (Modal)
- Every Modal web endpoint checks `API_SECRET_TOKEN`
- Requests include timestamp; rejected if >5 minutes old
- Prevents replay attacks

```python
def verify_request(data: dict) -> bool:
    """Verify request authenticity and freshness."""
    token = data.get("api_token")
    timestamp = data.get("timestamp", 0)

    if token != os.environ["API_SECRET_TOKEN"]:
        return False

    if abs(time.time() - timestamp) > 300:  # 5 minutes
        return False

    return True
```

### Layer 3: Supabase RLS (Data Isolation)
- Row Level Security enabled on every table
- Users can only read/write their own data
- Workers/backend use service role key (bypasses RLS)

### Layer 4: Zod Validation (Input)
- Every API route validates input with Zod schemas
- Shared schemas in `packages/validators/schemas.ts`
- Invalid input returns 400 with safe error message

```typescript
const parsed = generateAvatarSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
    { status: 400 }
  );
}
```

### Layer 5: Rate Limiting (Abuse Prevention)
- Upstash Redis sliding window counters
- Three tiers:

| Limiter | Limit | Window | Use |
|---------|-------|--------|-----|
| generation | 10 | 1 hour | AI generation endpoints |
| api | 60 | 1 minute | General API calls |
| auth | 5 | 15 minutes | Login/signup attempts |

### Layer 6: Secret Management
- All secrets in environment variables
- Never in source code
- Never in `NEXT_PUBLIC_` prefixed variables (those are exposed to browser)
- Separate secret groups per platform

---

## API Route Checklist

Every API route in `apps/web/app/api/` MUST include ALL of these:

```typescript
export async function POST(request: NextRequest) {
  // 1. AUTHENTICATION — always first
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. INPUT VALIDATION — always second
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // 3. RATE LIMITING — always third
  const limited = await checkRateLimit(user.id, 'generation');
  if (limited) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // 4. FEATURE FLAG — check if module is enabled
  if (!isEnabled('AVATAR')) {
    return NextResponse.json({ error: 'Module not enabled' }, { status: 403 });
  }

  // 5. PROCESS — actual work
  try {
    // ... process request ...
    return NextResponse.json({ success: true, data: result });
  } catch {
    // 6. SAFE ERROR — never expose internals
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
```

---

## Security Headers (next.config.ts)

```typescript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; img-src 'self' res.cloudinary.com; ...",
  },
];
```

---

## What Is Public vs Secret

| Variable | Prefix | Exposed to Browser? |
|----------|--------|-------------------|
| Supabase URL | NEXT_PUBLIC_ | Yes — safe |
| Supabase Anon Key | NEXT_PUBLIC_ | Yes — safe (RLS protects data) |
| Cloudinary Cloud Name | NEXT_PUBLIC_ | Yes — safe (read-only) |
| Supabase Service Role Key | (none) | NO — admin access |
| Modal Base URL | (none) | NO — server-only |
| Modal API Secret Token | (none) | NO — authentication |
| Cloudinary API Key | (none) | NO — write access |
| Cloudinary API Secret | (none) | NO — write access |
| Upstash Redis URL | (none) | NO — rate limit store |
| Feature flags | (none) | NO — server-side check |

---

## Error Message Rules

```typescript
// CORRECT — safe, user-friendly
return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// WRONG — exposes internals
return NextResponse.json({ error: err.message }, { status: 500 });
return NextResponse.json({ error: `DB error: ${err.stack}` }, { status: 500 });
return NextResponse.json({ error: `Modal at ${MODAL_URL} failed` }, { status: 500 });
```

---

## Modal Endpoint Security

```python
# EVERY Modal web endpoint must:
# 1. Call verify_request() first
# 2. Return CORS headers
# 3. Never expose secrets in responses
# 4. Log the job_id for debugging (not the data)

@modal.web_endpoint(method="POST")
def endpoint(data: dict) -> dict:
    if not verify_request(data):
        return JSONResponse(
            content={"error": "Unauthorized"},
            status_code=401,
            headers=get_cors_headers(),
        )
    # ... process ...
```
