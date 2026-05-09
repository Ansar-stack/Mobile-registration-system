import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

// Configure Cloudinary from env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Compress an image buffer to target ~100-200 KB then upload to Cloudinary.
 * Strategy: resize to max 1000px wide, convert to JPEG with quality 60.
 * JPEG at 1000px / q60 reliably lands in the 80-200 KB range for typical photos.
 */
export const uploadImage = async (buffer, folder, type = 'upload') => {
  const compressed = await sharp(buffer)
    .rotate()                                          // auto-orient from EXIF
    .resize({ width: 1000, withoutEnlargement: true }) // cap width, keep aspect
    .jpeg({ quality: 60, mozjpeg: true })              // JPEG ~100-200 KB
    .toBuffer();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, type, resource_type: 'image', format: 'jpg' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(compressed);
  });
};

// Delete an image from Cloudinary by public_id
export const deleteImage = async (publicId, type = 'upload') => {
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image', type });
};

export const FOLDERS = {
  ID_IMAGE: 'mobile-registration/id-images',
  PROFILE:  'mobile-registration/profiles',
};
