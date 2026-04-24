/**
 * Cloudinary config with graceful fallback.
 * If CLOUDINARY keys are not set, multer stores the file in memory
 * and the controller will skip setting imageUrl.
 */
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let upload;

if (hasCloudinary) {
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:          'smart-city-complaints',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
  });

  upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  });

  console.log('[Cloudinary] ✓ Connected — images will be stored in the cloud.');
} else {
  // No Cloudinary keys — fall back to memory storage (no image persisted)
  upload = multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: 5 * 1024 * 1024 },
  });

  console.log('[Cloudinary] ⚠ Keys not set — running in demo mode (no image storage).');
}

module.exports = { cloudinary, upload, hasCloudinary };
