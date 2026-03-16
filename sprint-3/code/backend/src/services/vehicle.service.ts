import prisma from '../utils/prisma';
import ApiError from '../utils/ApiError';
import { Prisma, Vehicle } from '@prisma/client';

interface VehicleFilterOpts {
  q?: string;
  vehicleType?: string;
  color?: string;
  isDefault?: boolean;
  seatMin?: number;
  seatMax?: number;
  amenitiesAny?: string[];
  amenitiesAll?: string[];
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResult<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const buildVehicleWhere = (opts: Partial<VehicleFilterOpts> = {}): Prisma.VehicleWhereInput => {
  const { q, vehicleType, color, isDefault, seatMin, seatMax, amenitiesAny, amenitiesAll, userId } = opts;

  return {
    ...(userId && { userId }),
    ...(vehicleType && { vehicleType: { contains: vehicleType, mode: 'insensitive' as const } }),
    ...(color && { color: { contains: color, mode: 'insensitive' as const } }),
    ...(typeof isDefault === 'boolean' ? { isDefault } : {}),
    ...(typeof seatMin === 'number' || typeof seatMax === 'number'
      ? {
          seatCapacity: {
            ...(typeof seatMin === 'number' ? { gte: seatMin } : {}),
            ...(typeof seatMax === 'number' ? { lte: seatMax } : {}),
          },
        }
      : {}),
    ...(amenitiesAny && amenitiesAny.length ? { amenities: { hasSome: amenitiesAny } } : {}),
    ...(amenitiesAll && amenitiesAll.length ? { amenities: { hasEvery: amenitiesAll } } : {}),
    ...(q
      ? {
          OR: [
            { vehicleModel: { contains: q, mode: 'insensitive' as const } },
            { vehicleType: { contains: q, mode: 'insensitive' as const } },
            { color: { contains: q, mode: 'insensitive' as const } },
            { licensePlate: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };
};

export const searchMyVehicles = async (ownerId: string, opts?: VehicleFilterOpts): Promise<PaginatedResult<Vehicle>> => {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = opts || {};
  const where = buildVehicleWhere({ ...filters, userId: ownerId });
  const skip = (page - 1) * limit;
  const take = limit;

  const [total, data] = await prisma.$transaction([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip, take }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const searchVehiclesAdmin = async (opts?: VehicleFilterOpts): Promise<PaginatedResult<unknown>> => {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = opts || {};
  const where = buildVehicleWhere(filters);
  const skip = (page - 1) * limit;
  const take = limit;

  const [total, data] = await prisma.$transaction([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getAllVehicles = async (userId: string): Promise<Vehicle[]> => {
  return prisma.vehicle.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
};

export const getVehicleById = async (vehicleId: string, userId: string): Promise<Vehicle> => {
  const v = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!v || v.userId !== userId) throw new ApiError(404, 'Vehicle not found or access denied');
  return v;
};

export const createVehicle = async (data: Prisma.VehicleCreateWithoutUserInput, userId: string): Promise<Vehicle> => {
  if (data.isDefault) {
    await prisma.vehicle.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }
  return prisma.vehicle.create({ data: { ...data, userId } as Prisma.VehicleUncheckedCreateInput });
};

export const updateVehicle = async (vehicleId: string, userId: string, updateData: Prisma.VehicleUpdateInput): Promise<Vehicle> => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.vehicle.findUnique({ where: { id: vehicleId } });
    if (!existing || existing.userId !== userId) throw new ApiError(404, 'Vehicle not found or access denied');

    if (updateData.isDefault === true && !existing.isDefault) {
      await tx.vehicle.updateMany({
        where: { userId, isDefault: true, NOT: { id: vehicleId } },
        data: { isDefault: false },
      });
    }

    return tx.vehicle.update({ where: { id: vehicleId }, data: { ...updateData, userId } as Prisma.VehicleUncheckedUpdateInput });
  });
};

export const deleteVehicle = async (vehicleId: string, userId: string): Promise<{ id: string }> => {
  const existingVehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, userId } });
  if (!existingVehicle) throw new Error('Vehicle not found or access denied');
  await prisma.vehicle.delete({ where: { id: vehicleId } });
  return { id: vehicleId };
};

export const setDefaultVehicle = async (vehicleId: string, userId: string): Promise<Vehicle> => {
  const vehicleToSetDefault = await prisma.vehicle.findFirst({ where: { id: vehicleId, userId } });
  if (!vehicleToSetDefault) throw new Error('Vehicle not found or access denied');
  if (vehicleToSetDefault.isDefault) return vehicleToSetDefault;

  return prisma.$transaction(async (tx) => {
    await tx.vehicle.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    return tx.vehicle.update({ where: { id: vehicleId }, data: { isDefault: true } });
  });
};

export const getVehicleByIdAdmin = async (vehicleId: string) => {
  const v = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, username: true } },
    },
  });
  if (!v) throw new ApiError(404, 'Vehicle not found');
  return v;
};

export const updateVehicleByAdmin = async (vehicleId: string, updateData: Record<string, unknown>) => {
  const existing = await getVehicleByIdAdmin(vehicleId);
  const targetUserId = (updateData.userId as string) ?? existing.userId;

  return prisma.$transaction(async (tx) => {
    if (updateData.isDefault === true) {
      await tx.vehicle.updateMany({
        where: { userId: targetUserId, isDefault: true, NOT: { id: vehicleId } },
        data: { isDefault: false },
      });
    }
    return tx.vehicle.update({
      where: { id: vehicleId },
      data: { ...updateData, userId: targetUserId } as Prisma.VehicleUncheckedUpdateInput,
    });
  });
};

export const deleteVehicleByAdmin = async (vehicleId: string): Promise<{ id: string }> => {
  await getVehicleByIdAdmin(vehicleId);
  await prisma.vehicle.delete({ where: { id: vehicleId } });
  return { id: vehicleId };
};
