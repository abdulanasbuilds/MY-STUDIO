// MY STUDIO — POST /api/generate/clip
// PURPOSE: Trigger Clipper pipeline via Modal
// SECURITY: getUser() -> Zod safeParse() -> checkRateLimit() -> feature flag -> create job -> forward to Modal

import { NextRequest, NextResponse } from 'next/server';

import { generateClipSchema } from '@my-studio/validators/schemas';
import { FEATURES } from '@my-studio/config/feature-flags';

import { getUser, createServerSupabaseClient } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // 1. Auth check
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 2. Feature flag check
  if (!FEATURES.CLIPPER) {
    return NextResponse.json(
      { message: 'Smart Clipper is not enabled' },
      { status: 403 },
    );
  }

  // 3. Parse and validate input with Zod
  const body: unknown = await request.json();
  const parsed = generateClipSchema.safeParse(body);
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
    module: 'clipper',
    status: 'queued',
    current_step: 'queued',
    progress_percent: 0,
    input_type: 'url',
    input_data: {
      source_url: parsed.data.source_url,
      max_clips: parsed.data.max_clips,
      min_duration: parsed.data.min_duration,
      max_duration: parsed.data.max_duration,
      platforms: parsed.data.platforms,
      caption_style: parsed.data.caption_style,
      crop_mode: parsed.data.crop_mode,
      hook_overlay: parsed.data.hook_overlay,
      custom_instructions: parsed.data.custom_instructions,
    },
    settings: {
      crop_mode: parsed.data.crop_mode,
      caption_style: parsed.data.caption_style,
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
  const modalToken = process.env.API_SECRET_TOKEN || process.env.MODAL_API_SECRET_TOKEN;

  if (modalBaseUrl && modalToken) {
    fetch(`${modalBaseUrl}/generate/clip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        user_id: user.id,
        source_url: parsed.data.source_url,
        max_clips: parsed.data.max_clips,
        min_duration: parsed.data.min_duration,
        max_duration: parsed.data.max_duration,
        platforms: parsed.data.platforms,
        caption_style: parsed.data.caption_style,
        crop_mode: parsed.data.crop_mode,
        hook_overlay: parsed.data.hook_overlay,
        custom_instructions: parsed.data.custom_instructions,
        api_token: modalToken,
        timestamp: Math.floor(Date.now() / 1000),
      }),
    }).catch(() => {
      // Modal trigger failed — job will stay queued
    });
  }

  // 7. Return job ID immediately
  return NextResponse.json({ jobId }, { status: 202 });
}

