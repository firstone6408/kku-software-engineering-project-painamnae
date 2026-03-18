import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import * as emergencyContactService from '../services/emergencyContact.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { createEmergencyContactSchema, updateEmergencyContactSchema } from '../validations/emergencyContact.validation';
import { zodValidateThrow } from '../utils/zod';

export const createContact = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = createEmergencyContactSchema.safeParse(req.body);
  if (!parsed.success) zodValidateThrow(parsed);

  const contact = await emergencyContactService.createContact(authReq.user!.sub, parsed.data!);
  res.status(201).json({ success: true, message: 'สร้างผู้ติดต่อฉุกเฉินสำเร็จ', data: contact });
});

export const getMyContacts = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const contacts = await emergencyContactService.getContactsByUserId(authReq.user!.sub);
  res.status(200).json({ success: true, message: 'ดึงรายชื่อผู้ติดต่อฉุกเฉินสำเร็จ', data: contacts });
});

export const getContactById = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const contact = await emergencyContactService.getContactById(req.params.id, authReq.user!.sub);
  res.status(200).json({ success: true, message: 'ดึงผู้ติดต่อฉุกเฉินสำเร็จ', data: contact });
});

export const updateContact = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = updateEmergencyContactSchema.safeParse(req.body);
  if (!parsed.success) zodValidateThrow(parsed);

  const contact = await emergencyContactService.updateContact(req.params.id, authReq.user!.sub, parsed.data!);
  res.status(200).json({ success: true, message: 'แก้ไขผู้ติดต่อฉุกเฉินสำเร็จ', data: contact });
});

export const deleteContact = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  await emergencyContactService.deleteContact(req.params.id, authReq.user!.sub);
  res.status(200).json({ success: true, message: 'ลบผู้ติดต่อฉุกเฉินสำเร็จ' });
});
