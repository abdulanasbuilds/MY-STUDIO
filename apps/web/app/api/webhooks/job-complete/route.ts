// MY STUDIO — POST /api/webhooks/job-complete
// PURPOSE: Webhook callback from Modal when a job completes

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const webhookSchema = z.object({
  job_id: z.string().uuid(),
  status: z.enum(['complete', 'failed']),
  output_url: z.string().url().nullable(),
  error: z.string().nullable(),
  api_token: z.string(),
  timestamp: z.number(),
});

export async function POST(request: NextRequest) {
  // 1. Parse webhook payload
  const body: unknown = await request.json();
  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid webhook payload' },
      { status: 400 },
    );
  }

  // 2. Verify API token from Modal
  const expectedToken = process.env.MODAL_API_SECRET_TOKEN;
  if (!expectedToken || parsed.data.api_token !== expectedToken) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  // 3. Verify timestamp is recent (within 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  const timeDiff = Math.abs(now - parsed.data.timestamp);
  if (timeDiff > 300) {
    return NextResponse.json({ message: 'Stale webhook' }, { status: 400 });
  }

  // 4. TODO: Update job record in Supabase
  // const supabase = createServerSupabaseClient();
  // await supabase.from('jobs').update({
  //   status: parsed.data.status,
  //   output_url: parsed.data.output_url,
  //   error: parsed.data.error,
  //   updated_at: new Date().toISOString(),
  // }).eq('id', parsed.data.job_id);

  return NextResponse.json({ received: true });
}
