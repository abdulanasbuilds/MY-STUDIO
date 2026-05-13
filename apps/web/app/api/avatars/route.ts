// MY STUDIO — Avatars API Route
// PURPOSE: Get, create, and delete avatar profiles
// MODULE: M01 Avatar Studio

import { NextRequest, NextResponse } from 'next/server';
import { getUser, createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(_request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: avatars, error } = await supabase
    .from('avatar_profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch avatars', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ avatars: avatars ?? [] });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, face_image_url, face_cloudinary_id, language } = body;

  if (!name || !face_image_url) {
    return NextResponse.json(
      { error: 'Name and face image are required' },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();

  const { data: existingAvatars } = await supabase
    .from('avatar_profiles')
    .select('id')
    .eq('user_id', user.id);

  const is_default = (existingAvatars?.length ?? 0) === 0;

  const { data: avatar, error } = await supabase
    .from('avatar_profiles')
    .insert({
      user_id: user.id,
      name,
      face_image_url,
      face_cloudinary_id: face_cloudinary_id ?? null,
      language: language ?? 'en',
      is_default,
      voice_cloned: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create avatar', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ avatar }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const avatarId = searchParams.get('id');

  if (!avatarId) {
    return NextResponse.json({ error: 'Avatar ID required' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('avatar_profiles')
    .delete()
    .eq('id', avatarId)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete avatar', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}