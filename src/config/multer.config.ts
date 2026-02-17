import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Ensure upload directory exists
const quotationUploadDir = path.join(process.cwd(), 'uploads', 'quotations');
if (!fs.existsSync(quotationUploadDir)) {
  fs.mkdirSync(quotationUploadDir, { recursive: true });
}

const quotationStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, quotationUploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const imageFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const quotationImageUpload = multer({
  storage: quotationStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});