import { z } from 'zod';

export const createEmergencyContactSchema = z.object({
  name: z.string().min(1, 'กรุณาใส่ชื่อผู้ติดต่อ'),
  relationship: z.string().min(1, 'กรุณาใส่ความสัมพันธ์'),
  phoneNumber: z.string().min(1, 'กรุณาใส่เบอร์โทรศัพท์'),
  email: z.string().email('กรุณาใส่อีเมลที่ถูกต้อง'),
});

export const updateEmergencyContactSchema = z.object({
  name: z.string().min(1, 'กรุณาใส่ชื่อผู้ติดต่อ').optional(),
  relationship: z.string().min(1, 'กรุณาใส่ความสัมพันธ์').optional(),
  phoneNumber: z.string().min(1, 'กรุณาใส่เบอร์โทรศัพท์').optional(),
  email: z.string().email('กรุณาใส่อีเมลที่ถูกต้อง').optional(),
});

export type CreateEmergencyContactInput = z.infer<typeof createEmergencyContactSchema>;
export type UpdateEmergencyContactInput = z.infer<typeof updateEmergencyContactSchema>;
