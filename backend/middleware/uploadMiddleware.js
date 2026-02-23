const fs = require('fs');
const path = require('path');

// Configure multer for audio files
const multer = require('multer');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/media');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1000000);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept audio, image, and video files
  const allowedMimes = [
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'application/octet-stream', // Some audio uploads come as octet-stream

    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',

    // Video
    'video/mp4',
    'video/webm',
    'video/ogg'
  ];

  if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio, images, and videos are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size
  }
});

module.exports = upload;
