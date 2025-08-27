import { v2 as cloudinary, type ConfigOptions } from 'cloudinary';

let cloudinaryInstance: typeof cloudinary | null = null;
let cloudinaryConfigError: string | null = null;

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  cloudinaryConfigError = 
    'Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not fully set in .env.local. Image uploads will be disabled.';
  console.error('[Cloudinary Lib] ' + cloudinaryConfigError);
} else {
  try {
    const config: ConfigOptions = {
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true, // Use HTTPS
    };
    cloudinary.config(config);
    cloudinaryInstance = cloudinary;
    console.log('[Cloudinary Lib] Cloudinary configured successfully.');
  } catch (error: any) {
    cloudinaryConfigError = `Failed to configure Cloudinary: ${error.message}`;
    console.error('[Cloudinary Lib] ' + cloudinaryConfigError);
    cloudinaryInstance = null;
  }
}

export { cloudinaryInstance, cloudinaryConfigError };
