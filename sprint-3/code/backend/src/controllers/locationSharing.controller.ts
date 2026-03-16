import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import * as locationSharingService from '../services/locationSharing.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { startSharingSchema, updateLocationSchema } from '../validations/locationSharing.validation';
import { zodValidateThrow } from '../utils/zod';

export const startSharing = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = startSharingSchema.safeParse(req.body);
  if (!parsed.success) zodValidateThrow(parsed);

  const session = await locationSharingService.startSession(authReq.user!.sub, parsed.data!);
  res.status(201).json({ success: true, message: 'เริ่มแจ้งตำแหน่งสำเร็จ', data: session });
});

export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = updateLocationSchema.safeParse(req.body);
  if (!parsed.success) zodValidateThrow(parsed);

  const session = await locationSharingService.updateLocation(req.params.sessionId, authReq.user!.sub, parsed.data!);
  res.status(200).json({ success: true, message: 'อัปเดตตำแหน่งสำเร็จ', data: session });
});

export const sendUpdate = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const session = await locationSharingService.sendLocationUpdate(req.params.sessionId, authReq.user!.sub);
  res.status(200).json({ success: true, message: 'ส่งตำแหน่งสำเร็จ', data: session });
});

export const stopSharing = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const session = await locationSharingService.stopSession(req.params.sessionId, authReq.user!.sub);
  res.status(200).json({ success: true, message: 'หยุดการแจ้งตำแหน่งสำเร็จ', data: session });
});

export const getActiveSession = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const session = await locationSharingService.getActiveSession(authReq.user!.sub);
  res.status(200).json({ success: true, data: session });
});

export const getSessionById = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const session = await locationSharingService.getSessionById(req.params.sessionId, authReq.user!.sub);
  res.status(200).json({ success: true, data: session });
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const sessions = await locationSharingService.getSessionHistory(authReq.user!.sub);
  res.status(200).json({ success: true, data: sessions });
});
