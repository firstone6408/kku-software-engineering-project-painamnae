import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

export const createBookingSchema = z.object({
  routeId: z.string().cuid({ message: 'Invalid route ID format' }),
  numberOfSeats: z.number().int().min(1, 'At least 1 seat must be booked'),
  pickupLocation: z.any(),
  dropoffLocation: z.any(),
});

export const idParamSchema = z.object({
  id: z.string().cuid({ message: 'Invalid booking ID format' }),
});

export const updateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus, {
    required_error: 'Status is required',
    invalid_type_error: 'Invalid status value',
  }),
});

export const listBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  q: z.string().trim().min(1).optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  routeId: z.string().cuid().optional(),
  passengerId: z.string().cuid().optional(),
  driverId: z.string().cuid().optional(),

  createdFrom: z.string().refine(v => !isNaN(Date.parse(v)), { message: 'Invalid createdFrom' }).optional(),
  createdTo: z.string().refine(v => !isNaN(Date.parse(v)), { message: 'Invalid createdTo' }).optional(),
  routeDepartureFrom: z.string().refine(v => !isNaN(Date.parse(v)), { message: 'Invalid routeDepartureFrom' }).optional(),
  routeDepartureTo: z.string().refine(v => !isNaN(Date.parse(v)), { message: 'Invalid routeDepartureTo' }).optional(),

  sortBy: z.enum(['createdAt', 'status', 'numberOfSeats']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createBookingByAdminSchema = createBookingSchema.extend({
  passengerId: z.string().cuid({ message: 'Invalid passenger ID format' }),
});

export const updateBookingByAdminSchema = z.object({
  routeId: z.string().cuid().optional(),
  passengerId: z.string().cuid().optional(),
  numberOfSeats: z.number().int().min(1).optional(),
  pickupLocation: z.any().optional(),
  dropoffLocation: z.any().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
}).refine(obj => Object.keys(obj).length > 0, { message: 'No fields to update' });

export const cancelBookingSchema = z.object({
  reason: z.enum([
    'CHANGE_OF_PLAN',
    'FOUND_ALTERNATIVE',
    'DRIVER_DELAY',
    'PRICE_ISSUE',
    'WRONG_LOCATION',
    'DUPLICATE_OR_WRONG_DATE',
    'SAFETY_CONCERN',
    'WEATHER_OR_FORCE_MAJEURE',
    'COMMUNICATION_ISSUE',
  ], { required_error: 'กรุณาเลือกเหตุผลในการยกเลิก' }),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
