import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export async function uploadFile(
  filePath: string,
  options?: { folder?: string; publicId?: string }
) {
  return cloudinary.uploader.upload(filePath, {
    folder: options?.folder || "mardi-treks",
    public_id: options?.publicId,
    resource_type: "auto",
  });
}

export async function deleteFile(publicId: string, options?: { resourceType?: string }) {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: options?.resourceType || "image",
  });
}

export function getOptimizedUrl(publicId: string, options?: {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
  format?: string;
}) {
  return cloudinary.url(publicId, {
    width: options?.width,
    height: options?.height,
    crop: options?.crop || "fill",
    quality: options?.quality || "auto",
    format: options?.format || "auto",
    secure: true,
  });
}
