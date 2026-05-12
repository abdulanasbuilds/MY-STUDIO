// MY STUDIO — cloudinary.ts
// PURPOSE: Cloudinary upload/delete helpers (stubs — will integrate Cloudinary SDK)

interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Uploads a file to Cloudinary in the specified folder.
 * TODO: Integrate with Cloudinary Upload API or SDK.
 */
export async function uploadFile(file: File, folder: string): Promise<UploadResult> {
  // TODO: Implement Cloudinary upload
  // Will use: https://api.cloudinary.com/v1_1/{cloud_name}/auto/upload
  // With: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('File upload failed');
  }

  return response.json() as Promise<UploadResult>;
}

/**
 * Deletes a file from Cloudinary by its public ID.
 * TODO: Implement via Cloudinary Admin API.
 */
export async function deleteFile(publicId: string): Promise<void> {
  // TODO: Implement Cloudinary delete
  // Will call: POST /api/upload with DELETE method or a dedicated /api/delete endpoint
  void publicId;
  throw new Error('deleteFile not yet implemented');
}
