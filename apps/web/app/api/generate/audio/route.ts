// MY STUDIO — POST /api/generate/audio
// PURPOSE: Trigger audio generation or separation via Modal

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { FEATURES } from '@my-studio/config/feature-flags';
import { getUser, createServerSupabaseClient } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/rate-limit';

const audioSchema = z.object({
  mode: z.enum(['generate', 'separate']).default('generate'),
  prompt: z.string().max(2000).optional(),
  audioUrl: z.string().url().optional(),
  duration: z.number().min(5).max(60).default(15),
}).refine((data) => {
    if (data.mode === 'generate' && !data.prompt) return false;
    if (data.mode === 'separate' && !data.audioUrl) return false;
    return true;
}, { message: "Prompt is required for generation, audioUrl for separation." });

export async function POST(request: NextRequest) {
  // 1. Auth check
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 2. Feature flag check
  if (!FEATURES.AUDIO) {
    return NextResponse.json(
      { message: 'Audio Studio is not enabled' },
      { status: 403 },
    );
  }

  // 3. Parse and validate input
  const body: unknown = await request.json();
  const parsed = audioSchema.safeParse(body);
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
    module: 'audio',
    status: 'queued',
    current_step: 'queued',
    progress_percent: 0,
    input_type: parsed.data.mode === 'generate' ? 'text' : 'url',
    input_data: {
      mode: parsed.data.mode,
      prompt: parsed.data.prompt,
      audio_url: parsed.data.audioUrl,
      duration: parsed.data.duration,
    },
    settings: {
      mode: parsed.data.mode,
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
    fetch(`${modalBaseUrl}/generate/audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        user_id: user.id,
        mode: parsed.data.mode,
        prompt: parsed.data.prompt,
        audio_url: parsed.data.audioUrl,
        duration: parsed.data.duration,
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

