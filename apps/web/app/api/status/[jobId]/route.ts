// MY STUDIO — GET /api/status/[jobId]
// PURPOSE: Poll job status from Supabase

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUser, createServerSupabaseClient } from '@/lib/supabase';

const paramsSchema = z.object({
  jobId: z.string().uuid(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  // 1. Auth check
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate params
  const resolvedParams = await params;
  const parsed = paramsSchema.safeParse(resolvedParams);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid job ID' }, { status: 400 });
  }

  // 3. Fetch job from Supabase (scoped to user)
  const supabase = await createServerSupabaseClient();
  const { data: job, error } = await supabase
    .from('jobs')
    .select('id, status, step, progress, output_url, error, created_at, updated_at')
    .eq('id', parsed.data.jobId)
    .eq('user_id', user.id)
    .single();

  if (error || !job) {
    return NextResponse.json({ message: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    step: job.step,
    progress: job.progress,
    outputUrl: job.output_url,
    error: job.error,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
  });
}
