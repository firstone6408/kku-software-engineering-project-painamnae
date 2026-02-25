import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import * as reportService from '../services/report.service';
import { uploadToCloudinary } from '../utils/cloudinary';
import { AuthenticatedRequest } from '../middlewares/auth';

interface ReportMediaItem {
  url: string;
  publicId: string;
  type: string;
}

async function uploadReportMedia(files: Express.Multer.File[] | undefined): Promise<ReportMediaItem[]> {
  if (!files || files.length === 0) return [];

  const results = await Promise.all(
    files.map((file) => uploadToCloudinary(file.buffer, 'painamnae/reports'))
  );

  return results.map((r, i) => ({
    url: r.url,
    publicId: r.public_id,
    type: files[i].mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE',
  }));
}

export const createDriverReport = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const mediaItems = await uploadReportMedia(req.files as Express.Multer.File[] | undefined);
  const createdReport = await reportService.createDriverReport(authReq.user!.sub, req.body, mediaItems);
  res.status(201).json({ success: true, message: 'Report created successfully', data: createdReport });
});

export const createPassengerReport = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const mediaItems = await uploadReportMedia(req.files as Express.Multer.File[] | undefined);
  const createdReport = await reportService.createPassengerReport(authReq.user!.sub, req.body, mediaItems);
  res.status(201).json({ success: true, message: 'Report created successfully', data: createdReport });
});

export const updateReport = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const mediaItems = await uploadReportMedia(req.files as Express.Multer.File[] | undefined);
  const updatedReport = await reportService.updateReport(req.params.id, authReq.user!.sub, req.body, mediaItems);
  res.status(200).json({ success: true, message: 'Report updated successfully', data: updatedReport });
});

export const getReportByUserId = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const reports = await reportService.getReportsByUserId(authReq.user!.sub);
  res.status(200).json({ success: true, message: 'Reports retrieved successfully', data: reports });
});

export const resolveReport = asyncHandler(async (req: Request, res: Response) => {
  const resolved = await reportService.resolveReport(req.params.id);
  res.status(200).json({ success: true, message: 'Report resolved successfully', data: resolved });
});
