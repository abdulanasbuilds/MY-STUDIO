// MY STUDIO — POST /api/rivals/analyze
// PURPOSE: Trigger rival/competitor analysis via Modal
// SECURITY: getUser() -> Zod safeParse() -> checkRateLimit() -> feature flag -> create job -> forward to Modal

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { FEATURES } from '@my-studio/config/feature-flags';
import { getUser, createServerSupabaseClient } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/rate-limit';

const analyzeSchema = z.object({
  channelUrl: z.string().url(),
  platform: z.enum(['youtube', 'tiktok', 'instagram', 'twitter']),
  name: z.string().min(1),
  rivalId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  // 1. Auth check
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 2. Feature flag check
  if (!FEATURES.SPY) {
    return NextResponse.json(
      { message: 'Competitor Spy is not enabled' },
      { status: 403 },
    );
  }

  // 3. Parse and validate input with Zod
  const body: unknown = await request.json();
  const parsed = analyzeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // 4. Rate limit check
  const isLimited = await checkRateLimit(user.id, 'generation');
  if (isLimited) {
    return NextResponse.json(
      { message: 'Rate limit exceeded. Please try again later.' },
      { status: 429 },
    );
  }

  // 5. Create job record in Supabase
  const supabase = await createServerSupabaseClient();
  const jobId = crypto.randomUUID();
  const { error: jobError } = await supabase.from('content_jobs').insert({
    id: jobId,
    user_id: user.id,
    module: 'spy',
    status: 'queued',
    current_step: 'queued',
    progress_percent: 0,
    input_type: 'url',
    input_data: {
      profile_url: parsed.data.channelUrl,
      platform: parsed.data.platform,
      name: parsed.data.name,
      rival_id: parsed.data.rivalId,
    },
    settings: {},
  });

  if (jobError) {
    return NextResponse.json(
      { message: 'Failed to create job' },
      { status: 500 },
    );
  }

  // 6. Forward to Modal backend (fire-and-forget)
  const modalBaseUrl = process.env.MODAL_BASE_URL || "https://abdulanassofficial--my-studio-fastapi-app.modal.run";
  const modalToken = process.env.API_SECRET_TOKEN || process.env.MODAL_API_SECRET_TOKEN;

  if (modalBaseUrl && modalToken) {
    fetch(`${modalBaseUrl}/analyze-rival`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        user_id: user.id,
        profile_url: parsed.data.channelUrl,
        platform: parsed.data.platform,
        name: parsed.data.name,
        rival_id: parsed.data.rivalId,
        api_token: modalToken,
        timestamp: Math.floor(Date.now() / 1000),
      }),
    }).catch(() => {
      // Modal trigger failed
    });
  }

  // 7. Return job ID immediately
  return NextResponse.json({ jobId }, { status: 202 });
}

