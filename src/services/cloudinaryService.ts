/**
 * src/services/cloudinaryService.ts
 * ────────────────────────────────
 * Service for uploading farmer crop images to Cloudinary securely.
 */

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

export async function uploadCropImage(file: File): Promise<CloudinaryUploadResult> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration is missing in environment variables.');
  }

  // Validate file
  if (!file) {
    throw new Error('No file provided for upload.');
  }
  
  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type. Only images are allowed.');
  }

  // Basic size check (e.g., max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size exceeds the 10MB limit.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error('Cloudinary upload error:', errorData);
    throw new Error('Image upload to Cloudinary failed.');
  }

  const data = await response.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
  };
}
