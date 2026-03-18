import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import * as verifService from '../services/driverVerification.service';
import * as notifService from '../services/notification.service';
import ApiError from '../utils/ApiError';
import { uploadToCloudinary } from '../utils/cloudinary';
import { AuthenticatedRequest } from '../middlewares/auth';

interface MulterFiles {
  [fieldname: string]: Express.Multer.File[];
}

export const adminListVerifications = asyncHandler(async (req: Request, res: Response) => {
  const result = await verifService.searchVerifications(req.query as Record<string, unknown>);
  res.status(200).json({ success: true, message: 'Driver verifications (admin) retrieved successfully', ...result });
});

export const getMyVerification = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const record = await verifService.getVerificationByUser(authReq.user!.sub);
  res.status(200).json({ success: true, message: 'Driver verification record retrieved successfully', data: record });
});

export const createVerification = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.sub;
  const files = req.files as MulterFiles | undefined;

  if (!files || !files.licensePhotoUrl || !files.selfiePhotoUrl) {
    throw new ApiError(400, 'License photo and selfie photo are required');
  }

  const [licenseResult, selfieResult] = await Promise.all([
    uploadToCloudinary(files.licensePhotoUrl[0].buffer, 'painamnae/licenses'),
    uploadToCloudinary(files.selfiePhotoUrl[0].buffer, 'painamnae/selfies'),
  ]);

  const payload = {
    userId,
    licenseNumber: req.body.licenseNumber,
    firstNameOnLicense: req.body.firstNameOnLicense,
    lastNameOnLicense: req.body.lastNameOnLicense,
    typeOnLicense: req.body.typeOnLicense,
    licenseIssueDate: new Date(req.body.licenseIssueDate),
    licenseExpiryDate: new Date(req.body.licenseExpiryDate),
    licensePhotoUrl: licenseResult.url,
    selfiePhotoUrl: selfieResult.url,
  };

  const newRec = await verifService.createVerification(payload as never);

  await notifService.createNotificationByAdmin({
    userId,
    type: 'VERIFICATION',
    title: 'คำขอคนขับถูกส่งแล้ว',
    body: 'เราได้รับข้อมูลใบขับขี่ของคุณแล้ว กำลังรอแอดมินตรวจสอบ',
    link: '/driver-verification',
    metadata: { kind: 'driver_verification', verificationId: newRec.id, userId: newRec.userId, status: newRec.status, initiatedBy: 'user' },
  });

  res.status(201).json({ success: true, message: 'Driver verification submitted and pending approval', data: newRec });
});

export const updateVerification = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.sub;
  const { id } = req.params;

  const existing = await verifService.getVerificationById(id);
  if (!existing) throw new ApiError(404, 'Verification not found');
  if (existing.userId !== userId) throw new ApiError(403, 'Forbidden');

  let photoUrl = existing.licensePhotoUrl;
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'painamnae/licenses');
    photoUrl = result.url;
  }

  const payload = {
    ...req.body,
    licenseIssueDate: req.body.licenseIssueDate ? new Date(req.body.licenseIssueDate) : undefined,
    licenseExpiryDate: req.body.licenseExpiryDate ? new Date(req.body.licenseExpiryDate) : undefined,
    licensePhotoUrl: photoUrl,
  };

  const updated = await verifService.updateVerification(id, payload as never);

  await notifService.createNotificationByAdmin({
    userId: updated.userId,
    type: 'VERIFICATION',
    title: 'คำขอคนขับถูกส่งแล้ว',
    body: 'เราได้รับข้อมูลใบขับขี่ของคุณแล้ว กำลังรอแอดมินตรวจสอบ',
    link: '/driver-verification',
    metadata: { kind: 'driver_verification', verificationId: updated.id, userId: updated.userId, status: updated.status, initiatedBy: 'user' },
  });

  res.status(200).json({ success: true, message: 'Driver verification updated successfully', data: updated });
});

export const getAllVerifications = asyncHandler(async (_req: Request, res: Response) => {
  const list = await verifService.getAllVerifications();
  res.status(200).json({ success: true, message: 'All driver verifications retrieved successfully', data: list });
});

export const getVerificationById = asyncHandler(async (req: Request, res: Response) => {
  const rec = await verifService.getVerificationById(req.params.id);
  if (!rec) throw new ApiError(404, 'Verification not found');
  res.status(200).json({ success: true, message: 'Driver verification record retrieved successfully', data: rec });
});

export const updateVerificationStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const updated = await verifService.updateVerificationStatus(id, status);

  try {
    if (status === 'APPROVED') {
      await notifService.createNotificationByAdmin({
        userId: updated.userId, type: 'VERIFICATION',
        title: 'ยืนยันตัวตนคนขับสำเร็จ', body: 'แอดมินได้อนุมัติคำขอของคุณแล้ว ตอนนี้คุณสามารถสร้างเส้นทางได้',
        link: '/driver-verification',
        metadata: { kind: 'driver_verification', verificationId: updated.id, userId: updated.userId, status: updated.status, initiatedBy: 'system' },
      });
    } else if (status === 'REJECTED') {
      await notifService.createNotificationByAdmin({
        userId: updated.userId, type: 'VERIFICATION',
        title: 'คำขอคนขับถูกปฏิเสธ', body: 'ข้อมูลใบขับขี่/รูปถ่ายของคุณไม่ผ่านการตรวจสอบ กรุณาตรวจสอบและส่งใหม่อีกครั้ง',
        link: '/driver-verification',
        metadata: { kind: 'driver_verification', verificationId: updated.id, userId: updated.userId, status: updated.status, initiatedBy: 'system' },
      });
    } else if (status === 'PENDING') {
      await notifService.createNotificationByAdmin({
        userId: updated.userId, type: 'VERIFICATION',
        title: 'คำขอคนขับอยู่ระหว่างตรวจสอบ', body: 'เราได้รับคำขอของคุณแล้ว กำลังอยู่ระหว่างการตรวจสอบโดยแอดมิน',
        link: '/driver-verification',
        metadata: { kind: 'driver_verification', verificationId: updated.id, userId: updated.userId, status: updated.status, initiatedBy: 'user' },
      });
    }
  } catch (e) {
    console.error('Failed to create verification notification:', e);
  }

  res.status(200).json({ success: true, message: `Driver verification status updated to ${status}`, data: updated });
});

export const adminCreateVerification = asyncHandler(async (req: Request, res: Response) => {
  const payload: Record<string, unknown> = { ...req.body };
  const files = req.files as MulterFiles | undefined;

  if (files?.licensePhotoUrl) {
    const r = await uploadToCloudinary(files.licensePhotoUrl[0].buffer, 'painamnae/licenses');
    payload.licensePhotoUrl = r.url;
  }
  if (files?.selfiePhotoUrl) {
    const r = await uploadToCloudinary(files.selfiePhotoUrl[0].buffer, 'painamnae/selfies');
    payload.selfiePhotoUrl = r.url;
  }
  if (payload.licenseIssueDate) payload.licenseIssueDate = new Date(payload.licenseIssueDate as string);
  if (payload.licenseExpiryDate) payload.licenseExpiryDate = new Date(payload.licenseExpiryDate as string);

  const created = await verifService.createVerificationByAdmin(payload as never);
  res.status(201).json({ success: true, message: 'Driver verification (by admin) created successfully', data: created });
});

export const adminDeleteVerification = asyncHandler(async (req: Request, res: Response) => {
  const existing = await verifService.getVerificationById(req.params.id);
  if (!existing) throw new ApiError(404, 'Verification not found');
  await verifService.deleteVerificationByAdmin(req.params.id);
  res.status(200).json({ success: true, message: 'Driver verification (by admin) deleted successfully' });
});

export const adminUpdateVerification = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await verifService.getVerificationById(id);
  if (!existing) throw new ApiError(404, 'Verification not found');

  const payload: Record<string, unknown> = { ...req.body };
  const files = req.files as MulterFiles | undefined;

  if (files?.licensePhotoUrl) {
    const r = await uploadToCloudinary(files.licensePhotoUrl[0].buffer, 'painamnae/licenses');
    payload.licensePhotoUrl = r.url;
  }
  if (files?.selfiePhotoUrl) {
    const r = await uploadToCloudinary(files.selfiePhotoUrl[0].buffer, 'painamnae/selfies');
    payload.selfiePhotoUrl = r.url;
  }
  if (payload.licenseIssueDate) payload.licenseIssueDate = new Date(payload.licenseIssueDate as string);
  if (payload.licenseExpiryDate) payload.licenseExpiryDate = new Date(payload.licenseExpiryDate as string);

  const updated = await verifService.updateVerificationByAdmin(id, payload as never);
  res.status(200).json({ success: true, message: 'Driver verification (by admin) updated successfully', data: updated });
});
