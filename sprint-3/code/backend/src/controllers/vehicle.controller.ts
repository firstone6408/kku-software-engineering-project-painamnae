import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import * as vehicleService from '../services/vehicle.service';
import * as userService from '../services/user.service';
import ApiError from '../utils/ApiError';
import { uploadToCloudinary } from '../utils/cloudinary';
import { AuthenticatedRequest } from '../middlewares/auth';

interface MulterFiles {
  [fieldname: string]: Express.Multer.File[];
}

export const listMyVehicles = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const result = await vehicleService.searchMyVehicles(authReq.user!.sub, req.query as Record<string, unknown>);
  res.status(200).json({ success: true, message: 'Vehicles retrieved successfully.', ...result });
});

export const getVehicles = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const list = await vehicleService.getAllVehicles(authReq.user!.sub);
  res.status(200).json({ success: true, message: 'Vehicles retrieved successfully.', data: list });
});

export const getVehicleById = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const vehicle = await vehicleService.getVehicleById(req.params.id, authReq.user!.sub);
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');
  res.status(200).json({ success: true, message: 'Vehicle retrieved successfully.', data: vehicle });
});

export const getVehicleByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await vehicleService.getVehicleByIdAdmin(req.params.id);
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');
  res.status(200).json({ success: true, message: 'Vehicle retrieved successfully.', data: vehicle });
});

export const createVehicle = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const payload: Record<string, unknown> = { ...req.body };
  const files = req.files as MulterFiles | undefined;

  if (files?.photos) {
    const uploads = await Promise.all(files.photos.map((file) => uploadToCloudinary(file.buffer, 'painamnae/vehicles')));
    payload.photos = uploads.map((u) => u.url);
  }

  const newVehicle = await vehicleService.createVehicle(payload as never, authReq.user!.sub);
  res.status(201).json({ success: true, message: 'Vehicle created successfully.', data: newVehicle });
});

export const updateVehicle = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const payload: Record<string, unknown> = { ...req.body };
  const files = req.files as MulterFiles | undefined;

  if (files?.photos) {
    const uploads = await Promise.all(files.photos.map((file) => uploadToCloudinary(file.buffer, 'painamnae/vehicles')));
    payload.photos = uploads.map((u) => u.url);
  }

  const updated = await vehicleService.updateVehicle(req.params.id, authReq.user!.sub, payload as never);
  res.status(200).json({ success: true, message: 'Vehicle updated successfully.', data: updated });
});

export const deleteVehicle = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const result = await vehicleService.deleteVehicle(req.params.id, authReq.user!.sub);
  res.status(200).json({ success: true, message: 'Vehicle deleted successfully.', data: result });
});

export const setDefaultVehicle = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const result = await vehicleService.setDefaultVehicle(req.params.id, authReq.user!.sub);
  res.status(200).json({ success: true, message: 'Vehicle set Default successfully.', data: result });
});

export const adminListVehicles = asyncHandler(async (req: Request, res: Response) => {
  const result = await vehicleService.searchVehiclesAdmin(req.query as Record<string, unknown>);
  res.status(200).json({ success: true, message: 'Vehicles (admin) retrieved successfully.', ...result });
});

export const adminListVehiclesByUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await vehicleService.searchVehiclesAdmin({ ...(req.query as Record<string, unknown>), userId: req.params.userId });
  res.status(200).json({ success: true, message: "User's vehicles (admin) retrieved successfully.", ...result });
});

export const adminCreateVehicle = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const payload: Record<string, unknown> = { ...req.body };
  const files = req.files as MulterFiles | undefined;

  await userService.getUserById(userId);

  if (files?.photos) {
    const uploads = await Promise.all(files.photos.map((file) => uploadToCloudinary(file.buffer, 'painamnae/vehicles')));
    payload.photos = uploads.map((u) => u.url);
  }

  const newVehicle = await vehicleService.createVehicle(payload as never, userId);
  res.status(201).json({ success: true, message: 'Vehicle created successfully.', data: newVehicle });
});

export const adminUpdateVehicle = asyncHandler(async (req: Request, res: Response) => {
  const payload: Record<string, unknown> = { ...req.body };
  const files = req.files as MulterFiles | undefined;

  if (payload.userId) await userService.getUserById(payload.userId as string);

  if (files?.photos) {
    const uploads = await Promise.all(files.photos.map((file) => uploadToCloudinary(file.buffer, 'painamnae/vehicles')));
    payload.photos = uploads.map((u) => u.url);
  }

  const updated = await vehicleService.updateVehicleByAdmin(req.params.id, payload);
  res.status(200).json({ success: true, message: 'Vehicle (by admin) updated successfully.', data: updated });
});

export const adminDeleteVehicle = asyncHandler(async (req: Request, res: Response) => {
  const result = await vehicleService.deleteVehicleByAdmin(req.params.id);
  res.status(200).json({ success: true, message: 'Vehicle (by admin) deleted successfully.', data: result });
});
