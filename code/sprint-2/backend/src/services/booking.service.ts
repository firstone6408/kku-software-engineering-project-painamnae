import prisma from '../utils/prisma';
import ApiError from '../utils/ApiError';
import { RouteStatus, BookingStatus, Prisma, CancelReason } from '@prisma/client';
import { checkAndApplyPassengerSuspension } from './penalty.service';

const ACTIVE_STATUSES = [BookingStatus.PENDING, BookingStatus.CONFIRMED];

interface SearchBookingsOpts {
  page?: number;
  limit?: number;
  q?: string;
  status?: BookingStatus;
  routeId?: string;
  passengerId?: string;
  driverId?: string;
  createdFrom?: string;
  createdTo?: string;
  routeDepartureFrom?: string;
  routeDepartureTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateBookingData {
  routeId: string;
  numberOfSeats: number;
  pickupLocation: unknown;
  dropoffLocation: unknown;
  passengerId?: string;
}

export const searchBookingsAdmin = async (opts: SearchBookingsOpts = {}) => {
  const {
    page = 1, limit = 20, q, status, routeId, passengerId, driverId,
    createdFrom, createdTo, routeDepartureFrom, routeDepartureTo,
    sortBy = 'createdAt', sortOrder = 'desc',
  } = opts;

  const where: Prisma.BookingWhereInput = {
    ...(status && { status }),
    ...(routeId && { routeId }),
    ...(passengerId && { passengerId }),
    ...(createdFrom || createdTo ? {
      createdAt: {
        ...(createdFrom ? { gte: new Date(createdFrom) } : {}),
        ...(createdTo ? { lte: new Date(createdTo) } : {}),
      },
    } : {}),
    ...(driverId || routeDepartureFrom || routeDepartureTo || q ? {
      route: {
        ...(driverId ? { driverId } : {}),
        ...(routeDepartureFrom || routeDepartureTo ? {
          departureTime: {
            ...(routeDepartureFrom ? { gte: new Date(routeDepartureFrom) } : {}),
            ...(routeDepartureTo ? { lte: new Date(routeDepartureTo) } : {}),
          },
        } : {}),
        ...(q ? {
          OR: [
            { routeSummary: { contains: q, mode: 'insensitive' as const } },
            { vehicle: { is: { OR: [
              { licensePlate: { contains: q, mode: 'insensitive' as const } },
              { vehicleModel: { contains: q, mode: 'insensitive' as const } },
              { vehicleType: { contains: q, mode: 'insensitive' as const } },
            ] } } },
          ],
        } : {}),
      },
    } : {}),
    ...(q ? {
      OR: [
        { passenger: { is: { OR: [
          { firstName: { contains: q, mode: 'insensitive' as const } },
          { lastName: { contains: q, mode: 'insensitive' as const } },
          { email: { contains: q, mode: 'insensitive' as const } },
          { username: { contains: q, mode: 'insensitive' as const } },
        ] } } },
      ],
    } : {}),
  };

  const skip = (page - 1) * limit;
  const take = limit;

  const [total, data] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip, take,
      include: {
        passenger: {
          select: { id: true, firstName: true, lastName: true, email: true, username: true, profilePicture: true },
        },
        route: {
          include: {
            driver: { select: { id: true, firstName: true, lastName: true, email: true, isVerified: true } },
            vehicle: { select: { licensePlate: true, vehicleModel: true, vehicleType: true } },
          },
        },
      },
    }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const adminCreateBooking = async (data: CreateBookingData) => {
  return prisma.$transaction(async (tx) => {
    const route = await tx.route.findUnique({ where: { id: data.routeId } });
    if (!route) throw new ApiError(404, 'Route not found');
    if (route.driverId === data.passengerId) throw new ApiError(400, 'Driver cannot book their own route.');
    if (route.status !== RouteStatus.AVAILABLE) throw new ApiError(400, 'This route is no longer available.');
    if (route.availableSeats < data.numberOfSeats) throw new ApiError(400, 'Not enough seats available on this route.');

    const booking = await tx.booking.create({
      data: {
        routeId: data.routeId,
        passengerId: data.passengerId!,
        numberOfSeats: data.numberOfSeats,
        pickupLocation: data.pickupLocation as Prisma.InputJsonValue,
        dropoffLocation: data.dropoffLocation as Prisma.InputJsonValue,
      },
    });

    const updatedRoute = await tx.route.update({
      where: { id: data.routeId },
      data: { availableSeats: { decrement: data.numberOfSeats } },
    });
    if (updatedRoute.availableSeats === 0) {
      await tx.route.update({ where: { id: data.routeId }, data: { status: RouteStatus.FULL } });
    }
    return booking;
  });
};

export const adminUpdateBooking = async (id: string, patch: Record<string, unknown>) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.booking.findUnique({ where: { id }, include: { route: true } });
    if (!existing) throw new ApiError(404, 'Booking not found');

    const targetStatus = (patch.status as BookingStatus) ?? existing.status;
    const oldActive = (ACTIVE_STATUSES as BookingStatus[]).includes(existing.status);
    const newActive = (ACTIVE_STATUSES as BookingStatus[]).includes(targetStatus);
    const targetRouteId = (patch.routeId as string) ?? existing.routeId;
    const targetSeats = (patch.numberOfSeats as number) ?? existing.numberOfSeats;
    const targetPassengerId = (patch.passengerId as string) ?? existing.passengerId;

    const refundSeats = async (routeId: string, seats: number) => {
      const r = await tx.route.update({
        where: { id: routeId },
        data: { availableSeats: { increment: seats } },
      });
      if (r.status === RouteStatus.FULL && r.availableSeats > 0) {
        await tx.route.update({ where: { id: routeId }, data: { status: RouteStatus.AVAILABLE } });
      }
    };

    const reserveSeats = async (routeId: string, seats: number, passengerId: string) => {
      const r = await tx.route.findUnique({ where: { id: routeId } });
      if (!r) throw new ApiError(404, 'Route not found');
      if (r.driverId === passengerId) throw new ApiError(400, 'Driver cannot book their own route.');
      if (r.status !== RouteStatus.AVAILABLE) throw new ApiError(400, 'This route is no longer available.');
      if (r.availableSeats < seats) throw new ApiError(400, 'Not enough seats available on this route.');
      const updated = await tx.route.update({
        where: { id: routeId },
        data: { availableSeats: { decrement: seats } },
      });
      if (updated.availableSeats === 0) {
        await tx.route.update({ where: { id: routeId }, data: { status: RouteStatus.FULL } });
      }
    };

    if (oldActive) await refundSeats(existing.routeId, existing.numberOfSeats);
    if (newActive) await reserveSeats(targetRouteId, targetSeats, targetPassengerId);

    return tx.booking.update({
      where: { id },
      data: {
        routeId: targetRouteId,
        passengerId: targetPassengerId,
        numberOfSeats: targetSeats,
        pickupLocation: (patch.pickupLocation ?? existing.pickupLocation) as Prisma.InputJsonValue,
        dropoffLocation: (patch.dropoffLocation ?? existing.dropoffLocation) as Prisma.InputJsonValue,
        status: targetStatus,
      },
      include: { route: true, passenger: true },
    });
  });
};

export const createBooking = async (data: CreateBookingData, passengerId: string) => {
  return prisma.$transaction(async (tx) => {
    const route = await tx.route.findUnique({ where: { id: data.routeId } });
    if (!route) throw new ApiError(404, 'Route not found');
    if (route.driverId === passengerId) throw new ApiError(400, 'Driver cannot book their own route.');
    if (route.status !== RouteStatus.AVAILABLE) throw new ApiError(400, 'This route is no longer available.');
    if (route.availableSeats < data.numberOfSeats) throw new ApiError(400, 'Not enough seats available on this route.');

    const booking = await tx.booking.create({
      data: {
        routeId: data.routeId,
        passengerId,
        numberOfSeats: data.numberOfSeats,
        pickupLocation: data.pickupLocation as Prisma.InputJsonValue,
        dropoffLocation: data.dropoffLocation as Prisma.InputJsonValue,
      },
    });

    const updatedRoute = await tx.route.update({
      where: { id: data.routeId },
      data: { availableSeats: { decrement: data.numberOfSeats } },
    });
    if (updatedRoute.availableSeats === 0) {
      await tx.route.update({ where: { id: data.routeId }, data: { status: RouteStatus.FULL } });
    }

    await tx.notification.create({
      data: {
        userId: route.driverId,
        type: 'BOOKING',
        title: 'มีการจองใหม่ในเส้นทางของคุณ',
        body: 'ผู้โดยสารได้ทำการจองที่นั่งในเส้นทางของคุณแล้ว',
        metadata: { kind: 'BOOKING_CREATED', bookingId: booking.id, routeId: data.routeId, passengerId, numberOfSeats: data.numberOfSeats },
      },
    });

    return booking;
  });
};

export const getMyBookings = async (passengerId: string) => {
  return prisma.booking.findMany({
    where: { passengerId },
    include: {
      route: {
        include: {
          driver: { select: { id: true, firstName: true, lastName: true, gender: true, profilePicture: true, isVerified: true } },
          vehicle: { select: { vehicleModel: true, vehicleType: true, photos: true, amenities: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getBookingById = async (id: string) => {
  return prisma.booking.findUnique({ where: { id }, include: { route: true, passenger: true } });
};

export const updateBookingStatus = async (id: string, status: BookingStatus, userId: string) => {
  const booking = await prisma.booking.findUnique({ where: { id }, include: { route: true } });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.route.driverId !== userId) throw new ApiError(403, 'Forbidden');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({ where: { id }, data: { status } });

    if (status === BookingStatus.REJECTED) {
      const refunded = booking.numberOfSeats;
      const newSeats = booking.route.availableSeats + refunded;
      const routeUpdates: Prisma.RouteUncheckedUpdateInput = { availableSeats: newSeats };
      if (booking.route.status === RouteStatus.FULL && newSeats > 0) {
        routeUpdates.status = RouteStatus.AVAILABLE;
      }
      await tx.route.update({ where: { id: booking.route.id }, data: routeUpdates });
      await tx.notification.create({
        data: {
          userId: booking.passengerId,
          type: 'BOOKING',
          title: 'คำขอจองถูกปฏิเสธ',
          body: 'ขออภัย คนขับได้ปฏิเสธคำขอจองของคุณ',
          metadata: { kind: 'BOOKING_STATUS', bookingId: id, routeId: booking.route.id, status: 'REJECTED' },
        },
      });
    }

    if (status === BookingStatus.CONFIRMED) {
      await tx.notification.create({
        data: {
          userId: booking.passengerId,
          type: 'BOOKING',
          title: 'คำขอจองได้รับการยืนยัน',
          body: 'คนขับได้ยืนยันการจองของคุณแล้ว',
          metadata: { kind: 'BOOKING_STATUS', bookingId: id, routeId: booking.route.id, status: 'CONFIRMED' },
        },
      });
    }
    return updated;
  });
};

export const cancelBooking = async (id: string, passengerId: string, opts: { reason?: string } = {}) => {
  const { reason } = opts;
  const booking = await prisma.booking.findUnique({ where: { id }, include: { route: true } });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.passengerId !== passengerId) throw new ApiError(403, 'Forbidden');
  if (!([BookingStatus.PENDING, BookingStatus.CONFIRMED] as BookingStatus[]).includes(booking.status)) {
    throw new ApiError(400, 'Cannot cancel at this stage');
  }

  const wasConfirmed = booking.status === BookingStatus.CONFIRMED;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedBooking = await tx.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED, cancelledAt: new Date(), cancelledBy: 'PASSENGER', cancelReason: (reason as CancelReason) || null },
    });

    const refunded = booking.numberOfSeats;
    const newSeats = booking.route.availableSeats + refunded;
    const routeUpdates: Prisma.RouteUncheckedUpdateInput = { availableSeats: newSeats };
    if (booking.route.status === RouteStatus.FULL && newSeats > 0) {
      routeUpdates.status = RouteStatus.AVAILABLE;
    }
    await tx.route.update({ where: { id: booking.route.id }, data: routeUpdates });

    if (wasConfirmed) {
      await tx.notification.create({
        data: {
          userId: passengerId,
          type: 'SYSTEM',
          title: 'บันทึกการยกเลิกหลังยืนยัน',
          body: 'คุณได้ยกเลิกการจองที่เคยได้รับการยืนยันแล้ว',
          metadata: { kind: 'PASSENGER_CONFIRMED_CANCEL', bookingId: id },
        },
      });
    }
    return updatedBooking;
  });

  if (wasConfirmed) {
    await checkAndApplyPassengerSuspension(passengerId, { confirmedOnly: true });
  }
  return updated;
};

export const deleteBooking = async (id: string, userId: string) => {
  const booking = await prisma.booking.findUnique({ where: { id }, include: { route: true } });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (!([BookingStatus.CANCELLED, BookingStatus.REJECTED] as BookingStatus[]).includes(booking.status)) {
    throw new ApiError(400, 'Only cancelled or rejected bookings can be deleted');
  }
  if (booking.passengerId !== userId && booking.route.driverId !== userId) {
    throw new ApiError(403, 'Forbidden');
  }
  await prisma.booking.delete({ where: { id } });
  return { id };
};

export const adminDeleteBooking = async (id: string) => {
  const booking = await prisma.booking.findUnique({ where: { id }, include: { route: true } });
  if (!booking) throw new ApiError(404, 'Booking not found');

  return prisma.$transaction(async (tx) => {
    if (booking.route) {
      if (booking.status === BookingStatus.PENDING || booking.status === BookingStatus.CONFIRMED) {
        const refunded = booking.numberOfSeats;
        const newSeats = booking.route.availableSeats + refunded;
        const routeUpdates: Prisma.RouteUncheckedUpdateInput = { availableSeats: newSeats };
        if (booking.route.status === RouteStatus.FULL && newSeats > 0) {
          routeUpdates.status = RouteStatus.AVAILABLE;
        }
        await tx.route.update({ where: { id: booking.route.id }, data: routeUpdates });
      }
    }
    await tx.booking.delete({ where: { id } });
    return { id };
  });
};
