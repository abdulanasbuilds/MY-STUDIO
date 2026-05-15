// MY STUDIO — POST /api/generate/thumbnail
// PURPOSE: Trigger thumbnail generation via Modal (FLUX.1)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { FEATURES } from '@my-studio/config/feature-flags';
import { getUser, createServerSupabaseClient } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/rate-limit';

const thumbnailSchema = z.object({
  prompt: z.string().min(1).max(2000),
  style: z.enum(['photorealistic', 'illustration', 'graphic', 'minimal']).default('photorealistic'),
  count: z.number().int().min(1).max(6).default(3),
  platform: z.enum(['youtube', 'tiktok', 'instagram', 'twitter']).default('youtube'),
});

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!FEATURES.THUMBNAILS) {
    return NextResponse.json(
      { message: 'Thumbnail Engine is not enabled' },
      { status: 403 },
    );
  }

  const body: unknown = await request.json();
  const parsed = thumbnailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const isLimited = await checkRateLimit(user.id, 'generation');
  if (isLimited) {
    return NextResponse.json(
      { message: 'Rate limit exceeded. Please try again later.' },
      { status: 429 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const jobId = crypto.randomUUID();
  const { error: jobError } = await supabase.from('content_jobs').insert({
    id: jobId,
    user_id: user.id,
    module: 'thumbnails',
    status: 'queued',
    current_step: 'queued',
    progress_percent: 0,
    input_type: 'text',
    input_data: {
      prompt: parsed.data.prompt,
      style: parsed.data.style,
      count: parsed.data.count,
      platform: parsed.data.platform,
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

  const modalBaseUrl = process.env.MODAL_BASE_URL || "https://abdulanassofficial--my-studio-fastapi-app.modal.run";
  const modalToken = process.env.API_SECRET_TOKEN || process.env.MODAL_API_SECRET_TOKEN || 'f1KNqhD6j6k4Bv31CO7WXd63Nt_rwtpZdAGhErm6onM';

  if (modalBaseUrl && modalToken) {
    fetch(`${modalBaseUrl}/generate/thumbnail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        user_id: user.id,
        prompt: parsed.data.prompt,
        style: parsed.data.style,
        count: parsed.data.count,
        platform: parsed.data.platform,
        api_token: modalToken,
        timestamp: Math.floor(Date.now() / 1000),
      }),
    }).catch(() => {
      // Failed to trigger
    });
  }

  return NextResponse.json({ jobId }, { status: 202 });
}

