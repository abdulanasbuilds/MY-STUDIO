// MY STUDIO — GET /api/status/[jobId]
// PURPOSE: Poll job status from Supabase content_jobs table
// SECURITY: getUser() -> validate params -> fetch job scoped to user

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUser, createServerSupabaseClient } from '@/lib/supabase-server';

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

  // 3. Fetch job from Supabase (scoped to user via user_id match)
  const supabase = await createServerSupabaseClient();
  const { data: job, error } = await supabase
    .from('content_jobs')
    .select(
      'id, module, status, current_step, progress_percent, output_url, output_metadata, error_message, created_at, started_at, completed_at',
    )
    .eq('id', parsed.data.jobId)
    .eq('user_id', user.id)
    .single();

  if (error || !job) {
    return NextResponse.json({ message: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    module: job.module,
    status: job.status,
    currentStep: job.current_step,
    progress: job.progress_percent,
    outputUrl: job.output_url,
    outputMetadata: job.output_metadata,
    error: job.error_message,
    createdAt: job.created_at,
    startedAt: job.started_at,
    completedAt: job.completed_at,
  });
}
