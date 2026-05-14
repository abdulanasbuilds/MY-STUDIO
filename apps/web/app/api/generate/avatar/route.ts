// MY STUDIO — POST /api/generate/avatar
// PURPOSE: Trigger avatar video generation via Modal
// SECURITY: getUser() -> Zod safeParse() -> checkRateLimit() -> feature flag -> create job -> forward to Modal

import { NextRequest, NextResponse } from 'next/server';

import { generateAvatarSchema } from '@my-studio/validators/schemas';
import { FEATURES } from '@my-studio/config/feature-flags';

import { getUser, createServerSupabaseClient } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // 1. Auth check — always getUser(), never getSession()
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 2. Feature flag check
  if (!FEATURES.AVATAR) {
    return NextResponse.json(
      { message: 'Avatar Studio is not enabled' },
      { status: 403 },
    );
  }

  // 3. Parse and validate input with Zod
  const body: unknown = await request.json();
  const parsed = generateAvatarSchema.safeParse(body);
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

  // 5. Fetch avatar profile from Supabase to get face image URL and voice
  const supabase = await createServerSupabaseClient();
  const { data: avatar, error: avatarError } = await supabase
    .from('avatar_profiles')
    .select('id, face_image_url, voice_model_path, voice_cloned, language')
    .eq('id', parsed.data.avatar_id)
    .eq('user_id', user.id)
    .single();

  if (avatarError || !avatar) {
    return NextResponse.json(
      { message: 'Avatar profile not found' },
      { status: 404 },
    );
  }

  // 6. Create job record in Supabase
  const jobId = crypto.randomUUID();
  const { error: jobError } = await supabase.from('content_jobs').insert({
    id: jobId,
    user_id: user.id,
    module: 'avatar',
    status: 'queued',
    current_step: 'queued',
    progress_percent: 0,
    input_type: 'text',
    input_data: {
      script: parsed.data.script,
      avatar_id: parsed.data.avatar_id,
      quality_mode: parsed.data.quality_mode,
      caption_style: parsed.data.caption_style ?? 'none',
      language: parsed.data.language ?? avatar.language,
      style: parsed.data.style ?? 'casual',
    },
    settings: {
      quality_mode: parsed.data.quality_mode,
      caption_style: parsed.data.caption_style ?? 'none',
    },
  });

  if (jobError) {
    return NextResponse.json(
      { message: 'Failed to create job' },
      { status: 500 },
    );
  }

  // 7. Forward to Modal backend (fire-and-forget)
  const modalBaseUrl = process.env.MODAL_BASE_URL || "https://abdulanassofficial--my-studio-fastapi-app.modal.run";
  const modalToken = process.env.API_SECRET_TOKEN || process.env.MODAL_API_SECRET_TOKEN;

  if (modalBaseUrl && modalToken) {
    // Non-blocking: trigger Modal and don't await the full pipeline
    fetch(`${modalBaseUrl}/generate/avatar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        user_id: user.id,
        script: parsed.data.script,
        avatar_id: parsed.data.avatar_id,
        quality_mode: parsed.data.quality_mode,
        caption_style: parsed.data.caption_style ?? 'none',
        language: parsed.data.language ?? avatar.language,
        style: parsed.data.style ?? 'casual',
        face_image_url: avatar.face_image_url,
        voice_model_path: avatar.voice_model_path,
        speaker_id: avatar.id,
        api_token: modalToken,
        timestamp: Math.floor(Date.now() / 1000),
      }),
    }).catch(() => {
      // Modal trigger failed — job will stay queued
      // Could add retry logic or dead-letter queue here
    });
  }

  // 8. Return job ID immediately (client will poll /api/status/[jobId])
  return NextResponse.json({ jobId }, { status: 202 });
}

