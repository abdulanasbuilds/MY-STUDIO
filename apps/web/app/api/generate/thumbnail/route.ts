// MY STUDIO — POST /api/generate/thumbnail
// PURPOSE: Trigger thumbnail generation via Modal (FLUX.1)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUser } from '@/lib/supabase';
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

  // TODO: Feature flag check, create job record, forward to Modal
  const jobId = crypto.randomUUID();

  return NextResponse.json({ jobId }, { status: 202 });
}
