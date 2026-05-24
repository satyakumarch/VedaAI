// ============================================================
// VedaAI Backend - Multer File Upload Middleware
// ============================================================
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { config } from '../config';

const storage = multer.memoryStorage(); // store in memory for processing

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowed: string[] = [...config.upload.allowedMimeTypes];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and TXT files are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSizeMb * 1024 * 1024,
  },
});
