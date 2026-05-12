// MY STUDIO — POST /api/generate/movie
// PURPOSE: Trigger movie generation via Modal

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUser } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

const movieSchema = z.object({
  prompt: z.string().min(1).max(10000),
  style: z.enum(['cinematic', 'documentary', 'anime', 'realistic']).default('cinematic'),
  duration: z.enum(['short', 'medium', 'long']).default('short'),
});

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = movieSchema.safeParse(body);
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

  // TODO: Feature flag check — movie module is not yet enabled
  // TODO: Create job record in Supabase, forward to Modal
  const jobId = crypto.randomUUID();

  return NextResponse.json({ jobId }, { status: 202 });
}
