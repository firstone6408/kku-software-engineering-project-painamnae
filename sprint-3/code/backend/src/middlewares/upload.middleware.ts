import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import ApiError from '../utils/ApiError';

// กำหนดค่า Multer ให้เก็บไฟล์ใน memoryชั่วคราวเพื่อรอส่งต่อไปยัง Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // จำกัดขนาดไฟล์ไม่เกิน 5 MB
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // อนุญาตเฉพาะไฟล์รูปภาพ (jpeg, jpg, png)
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Only image files are allowed!'));
    }
  },
});

// สำหรับ Report — รองรับทั้งรูปภาพและวิดีโอ (สูงสุด 50 MB, สูงสุด 10 ไฟล์)
export const reportUpload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Only image and video files are allowed!'));
    }
  },
});

export default upload;
