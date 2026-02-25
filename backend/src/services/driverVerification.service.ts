import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';

interface SearchVerificationsOpts {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  typeOnLicense?: string;
  createdFrom?: string;
  createdTo?: string;
  issueFrom?: string;
  issueTo?: string;
  expiryFrom?: string;
  expiryTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const searchVerifications = async (opts: SearchVerificationsOpts = {}) => {
  const {
    page = 1, limit = 20, q, status, typeOnLicense,
    createdFrom, createdTo, issueFrom, issueTo, expiryFrom, expiryTo,
    sortBy = 'createdAt', sortOrder = 'desc',
  } = opts;

  const where: Prisma.DriverVerificationWhereInput = {
    ...(status && { status: status as never }),
    ...(typeOnLicense && { typeOnLicense: typeOnLicense as never }),
    ...((createdFrom || createdTo) ? {
      createdAt: {
        ...(createdFrom ? { gte: new Date(createdFrom) } : {}),
        ...(createdTo ? { lte: new Date(createdTo) } : {}),
      },
    } : {}),
    ...((issueFrom || issueTo) ? {
      licenseIssueDate: {
        ...(issueFrom ? { gte: new Date(issueFrom) } : {}),
        ...(issueTo ? { lte: new Date(issueTo) } : {}),
      },
    } : {}),
    ...((expiryFrom || expiryTo) ? {
      licenseExpiryDate: {
        ...(expiryFrom ? { gte: new Date(expiryFrom) } : {}),
        ...(expiryTo ? { lte: new Date(expiryTo) } : {}),
      },
    } : {}),
    ...(q ? {
      OR: [
        { licenseNumber: { contains: q, mode: 'insensitive' as const } },
        { user: { is: { OR: [
          { email: { contains: q, mode: 'insensitive' as const } },
          { username: { contains: q, mode: 'insensitive' as const } },
          { firstName: { contains: q, mode: 'insensitive' as const } },
          { lastName: { contains: q, mode: 'insensitive' as const } },
          { phoneNumber: { contains: q, mode: 'insensitive' as const } },
        ] } } },
      ],
    } : {}),
  };

  const skip = (page - 1) * limit;
  const take = limit;

  const [total, data] = await prisma.$transaction([
    prisma.driverVerification.count({ where }),
    prisma.driverVerification.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip, take,
      include: {
        user: {
          select: {
            id: true, email: true, username: true,
            firstName: true, lastName: true, phoneNumber: true,
            role: true, isVerified: true, isActive: true,
          },
        },
      },
    }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getVerificationByUser = async (userId: string) => {
  return prisma.driverVerification.findUnique({ where: { userId }, include: { user: true } });
};

export const getAllVerifications = async () => {
  return prisma.driverVerification.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
};

export const getVerificationById = async (id: string) => {
  return prisma.driverVerification.findUnique({ where: { id }, include: { user: true } });
};

export const createVerification = async (data: Prisma.DriverVerificationUncheckedCreateInput) => {
  const existing = await getVerificationByUser(data.userId);
  if (existing) return updateVerification(existing.id, data);

  return prisma.$transaction(async (tx) => {
    const newRec = await tx.driverVerification.create({ data });
    await tx.user.update({ where: { id: data.userId }, data: { role: 'DRIVER' } });
    return newRec;
  });
};

export const updateVerification = async (id: string, data: Prisma.DriverVerificationUncheckedUpdateInput) => {
  const updatePayload = { ...data, status: 'PENDING' as const };
  return prisma.driverVerification.update({ where: { id }, data: updatePayload });
};

export const updateVerificationByAdmin = async (id: string, data: Prisma.DriverVerificationUncheckedUpdateInput) => {
  return prisma.driverVerification.update({ where: { id }, data, include: { user: true } });
};

export const deleteVerificationByAdmin = async (id: string) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.driverVerification.findUnique({ where: { id } });
    if (!existing) return null;

    await tx.user.update({
      where: { id: existing.userId },
      data: { role: 'PASSENGER', isVerified: false },
    });
    await tx.route.updateMany({
      where: { driverId: existing.userId, status: 'AVAILABLE' },
      data: { status: 'CANCELLED' },
    });
    await tx.driverVerification.delete({ where: { id } });
    return true;
  });
};

export const updateVerificationStatus = async (id: string, status: string) => {
  return prisma.$transaction(async (tx) => {
    const verification = await tx.driverVerification.update({
      where: { id },
      data: { status: status as never },
    });
    if (status === 'APPROVED') {
      await tx.user.update({
        where: { id: verification.userId },
        data: { isVerified: true, role: 'DRIVER' },
      });
    } else if (status === 'REJECTED') {
      await tx.user.update({
        where: { id: verification.userId },
        data: { role: 'PASSENGER', isVerified: false },
      });
      await tx.route.updateMany({
        where: { driverId: verification.userId, status: 'AVAILABLE' },
        data: { status: 'CANCELLED' },
      });
    }
    return verification;
  });
};

export const canCreateRoutes = async (userId: string): Promise<boolean> => {
  const rec = await prisma.driverVerification.findUnique({
    where: { userId },
    select: { status: true },
  });
  return rec?.status === 'APPROVED' || rec?.status === 'PENDING';
};

export const createVerificationByAdmin = async (data: Prisma.DriverVerificationUncheckedCreateInput) => {
  const existing = await getVerificationByUser(data.userId);
  if (existing) return updateVerificationByAdmin(existing.id, data);

  return prisma.$transaction(async (tx) => {
    const newRec = await tx.driverVerification.create({ data });
    await tx.user.update({ where: { id: data.userId }, data: { role: 'DRIVER' } });
    return newRec;
  });
};
