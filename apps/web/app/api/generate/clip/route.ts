// MY STUDIO — POST /api/generate/clip
// PURPOSE: Trigger clip extraction via Modal (Nexus Clipper)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUser } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

const clipSchema = z.object({
  videoUrl: z.string().url(),
  maxClips: z.number().int().min(1).max(20).default(5),
  minScore: z.number().min(0).max(100).default(50),
  platforms: z.array(z.enum(['youtube_shorts', 'tiktok', 'instagram_reels'])).default(['youtube_shorts']),
});

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = clipSchema.safeParse(body);
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
