// MY STUDIO — POST /api/generate/documentary
// PURPOSE: Trigger documentary generation via Modal

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUser } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

const documentarySchema = z.object({
  topic: z.string().min(1).max(5000),
  sources: z.array(z.string().url()).min(1).max(10),
  duration: z.enum(['short', 'medium', 'long']).default('medium'),
  narrationStyle: z.enum(['neutral', 'dramatic', 'conversational']).default('neutral'),
});

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = documentarySchema.safeParse(body);
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
