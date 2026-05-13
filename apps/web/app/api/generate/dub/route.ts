// MY STUDIO — POST /api/generate/dub
// PURPOSE: Trigger voice dubbing via Modal
// SECURITY: getUser() -> Zod safeParse() -> checkRateLimit() -> feature flag -> create job -> forward to Modal

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { FEATURES } from '@my-studio/config/feature-flags';
import { getUser, createServerSupabaseClient } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/rate-limit';

const dubSchema = z.object({
  videoUrl: z.string().url(),
  targetLanguage: z.string().min(2).max(10),
  preserveOriginalAudio: z.boolean().default(false),
  lipSync: z.boolean().default(true),
  cloneVoice: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  // 1. Auth check
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 2. Feature flag check
  if (!FEATURES.DUBBING) {
    return NextResponse.json(
      { message: 'Voice Dubbing is not enabled' },
      { status: 403 },
    );
  }

  // 3. Parse and validate input
  const body: unknown = await request.json();
  const parsed = dubSchema.safeParse(body);
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
    module: 'dubbing',
    status: 'queued',
    current_step: 'queued',
    progress_percent: 0,
    input_type: 'url',
    input_data: {
      video_url: parsed.data.videoUrl,
      target_lang: parsed.data.targetLanguage,
      preserve_background: parsed.data.preserveOriginalAudio,
      sync_lips: parsed.data.lipSync,
      clone_voice: parsed.data.cloneVoice,
    },
    settings: {
      target_language: parsed.data.targetLanguage,
    },
  });

  if (jobError) {
    return NextResponse.json(
      { message: 'Failed to create job' },
      { status: 500 },
    );
  }

  // 6. Forward to Modal backend
  const modalBaseUrl = process.env.MODAL_BASE_URL;
  const modalToken = process.env.MODAL_API_SECRET_TOKEN;

  if (modalBaseUrl && modalToken) {
    fetch(`${modalBaseUrl}/generate/dub`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        user_id: user.id,
        video_url: parsed.data.videoUrl,
        target_lang: parsed.data.targetLanguage,
        preserve_background: parsed.data.preserveOriginalAudio,
        sync_lips: parsed.data.lipSync,
        clone_voice: parsed.data.cloneVoice,
        api_token: modalToken,
        timestamp: Math.floor(Date.now() / 1000),
      }),
    }).catch(() => {
      // Failed to trigger
    });
  }

  // 7. Return job ID immediately
  return NextResponse.json({ jobId }, { status: 202 });
}

