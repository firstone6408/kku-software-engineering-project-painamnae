import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import * as notifService from '../services/notification.service';
import { AuthenticatedRequest } from '../middlewares/auth';

export const listMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const result = await notifService.listMyNotifications(authReq.user!.sub, req.query as Record<string, unknown>);
  res.status(200).json({ success: true, message: 'Notifications retrieved successfully', ...result });
});

export const getMyNotificationById = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const data = await notifService.getMyNotificationById(req.params.id, authReq.user!.sub);
  res.status(200).json({ success: true, message: 'Notification retrieved successfully', data });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const data = await notifService.markRead(req.params.id, authReq.user!.sub);
  res.status(200).json({ success: true, message: 'Notification marked as read', data });
});

export const adminMarkRead = asyncHandler(async (req: Request, res: Response) => {
  const data = await notifService.adminMarkRead(req.params.id);
  res.status(200).json({ success: true, message: 'Notification marked as read', data });
});

export const markUnread = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const data = await notifService.markUnread(req.params.id, authReq.user!.sub);
  res.status(200).json({ success: true, message: 'Notification marked as unread', data });
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const data = await notifService.markAllRead(authReq.user!.sub);
  res.status(200).json({ success: true, message: 'All notifications marked as read', data });
});

export const deleteMyNotification = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const data = await notifService.deleteMyNotification(req.params.id, authReq.user!.sub);
  res.status(200).json({ success: true, message: 'Notification deleted successfully', data });
});

export const countUnread = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const data = await notifService.countUnread(authReq.user!.sub);
  res.status(200).json({ success: true, message: 'Unread count retrieved successfully', data });
});

export const adminListNotifications = asyncHandler(async (req: Request, res: Response) => {
  const result = await notifService.listNotificationsAdmin(req.query as Record<string, unknown>);
  res.status(200).json({ success: true, message: 'Notifications (admin) retrieved successfully', ...result });
});

export const adminCreateNotification = asyncHandler(async (req: Request, res: Response) => {
  const created = await notifService.createNotificationByAdmin(req.body);
  res.status(201).json({ success: true, message: 'Notification (admin) created successfully', data: created });
});

export const adminDeleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const data = await notifService.deleteNotificationByAdmin(req.params.id);
  res.status(200).json({ success: true, message: 'Notification (admin) deleted successfully', data });
});
