import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import * as bookingService from '../services/booking.service';
import ApiError from '../utils/ApiError';
import { AuthenticatedRequest } from '../middlewares/auth';

export const adminListBookings = asyncHandler(async (req: Request, res: Response) => {
  const result = await bookingService.searchBookingsAdmin(req.query as Record<string, unknown>);
  res.status(200).json({ success: true, message: 'Bookings (admin) retrieved', ...result });
});

export const adminCreateBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingService.adminCreateBooking(req.body);
  res.status(201).json({ success: true, data: booking });
});

export const adminUpdateBooking = asyncHandler(async (req: Request, res: Response) => {
  const updated = await bookingService.adminUpdateBooking(req.params.id, req.body);
  res.status(200).json({ success: true, data: updated });
});

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const payload = {
    routeId: req.body.routeId,
    numberOfSeats: req.body.numberOfSeats,
    pickupLocation: req.body.pickupLocation,
    dropoffLocation: req.body.dropoffLocation,
  };
  const booking = await bookingService.createBooking(payload, authReq.user!.sub);
  res.status(201).json({ success: true, data: booking });
});

export const getMyBookings = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const list = await bookingService.getMyBookings(authReq.user!.sub);
  res.status(200).json({ success: true, data: list });
});

export const adminGetBookingById = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingService.getBookingById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  res.status(200).json({ success: true, data: booking });
});

export const getBookingById = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const booking = await bookingService.getBookingById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');

  if (booking.passengerId !== authReq.user!.sub && booking.route.driverId !== authReq.user!.sub) {
    throw new ApiError(403, 'Forbidden');
  }
  res.status(200).json({ success: true, data: booking });
});

export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const updated = await bookingService.updateBookingStatus(req.params.id, req.body.status, authReq.user!.sub);
  res.status(200).json({ success: true, data: updated });
});

export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const cancelled = await bookingService.cancelBooking(req.params.id, authReq.user!.sub, { reason: req.body.reason });
  res.status(200).json({ success: true, data: cancelled });
});

export const deleteBooking = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const deleted = await bookingService.deleteBooking(req.params.id, authReq.user!.sub);
  res.status(200).json({ success: true, data: deleted });
});

export const adminDeleteBooking = asyncHandler(async (req: Request, res: Response) => {
  const result = await bookingService.adminDeleteBooking(req.params.id);
  res.status(200).json({ success: true, data: result });
});
