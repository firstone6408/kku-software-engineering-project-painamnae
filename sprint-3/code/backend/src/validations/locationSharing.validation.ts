import { z } from 'zod';

const VALID_DURATIONS = [5, 10, 15, 30, 45] as const;

export const startSharingSchema = z.object({
  contactIds: z.array(z.string().cuid()).min(1, 'กรุณาเลือกผู้ติดต่ออย่างน้อย 1 คน'),
  durationMinutes: z.number().refine(
    (val) => VALID_DURATIONS.includes(val as typeof VALID_DURATIONS[number]),
    { message: 'ระยะเวลาต้องเป็น 5, 10, 15, 30 หรือ 45 นาที' }
  ),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type StartSharingInput = z.infer<typeof startSharingSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
