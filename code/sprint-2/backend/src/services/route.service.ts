import prisma from '../utils/prisma';
import { Prisma, RouteStatus, BookingStatus, CancelReason } from '@prisma/client';
import ApiError from '../utils/ApiError';
import { checkAndApplyDriverSuspension } from './penalty.service';

const baseInclude = {
  driver: {
    select: { id: true, firstName: true, lastName: true, gender: true, profilePicture: true, isVerified: true },
  },
  vehicle: {
    select: { vehicleModel: true, vehicleType: true, photos: true, amenities: true },
  },
} as const;

interface SearchRoutesOpts {
  page?: number;
  limit?: number;
  q?: string;
  status?: RouteStatus;
  driverId?: string;
  vehicleId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  seatsRequired?: number;
  startNearLat?: number;
  startNearLng?: number;
  endNearLat?: number;
  endNearLng?: number;
  radiusMeters?: number;
}

export const getAllRoutes = async () => {
  return prisma.route.findMany({ include: baseInclude, orderBy: { createdAt: 'desc' } });
};

export const searchRoutes = async (opts?: SearchRoutesOpts) => {
  const { startNearLat, startNearLng, endNearLat, endNearLng } = opts || {};
  const hasStart = typeof startNearLat === 'number' && typeof startNearLng === 'number';
  const hasEnd = typeof endNearLat === 'number' && typeof endNearLng === 'number';

  if (hasStart || hasEnd) return searchRoutesByEndpointProximity(opts!);

  const {
    page = 1, limit = 20, q, status, driverId, vehicleId,
    dateFrom, dateTo, sortBy = 'createdAt', sortOrder = 'desc', seatsRequired,
  } = opts || {};

  const where: Prisma.RouteWhereInput = {
    ...(status && { status }),
    ...(driverId && { driverId }),
    ...(vehicleId && { vehicleId }),
    ...(dateFrom || dateTo ? {
      departureTime: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      },
    } : {}),
    ...(typeof seatsRequired === 'number' ? { availableSeats: seatsRequired } : {}),
    ...(q ? {
      OR: [
        { routeSummary: { contains: q, mode: 'insensitive' as const } },
        { conditions: { contains: q, mode: 'insensitive' as const } },
        { driver: { is: { OR: [
          { firstName: { contains: q, mode: 'insensitive' as const } },
          { lastName: { contains: q, mode: 'insensitive' as const } },
        ] } } },
        { vehicle: { is: { OR: [
          { vehicleModel: { contains: q, mode: 'insensitive' as const } },
          { vehicleType: { contains: q, mode: 'insensitive' as const } },
          { licensePlate: { contains: q, mode: 'insensitive' as const } },
        ] } } },
      ],
    } : {}),
  };

  const skip = (page - 1) * limit;
  const take = limit;

  const [total, data] = await prisma.$transaction([
    prisma.route.count({ where }),
    prisma.route.findMany({ where, include: baseInclude, orderBy: { [sortBy]: sortOrder }, skip, take }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const searchRoutesByEndpointProximity = async (opts: SearchRoutesOpts) => {
  const {
    page = 1, limit = 20,
    startNearLat, startNearLng, endNearLat, endNearLng,
    radiusMeters = 500, sortBy = 'createdAt', sortOrder = 'desc',
  } = opts;

  const offset = (page - 1) * limit;
  const allowedSortFields = ['createdAt', 'departureTime', 'pricePerSeat', 'availableSeats'];
  const sortField = allowedSortFields.includes(sortBy!) ? sortBy! : 'createdAt';
  const sortDir = (sortOrder || '').toLowerCase() === 'asc' ? 'asc' : 'desc';

  const sLat = startNearLat ?? null;
  const sLng = startNearLng ?? null;
  const eLat = endNearLat ?? null;
  const eLng = endNearLng ?? null;

  const idsRows = await prisma.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`
      WITH params AS (
        SELECT
          ${sLat}::float AS s_lat, ${sLng}::float AS s_lng,
          ${eLat}::float AS e_lat, ${eLng}::float AS e_lng,
          ${radiusMeters}::int AS rad
      )
      SELECT r.id FROM "Route" r, params p
      WHERE
        (p.s_lat IS NULL OR p.s_lng IS NULL OR
          6371000 * acos(least(1,
            cos(radians(p.s_lat)) * cos(radians((r."startLocation"->>'lat')::float)) *
            cos(radians((r."startLocation"->>'lng')::float) - radians(p.s_lng)) +
            sin(radians(p.s_lat)) * sin(radians((r."startLocation"->>'lat')::float))
          )) <= p.rad)
        AND
        (p.e_lat IS NULL OR p.e_lng IS NULL OR
          6371000 * acos(least(1,
            cos(radians(p.e_lat)) * cos(radians((r."endLocation"->>'lat')::float)) *
            cos(radians((r."endLocation"->>'lng')::float) - radians(p.e_lng)) +
            sin(radians(p.e_lat)) * sin(radians((r."endLocation"->>'lat')::float))
          )) <= p.rad)
      ORDER BY ${Prisma.raw(`r."${sortField}"`)} ${Prisma.raw(sortDir)}
      OFFSET ${offset} LIMIT ${limit};
    `
  );

  const idList = idsRows.map((r) => r.id);

  const totalRows = await prisma.$queryRaw<Array<{ cnt: number }>>(
    Prisma.sql`
      WITH params AS (
        SELECT
          ${sLat}::float AS s_lat, ${sLng}::float AS s_lng,
          ${eLat}::float AS e_lat, ${eLng}::float AS e_lng,
          ${radiusMeters}::int AS rad
      )
      SELECT count(*)::int AS cnt FROM "Route" r, params p
      WHERE
        (p.s_lat IS NULL OR p.s_lng IS NULL OR
          6371000 * acos(least(1,
            cos(radians(p.s_lat)) * cos(radians((r."startLocation"->>'lat')::float)) *
            cos(radians((r."startLocation"->>'lng')::float) - radians(p.s_lng)) +
            sin(radians(p.s_lat)) * sin(radians((r."startLocation"->>'lat')::float))
          )) <= p.rad)
        AND
        (p.e_lat IS NULL OR p.e_lng IS NULL OR
          6371000 * acos(least(1,
            cos(radians(p.e_lat)) * cos(radians((r."endLocation"->>'lat')::float)) *
            cos(radians((r."endLocation"->>'lng')::float) - radians(p.e_lng)) +
            sin(radians(p.e_lat)) * sin(radians((r."endLocation"->>'lat')::float))
          )) <= p.rad);
    `
  );
  const total = totalRows?.[0]?.cnt || 0;

  const data = idList.length
    ? await prisma.route.findMany({
        where: { id: { in: idList } },
        include: {
          driver: { select: { id: true, firstName: true, lastName: true, gender: true, profilePicture: true, isVerified: true } },
          vehicle: { select: { vehicleModel: true, vehicleType: true, photos: true, amenities: true } },
        },
      })
    : [];

  const orderMap = new Map(idList.map((id, i) => [id, i]));
  data.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getRouteById = async (id: string) => {
  return prisma.route.findUnique({
    where: { id },
    include: {
      bookings: {
        include: {
          passenger: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
        },
      },
      ...baseInclude,
    },
  });
};

export const getMyRoutes = async (driverId: string) => {
  return prisma.route.findMany({
    where: { driverId },
    include: {
      bookings: {
        include: {
          passenger: {
            select: { id: true, firstName: true, lastName: true, profilePicture: true, isVerified: true, email: true },
          },
        },
      },
      ...baseInclude,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const createRoute = async (data: Prisma.RouteUncheckedCreateInput) => {
  return prisma.route.create({ data });
};

export const updateRoute = async (id: string, data: Prisma.RouteUncheckedUpdateInput) => {
  return prisma.route.update({ where: { id }, data });
};

export const deleteRoute = async (id: string) => {
  await prisma.route.delete({ where: { id } });
  return { id };
};

export const cancelRoute = async (routeId: string, driverId: string, opts: { reason?: string } = {}) => {
  const { reason } = opts;

  const route = await prisma.route.findUnique({
    where: { id: routeId },
    include: {
      driver: { select: { id: true } },
      bookings: {
        where: { status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] } },
        include: { passenger: { select: { id: true } } },
      },
    },
  });
  if (!route) throw new ApiError(404, 'Route not found');
  if (route.driverId !== driverId) throw new ApiError(403, 'Forbidden');
  if (!([RouteStatus.AVAILABLE, RouteStatus.FULL] as RouteStatus[]).includes(route.status)) {
    throw new ApiError(400, 'Route cannot be cancelled at this stage');
  }

  const now = new Date();
  const affected = route.bookings || [];
  const hasConfirmed = affected.some((b) => b.status === BookingStatus.CONFIRMED);

  await prisma.$transaction(async (tx) => {
    await tx.route.update({
      where: { id: routeId },
      data: { status: RouteStatus.CANCELLED, cancelledBy: 'DRIVER', cancelledAt: now },
    });

    if (affected.length) {
      await tx.booking.updateMany({
        where: { routeId, status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] } },
        data: { status: BookingStatus.CANCELLED, cancelledBy: 'DRIVER', cancelledAt: now, cancelReason: (reason as CancelReason) || null },
      });

      const notiData = affected.map((b) => ({
        userId: b.passengerId,
        type: 'BOOKING' as const,
        title: 'การจองถูกยกเลิกเนื่องจากคนขับยกเลิกเส้นทาง',
        body: 'ขออภัย เส้นทางที่คุณจองถูกยกเลิกโดยคนขับ',
        metadata: { routeId, bookingId: b.id, by: 'DRIVER', reason },
      }));
      for (const n of notiData) {
        await tx.notification.create({ data: n });
      }
    }
  });

  await checkAndApplyDriverSuspension(driverId, { confirmedOnly: hasConfirmed });
  return { id: routeId, status: RouteStatus.CANCELLED, cancelledBy: 'DRIVER' as const, cancelledAt: now };
};
