// MY STUDIO — GET/DELETE /api/rivals/[id]
// PURPOSE: Get or delete a rival analysis by ID

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUser, createServerSupabaseClient } from '@/lib/supabase-server';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
    return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
  }

  // 3. Fetch rival analysis from Supabase (scoped to user)
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('rival_analyses')
    .select('*')
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ message: 'Analysis not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
    return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
  }

  // 3. Delete rival analysis from Supabase (scoped to user)
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('rival_analyses')
    .delete()
    .eq('id', parsed.data.id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ message: 'Failed to delete analysis' }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
