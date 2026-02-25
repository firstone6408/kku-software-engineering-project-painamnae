import prisma from '../utils/prisma';

const PASSENGER_CANCEL_LIMIT = 3;
const DRIVER_CANCEL_LIMIT = 2;
const WINDOW_DAYS = 30;
const SUSPEND_DAYS = 7;

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

interface SuspensionOpts {
  confirmedOnly?: boolean;
}

export async function checkAndApplyPassengerSuspension(
  passengerId: string,
  opts: SuspensionOpts = {}
): Promise<void> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  let cancelCount: number;

  if (opts.confirmedOnly) {
    cancelCount = await prisma.notification.count({
      where: {
        userId: passengerId,
        type: 'SYSTEM',
        createdAt: { gte: since },
        metadata: {
          path: ['kind'],
          equals: 'PASSENGER_CONFIRMED_CANCEL',
        },
      },
    });
  } else {
    cancelCount = await prisma.booking.count({
      where: {
        passengerId,
        status: 'CANCELLED',
        cancelledBy: 'PASSENGER',
        cancelledAt: { gte: since },
      },
    });
  }

  if (cancelCount >= PASSENGER_CANCEL_LIMIT) {
    const until = addDays(new Date(), SUSPEND_DAYS);
    await prisma.user.update({
      where: { id: passengerId },
      data: { passengerSuspendedUntil: until },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: passengerId,
          type: 'SYSTEM',
          title: 'ระงับสิทธิ์การจองชั่วคราว',
          body: `คุณถูกระงับสิทธิ์การจอง ${SUSPEND_DAYS} วัน เนื่องจากยกเลิกการจองที่อนุมัติแล้ว ${PASSENGER_CANCEL_LIMIT} ครั้ง ภายใน ${WINDOW_DAYS} วัน`,
          metadata: {
            kind: 'PASSENGER_SUSPENSION',
            windowDays: WINDOW_DAYS,
            suspendDays: SUSPEND_DAYS,
          },
        },
      });
    } catch (_) { /* ignore */ }
  }
}

export async function checkAndApplyDriverSuspension(
  driverId: string,
  opts: SuspensionOpts = {}
): Promise<void> {
  const { confirmedOnly = false } = opts;
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const cancelCount = await prisma.route.count({
    where: {
      driverId,
      status: 'CANCELLED',
      cancelledBy: 'DRIVER',
      cancelledAt: { gte: since },
    },
  });

  if (cancelCount >= DRIVER_CANCEL_LIMIT) {
    const until = addDays(new Date(), SUSPEND_DAYS);
    await prisma.user.update({
      where: { id: driverId },
      data: { driverSuspendedUntil: until },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: driverId,
          type: 'SYSTEM',
          title: 'ระงับสิทธิ์ผู้ขับขี่ชั่วคราว',
          body: `บัญชีผู้ขับขี่ของคุณถูกระงับ ${SUSPEND_DAYS} วัน เนื่องจากยกเลิกเส้นทาง ${DRIVER_CANCEL_LIMIT} ครั้ง ภายใน ${WINDOW_DAYS} วัน`,
          metadata: {
            kind: 'DRIVER_SUSPENSION',
            windowDays: WINDOW_DAYS,
            suspendDays: SUSPEND_DAYS,
            confirmedOnly,
          },
        },
      });
    } catch (_) { /* ignore */ }
  }
}
