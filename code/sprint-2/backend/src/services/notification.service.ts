import prisma from '../utils/prisma';
import ApiError from '../utils/ApiError';
import { Prisma } from '@prisma/client';

const baseSelect = {
  id: true,
  userId: true,
  type: true,
  title: true,
  body: true,
  link: true,
  metadata: true,
  readAt: true,
  adminReviewedAt: true,
  createdAt: true,
} as const;

interface NotificationFilterOpts {
  q?: string;
  type?: string;
  read?: boolean;
  createdFrom?: string;
  createdTo?: string;
  userId?: string;
  adminReviewed?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const buildWhere = (opts: Partial<NotificationFilterOpts> = {}): Prisma.NotificationWhereInput => {
  const { q, type, read, createdFrom, createdTo, userId, adminReviewed } = opts;

  return {
    ...(userId && { userId }),
    ...(type && { type: type as never }),
    ...(typeof read === 'boolean'
      ? (read ? { readAt: { not: null } } : { readAt: null })
      : {}),
    ...(typeof adminReviewed === 'boolean'
      ? (adminReviewed ? { adminReviewedAt: { not: null } } : { adminReviewedAt: null })
      : {}),
    ...((createdFrom || createdTo) ? {
      createdAt: {
        ...(createdFrom ? { gte: new Date(createdFrom) } : {}),
        ...(createdTo ? { lte: new Date(createdTo) } : {}),
      },
    } : {}),
    ...(q ? {
      OR: [
        { title: { contains: q, mode: 'insensitive' as const } },
        { body: { contains: q, mode: 'insensitive' as const } },
      ],
    } : {}),
  };
};

export const listMyNotifications = async (ownerId: string, opts: NotificationFilterOpts = {}) => {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = opts;
  const where = buildWhere({ ...filters, userId: ownerId });
  const skip = (page - 1) * limit;
  const take = limit;

  const [total, data] = await prisma.$transaction([
    prisma.notification.count({ where }),
    prisma.notification.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip, take, select: baseSelect }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const listNotificationsAdmin = async (opts: NotificationFilterOpts = {}) => {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = opts;
  const where = buildWhere(filters);
  const skip = (page - 1) * limit;
  const take = limit;

  const [total, data] = await prisma.$transaction([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip, take,
      select: {
        ...baseSelect,
        user: { select: { id: true, email: true, username: true, firstName: true, lastName: true } },
      },
    }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getMyNotificationById = async (id: string, ownerId: string) => {
  const n = await prisma.notification.findUnique({ where: { id }, select: baseSelect });
  if (!n || n.userId !== ownerId) throw new ApiError(404, 'Notification not found');
  return n;
};

export const createNotificationByAdmin = async (payload: Prisma.NotificationUncheckedCreateInput) => {
  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true } });
  if (!user) throw new ApiError(404, 'User not found');
  return prisma.notification.create({ data: payload, select: baseSelect });
};

export const markRead = async (id: string, ownerId: string) => {
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n || n.userId !== ownerId) throw new ApiError(404, 'Notification not found');
  return prisma.notification.update({ where: { id }, data: { readAt: new Date() }, select: baseSelect });
};

export const markUnread = async (id: string, ownerId: string) => {
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n || n.userId !== ownerId) throw new ApiError(404, 'Notification not found');
  return prisma.notification.update({ where: { id }, data: { readAt: null }, select: baseSelect });
};

export const adminMarkRead = async (id: string) => {
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n) throw new ApiError(404, 'Notification not found');
  return prisma.notification.update({ where: { id }, data: { adminReviewedAt: new Date() }, select: baseSelect });
};

export const markAllRead = async (ownerId: string) => {
  const result = await prisma.notification.updateMany({
    where: { userId: ownerId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updated: result.count };
};

export const deleteMyNotification = async (id: string, ownerId: string) => {
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n || n.userId !== ownerId) throw new ApiError(404, 'Notification not found');
  await prisma.notification.delete({ where: { id } });
  return { id };
};

export const deleteNotificationByAdmin = async (id: string) => {
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n) throw new ApiError(404, 'Notification not found');
  await prisma.notification.delete({ where: { id } });
  return { id };
};

export const countUnread = async (ownerId: string) => {
  const total = await prisma.notification.count({ where: { userId: ownerId, readAt: null } });
  return { unread: total };
};
