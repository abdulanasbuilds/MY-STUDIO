// MY STUDIO — POST /api/rivals/analyze
// PURPOSE: Trigger rival/competitor analysis

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUser } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

const analyzeSchema = z.object({
  channelUrl: z.string().url(),
  platform: z.enum(['youtube', 'tiktok', 'instagram', 'twitter']),
  depth: z.enum(['quick', 'standard', 'deep']).default('standard'),
});

export async function POST(request: NextRequest) {
  // 1. Auth check
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate input
  const body: unknown = await request.json();
  const parsed = analyzeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // 3. Rate limit check
  const isLimited = await checkRateLimit(user.id, 'generation');
  if (isLimited) {
    return NextResponse.json(
      { message: 'Rate limit exceeded. Please try again later.' },
      { status: 429 },
    );
  }

  // 4. TODO: Feature flag check, create analysis job, forward to Modal/Cloudflare Worker
  const jobId = crypto.randomUUID();

  return NextResponse.json({ jobId }, { status: 202 });
}
