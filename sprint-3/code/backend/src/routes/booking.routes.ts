import { Router } from 'express';
import validate from '../middlewares/validate';
import { protect, requireAdmin } from '../middlewares/auth';
import requireDriverVerified from '../middlewares/driverVerified';
import * as bookingController from '../controllers/booking.controller';
import {
  createBookingSchema,
  idParamSchema,
  updateBookingStatusSchema,
  listBookingsQuerySchema,
  createBookingByAdminSchema,
  updateBookingByAdminSchema,
  cancelBookingSchema,
} from '../validations/booking.validation';
import { requirePassengerNotSuspended } from '../middlewares/suspension';

const router = Router();

// --- Admin ---
router.get('/admin', protect, requireAdmin, validate({ query: listBookingsQuerySchema }), bookingController.adminListBookings);
router.get('/admin/:id', protect, requireAdmin, validate({ params: idParamSchema }), bookingController.adminGetBookingById);
router.post('/admin', protect, requireAdmin, validate({ body: createBookingByAdminSchema }), bookingController.adminCreateBooking);
router.put('/admin/:id', protect, requireAdmin, validate({ params: idParamSchema, body: updateBookingByAdminSchema }), bookingController.adminUpdateBooking);
router.delete('/admin/:id', protect, requireAdmin, validate({ params: idParamSchema }), bookingController.adminDeleteBooking);

// --- Public ---
router.get('/me', protect, bookingController.getMyBookings);
router.get('/:id', protect, validate({ params: idParamSchema }), bookingController.getBookingById);
router.post('/', protect, requirePassengerNotSuspended, validate({ body: createBookingSchema }), bookingController.createBooking);
router.patch('/:id/status', protect, requireDriverVerified, validate({ params: idParamSchema, body: updateBookingStatusSchema }), bookingController.updateBookingStatus);
router.patch('/:id/cancel', protect, validate({ params: idParamSchema, body: cancelBookingSchema }), bookingController.cancelBooking);
router.delete('/:id', protect, validate({ params: idParamSchema }), bookingController.deleteBooking);

export default router;
