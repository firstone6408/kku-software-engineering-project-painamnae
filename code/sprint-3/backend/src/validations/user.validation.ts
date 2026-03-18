import { z } from 'zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(6, 'username is require'),
  password: z.string().min(8, 'password must be at least 8 characters'),
  firstName: z.string().min(1, 'firstname is require'),
  lastName: z.string().min(1, 'lastname is require'),
  phoneNumber: z.string().min(10, 'phoneNumber is require'),
  gender: z.string().min(1, 'gender is require'),
  nationalIdNumber: z.string().length(13, 'nationalIdNumber must be 13 digits'),
  nationalIdExpiryDate: z.string().datetime({ message: 'Invalid date format for nationalIdExpiryDate' }),
  role: z.nativeEnum(Role).optional(),
});

export const idParamSchema = z.object({
  id: z.string().cuid({ message: 'Invalid CUID format' }),
});

export const updateMyProfileSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  username: z.string().min(6, 'username is require').optional(),
  firstName: z.string().min(1, 'firstname is require').optional(),
  lastName: z.string().min(1, 'lastname is require').optional(),
  phoneNumber: z.string().min(10, 'phoneNumber is require').optional(),
  gender: z.string().min(1, 'gender is require').optional(),
});

export const updateUserByAdminSchema = updateMyProfileSchema.extend({
  role: z.nativeEnum(Role).optional(),
  isVerified: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean({
    invalid_type_error: 'isActive must be a boolean',
  }).optional(),
  isVerified: z.boolean({
    invalid_type_error: 'isActive must be a boolean',
  }).optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  q: z.string().trim().min(1).optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.coerce.boolean().optional(),
  isVerified: z.coerce.boolean().optional(),

  createdFrom: z.string().refine(v => !isNaN(Date.parse(v)), { message: 'Invalid createdFrom' }).optional(),
  createdTo: z.string().refine(v => !isNaN(Date.parse(v)), { message: 'Invalid createdTo' }).optional(),

  sortBy: z.enum(['createdAt', 'lastLogin', 'email', 'username', 'firstName', 'lastName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateMyProfileInput = z.infer<typeof updateMyProfileSchema>;
export type UpdateUserByAdminInput = z.infer<typeof updateUserByAdminSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
