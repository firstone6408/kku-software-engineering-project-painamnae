import { z } from 'zod';
import { PassengerReportReason, DriverIncidentReason } from '@prisma/client';

export const createDriverReportSchema = z.object({
  bookingId: z.string().cuid(),
  driverReasons: z.preprocess(
    (val) => (typeof val === 'string' ? JSON.parse(val as string) : val),
    z.array(z.nativeEnum(DriverIncidentReason)).min(1, 'กรุณาเลือกเหตุผลอย่างน้อย 1 ข้อ')
  ),
  otherReasonText: z.string().optional(),
});

export const createPassengerReportSchema = z.object({
  reportedUserId: z.string().cuid(),
  bookingId: z.string().cuid(),
  passengerReasons: z.preprocess(
    (val) => (typeof val === 'string' ? JSON.parse(val as string) : val),
    z.array(z.nativeEnum(PassengerReportReason)).min(1, 'กรุณาเลือกเหตุผลอย่างน้อย 1 ข้อ')
  ),
  otherReasonText: z.string().optional(),
});

export const updateReportSchema = z.object({
  reasons: z.preprocess(
    (val) => (typeof val === 'string' ? JSON.parse(val as string) : val),
    z.array(z.string()).min(1, 'กรุณาเลือกเหตุผลอย่างน้อย 1 ข้อ')
  ),
  otherReasonText: z.string().optional(),
  keepMediaIds: z.preprocess(
    (val) => (typeof val === 'string' ? JSON.parse(val as string) : val),
    z.array(z.string().cuid()).optional()
  ),
});

export type CreateDriverReportInput = z.infer<typeof createDriverReportSchema>;
export type CreatePassengerReportInput = z.infer<typeof createPassengerReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
