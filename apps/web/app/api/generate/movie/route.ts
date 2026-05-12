// MY STUDIO — POST /api/generate/movie
// PURPOSE: Trigger movie generation via Modal
// SECURITY: getUser() -> Zod safeParse() -> checkRateLimit() -> feature flag -> create job -> forward to Modal

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { FEATURES } from '@my-studio/config/feature-flags';
import { getUser, createServerSupabaseClient } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

const movieSchema = z.object({
  prompt: z.string().min(1).max(10000),
  style: z.enum(['cinematic', 'documentary', 'anime', 'realistic']).default('cinematic'),
  duration: z.enum(['short', 'medium', 'long']).default('short'),
});

export async function POST(request: NextRequest) {
  // 1. Auth check
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 2. Feature flag check
  if (!FEATURES.MOVIE) {
    return NextResponse.json(
      { message: 'Movie Generator is not enabled' },
      { status: 403 },
    );
  }

  // 3. Parse and validate input
  const body: unknown = await request.json();
  const parsed = movieSchema.safeParse(body);
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
    module: 'movie',
    status: 'queued',
    current_step: 'queued',
    progress_percent: 0,
    input_type: 'text',
    input_data: {
      prompt: parsed.data.prompt,
      style: parsed.data.style,
      duration: parsed.data.duration,
    },
    settings: {
      style: parsed.data.style,
    },
  });

  if (jobError) {
    return NextResponse.json(
      { message: 'Failed to create job' },
      { status: 500 },
    );
  }

  // 6. Forward to Modal backend (fire-and-forget)
  const modalBaseUrl = process.env.MODAL_BASE_URL;
  const modalToken = process.env.MODAL_API_SECRET_TOKEN;

  if (modalBaseUrl && modalToken) {
    fetch(`${modalBaseUrl}/generate/movie`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        user_id: user.id,
        prompt: parsed.data.prompt,
        style: parsed.data.style,
        duration: parsed.data.duration,
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
