// MY STUDIO — POST /api/generate/avatar
// PURPOSE: Trigger avatar video generation via Modal

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUser } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

const avatarSchema = z.object({
  script: z.string().min(1).max(5000),
  avatarId: z.string().uuid(),
  voiceId: z.string().optional(),
  qualityMode: z.enum(['draft', 'standard', 'high']).default('standard'),
});

export async function POST(request: NextRequest) {
  // 1. Auth check
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse and validate input
  const body: unknown = await request.json();
  const parsed = avatarSchema.safeParse(body);
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

  // 4. TODO: Create job record in Supabase, forward to Modal
  const jobId = crypto.randomUUID();

  return NextResponse.json({ jobId }, { status: 202 });
}
