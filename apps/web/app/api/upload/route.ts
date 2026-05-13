// MY STUDIO — POST /api/upload
// PURPOSE: Handle file uploads to Cloudinary

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/rate-limit';
import { v2 as cloudinary } from 'cloudinary';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES: Record<string, string[]> = {
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/webm'],
  image: ['image/png', 'image/jpeg', 'image/webp'],
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
  const folder = (formData.get('folder') as string) || 'uploads';
  const resourceType = (formData.get('resourceType') as string) || 'auto';

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ message: 'No file provided' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { message: 'File too large. Maximum size is 100MB.' },
      { status: 400 },
    );
  }

  // Validate file type
  const allowedTypes = Object.values(ALLOWED_TYPES).flat();
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ message: 'Unsupported file type' }, { status: 400 });
  }

  try {
    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `my-studio/${folder}`,
      resource_type: resourceType === 'audio' ? 'raw' : resourceType as 'video' | 'image' | 'raw' | 'auto',
      public_id: `${Date.now()}-${file.name.replace(/\.[^.]+$/, '')}`,
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json(
      { message: 'Upload failed. Please try again.' },
      { status: 500 },
    );
  }
}

