// MY STUDIO — POST /api/generate/documentary
// PURPOSE: Trigger documentary generation via Modal
// SECURITY: getUser() -> Zod safeParse() -> checkRateLimit() -> feature flag -> create job -> forward to Modal

import { NextRequest, NextResponse } from 'next/server';

import { generateDocumentarySchema } from '@my-studio/validators/schemas';
import { FEATURES } from '@my-studio/config/feature-flags';

import { getUser, createServerSupabaseClient } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // 1. Auth check
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 2. Feature flag check
  if (!FEATURES.DOCUMENTARY) {
    return NextResponse.json(
      { message: 'Documentary Engine is not enabled' },
      { status: 403 },
    );
  }

  // 3. Parse and validate input with Zod
  const body: unknown = await request.json();
  const parsed = generateDocumentarySchema.safeParse(body);
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
    module: 'documentary',
    status: 'queued',
    current_step: 'queued',
    progress_percent: 0,
    input_type: 'text',
    input_data: {
      topic: parsed.data.sources[0], // using sources array as topic input for now
      style: parsed.data.style,
      duration: parsed.data.duration_minutes > 1 ? 'long' : 'short',
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

  // 6. Forward to Modal backend
  const modalBaseUrl = process.env.MODAL_BASE_URL;
  const modalToken = process.env.MODAL_API_SECRET_TOKEN;

  if (modalBaseUrl && modalToken) {
    fetch(`${modalBaseUrl}/generate/documentary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        user_id: user.id,
        topic: parsed.data.sources[0],
        style: parsed.data.style,
        duration: parsed.data.duration_minutes > 1 ? 'long' : 'short',
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
