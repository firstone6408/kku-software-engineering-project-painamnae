import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import ApiError from '../utils/ApiError';
import { uploadToCloudinary } from '../utils/cloudinary';
import * as notifService from '../services/notification.service';
import { AuthenticatedRequest } from '../middlewares/auth';

interface MulterFiles {
  [fieldname: string]: Express.Multer.File[];
}

export const adminListUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.searchUsers(req.query as Record<string, unknown>);
  res.status(200).json({ success: true, message: 'Users (admin) retrieved', ...result });
});

export const getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await userService.getAllUsers();
  res.status(200).json({ success: true, message: 'Users retrieved', data: users });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.status(200).json({ success: true, message: 'User retrieved', data: user });
});

export const getUserPublicById = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserPublicById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.status(200).json({ success: true, message: 'User retrieved', data: user });
});

export const getMyUser = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const data = await userService.getUserById(authReq.user!.sub);
  res.status(200).json({ success: true, message: 'User retrieved', data });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const userData = { ...req.body };
  const files = req.files as MulterFiles | undefined;

  if (!files || !files.nationalIdPhotoUrl || !files.selfiePhotoUrl) {
    throw new ApiError(400, 'National ID photo and selfie photo are required.');
  }

  const [nationalIdResult, selfieResult] = await Promise.all([
    uploadToCloudinary(files.nationalIdPhotoUrl[0].buffer, 'painamnae/national_ids'),
    uploadToCloudinary(files.selfiePhotoUrl[0].buffer, 'painamnae/selfies'),
  ]);

  userData.nationalIdPhotoUrl = nationalIdResult.url;
  userData.selfiePhotoUrl = selfieResult.url;

  const newUser = await userService.createUser(userData);

  await notifService.createNotificationByAdmin({
    userId: newUser.id,
    type: 'VERIFICATION',
    title: 'ข้อมูลยืนยันตัวตนถูกส่งแล้ว',
    body: 'เราได้รับข้อมูลบัตรประชาชนและรูปถ่ายของคุณแล้ว กำลังรอแอดมินตรวจสอบ',
    link: '/profile/verification',
    metadata: { kind: 'identity_verification_submission', userId: newUser.id, initiatedBy: 'user' },
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully. Please wait for verification.',
    data: newUser,
  });
});

export const updateCurrentUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const updateData: Record<string, unknown> = { ...req.body };
  const files = req.files as MulterFiles | undefined;

  if (files?.nationalIdPhotoUrl) {
    const result = await uploadToCloudinary(files.nationalIdPhotoUrl[0].buffer, 'painamnae/national_ids');
    updateData.nationalIdPhotoUrl = result.url;
  }
  if (files?.selfiePhotoUrl) {
    const result = await uploadToCloudinary(files.selfiePhotoUrl[0].buffer, 'painamnae/selfies');
    updateData.selfiePhotoUrl = result.url;
  }
  if (files?.profilePicture) {
    const result = await uploadToCloudinary(files.profilePicture[0].buffer, 'painamnae/profiles');
    updateData.profilePicture = result.url;
  }

  const updatedUser = await userService.updateUserProfile(authReq.user!.sub, updateData);
  res.status(200).json({ success: true, message: 'Profile updated', data: updatedUser });
});

export const adminUpdateUser = asyncHandler(async (req: Request, res: Response) => {
  const updatedUser = await userService.updateUserProfile(req.params.id, req.body);
  res.status(200).json({ success: true, message: 'User updated by admin', data: updatedUser });
});

export const adminDeleteUser = asyncHandler(async (req: Request, res: Response) => {
  const deletedUser = await userService.deleteUser(req.params.id);
  res.status(200).json({ success: true, message: 'User deleted successfully.', data: { deletedUserId: deletedUser.id } });
});

export const setUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive, isVerified } = req.body;

  if (typeof isActive !== 'boolean' && typeof isVerified !== 'boolean') {
    throw new ApiError(400, 'Provide at least one of isActive or isVerified as boolean');
  }

  const updatedUser = await userService.updateUserProfile(req.params.id, {
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
    ...(typeof isVerified === 'boolean' ? { isVerified } : {}),
  });

  if (typeof isVerified === 'boolean') {
    try {
      if (isVerified === true) {
        await notifService.createNotificationByAdmin({
          userId: updatedUser.id,
          type: 'VERIFICATION',
          title: 'ยืนยันตัวตนสำเร็จ',
          body: 'แอดมินได้ตรวจสอบบัญชีของคุณแล้ว ตอนนี้คุณสามารถใช้งานได้เต็มรูปแบบ',
          link: '/profile/verification',
          metadata: { kind: 'user_verification', userId: updatedUser.id, initiatedBy: 'system' },
        });
      } else {
        await notifService.createNotificationByAdmin({
          userId: updatedUser.id,
          type: 'VERIFICATION',
          title: 'ยืนยันตัวตนไม่สำเร็จ',
          body: 'ข้อมูลบัตรประชาชน/รูปถ่ายของคุณไม่ผ่านการตรวจสอบ กรุณาตรวจสอบและส่งใหม่อีกครั้ง',
          link: '/profile/verification',
          metadata: { kind: 'user_verification', userId: updatedUser.id, initiatedBy: 'system' },
        });
      }
    } catch (e) {
      console.error('Failed to create verification notification:', e);
    }
  }

  res.status(200).json({ success: true, message: 'User status updated', data: updatedUser });
});
