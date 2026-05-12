// MY STUDIO — POST /api/generate/remix
// PURPOSE: Trigger content remix generation via Modal

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUser } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

const remixSchema = z.object({
  sourceUrl: z.string().url(),
  targetPlatform: z.enum(['youtube', 'tiktok', 'instagram', 'twitter', 'linkedin']),
  style: z.enum(['educational', 'entertainment', 'news', 'storytelling']).default('educational'),
});

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = remixSchema.safeParse(body);
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
