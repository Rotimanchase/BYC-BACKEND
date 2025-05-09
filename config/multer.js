import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define upload directory
const uploadDir = path.join(__dirname, '../Uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory:', uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Multer destination:', uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    console.log('Multer filename:', `${uniqueSuffix}-${file.originalname}`);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    console.log('Multer processing file:', file.originalname, file.mimetype);
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      console.log('Multer rejected file:', file.originalname, 'Reason: Invalid mimetype');
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 4, // Max 4 images
  },
});

// Wrap Multer in a middleware to catch errors
export const uploadMiddleware = (req, res, next) => {
  console.log('Multer middleware invoked for request:', req.url);
  upload.array('images', 4)(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({ success: false, message: `Multer error: ${err.message}` });
    }
    console.log('Multer parsed body:', req.body);
    console.log('Multer parsed files:', req.files);
    next();
  });
};