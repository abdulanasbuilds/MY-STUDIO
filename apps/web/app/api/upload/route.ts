// MY STUDIO — POST /api/upload
// PURPOSE: Handle file uploads to Cloudinary

import { NextRequest, NextResponse } from 'next/server';

import { getUser } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

export async function POST(request: NextRequest) {
  // 1. Auth check
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 2. Rate limit check
  const isLimited = await checkRateLimit(user.id, 'api');
  if (isLimited) {
    return NextResponse.json(
      { message: 'Rate limit exceeded. Please try again later.' },
      { status: 429 },
    );
  }

  // 3. Parse multipart form data
  const formData = await request.formData();
  const file = formData.get('file');
  const folder = formData.get('folder');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ message: 'No file provided' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ message: 'File too large. Maximum size is 100MB.' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ message: 'Unsupported file type' }, { status: 400 });
  }

  // TODO: Upload to Cloudinary using CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
  const stubUrl = `https://res.cloudinary.com/stub/${typeof folder === 'string' ? folder : 'uploads'}/${file.name}`;
  const stubPublicId = `${typeof folder === 'string' ? folder : 'uploads'}/${file.name.replace(/\.[^.]+$/, '')}`;

  return NextResponse.json({
    url: stubUrl,
    publicId: stubPublicId,
  });
}
