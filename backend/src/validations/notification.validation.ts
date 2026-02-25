import { z } from 'zod';
import { NotificationType } from '@prisma/client';

// ใช้ร่วมกัน
export const idParamSchema = z.object({
  id: z.string().cuid({ message: 'Invalid notification ID format' }),
});

const parseBooleanQuery = z.preprocess((v) => {
  if (v === undefined) return undefined;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const s = v.toLowerCase();
    if (s === 'true' || s === '1') return true;
    if (s === 'false' || s === '0') return false;
  }
  return v; // ให้ z.boolean() จับ error ต่อถ้าไม่แมตช์
}, z.boolean().optional());

const urlOrPath = z.string().refine((v) => {
  if (!v) return false;
  try {
    // ถ้าเป็น URL เต็ม เช่น http(s)://... → ผ่าน
    new URL(v);
    return true;
  } catch {
    // ถ้าไม่ใช่ URL เต็ม ให้ยอมรับกรณีขึ้นต้นด้วย '/'
    return v.startsWith('/');
  }
}, { message: 'link must be an absolute URL or a leading-slash path' });

// ========= User: list =========
export const listMyNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  q: z.string().trim().min(1).optional(),
  type: z.nativeEnum(NotificationType).optional(),
  read: parseBooleanQuery,

  createdFrom: z.string().refine(v => !v || !isNaN(Date.parse(v)), { message: 'Invalid createdFrom' }).optional(),
  createdTo: z.string().refine(v => !v || !isNaN(Date.parse(v)), { message: 'Invalid createdTo' }).optional(),

  sortBy: z.enum(['createdAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ========= Admin: list =========
export const listNotificationsAdminQuerySchema = listMyNotificationsQuerySchema.extend({
  userId: z.string().cuid().optional(),
  adminReviewed: parseBooleanQuery.optional(),
});

// ========= Admin: create =========
export const createNotificationAdminSchema = z.object({
  userId: z.string().cuid({ message: 'userId must be a CUID' }),
  type: z.nativeEnum(NotificationType).default('SYSTEM').optional(),
  title: z.string().min(1, 'title is required'),
  body: z.string().min(1, 'body is required'),
  link: urlOrPath.optional(),
  metadata: z.any().optional(),
});

export type CreateNotificationAdminInput = z.infer<typeof createNotificationAdminSchema>;
