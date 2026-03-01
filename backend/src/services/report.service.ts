import {
  createDriverReportSchema,
  createPassengerReportSchema,
  updateReportSchema,
} from '../validations/report.validation';
import { zodValidateThrow } from '../utils/zod';
import prisma from '../utils/prisma';
import { ReportType, Prisma, MediaType, DriverIncidentReason, PassengerReportReason } from '@prisma/client';
import ApiError from '../utils/ApiError';

interface MediaItem {
  url: string;
  publicId: string;
  type: MediaType | string;
}

type TransactionClient = Prisma.TransactionClient;

async function notifyReportFiled(tx: TransactionClient, reporterId: string, reportType: ReportType): Promise<void> {
  const typeLabel = reportType === ReportType.PASSENGER_REPORT_DRIVER
    ? 'รายงานปัญหาคนขับ'
    : 'รายงานเหตุการณ์';

  await tx.notification.create({
    data: {
      userId: reporterId,
      type: 'SYSTEM',
      title: '✅ ส่ง Report สำเร็จ',
      body: `${typeLabel}ของคุณได้ถูกส่งไปยังผู้ดูแลระบบแล้ว เราจะแจ้งผลให้ทราบเมื่อดำเนินการเสร็จสิ้น`,
    },
  });
}

async function notifyReportResolved(tx: TransactionClient, reporterId: string, reportType: ReportType): Promise<void> {
  const typeLabel = reportType === ReportType.PASSENGER_REPORT_DRIVER
    ? 'รายงานปัญหาคนขับ'
    : 'รายงานเหตุการณ์';

  await tx.notification.create({
    data: {
      userId: reporterId,
      type: 'SYSTEM',
      title: '📋 Report ของคุณได้รับการดำเนินการแล้ว',
      body: `${typeLabel}ของคุณได้รับการตรวจสอบและดำเนินการโดยผู้ดูแลระบบเรียบร้อยแล้ว`,
    },
  });
}

export async function createDriverReport(userId: string, data: unknown, mediaItems?: MediaItem[]) {
  const parsed = createDriverReportSchema.safeParse(data);
  if (!parsed.success) zodValidateThrow(parsed);

  const existingReport = await prisma.report.findFirst({
    where: { reporterId: userId, bookingId: parsed.data!.bookingId, type: ReportType.DRIVER_REPORT_INCIDENT },
  });
  if (existingReport) throw new ApiError(400, 'คุณได้ส่ง Report การจองนี้ไปแล้ว');

  const { driverReasons, ...rest } = parsed.data!;

  return prisma.$transaction(async (tx) => {
    const newReport = await tx.report.create({
      data: { ...rest, reporterId: userId, type: ReportType.DRIVER_REPORT_INCIDENT },
    });

    await tx.reportReason.createMany({
      data: driverReasons.map((reason) => ({ reportId: newReport.id, driverReason: reason as DriverIncidentReason })),
    });

    if (mediaItems && mediaItems.length > 0) {
      await tx.reportMedia.createMany({
        data: mediaItems.map((m) => ({ reportId: newReport.id, url: m.url, publicId: m.publicId, type: m.type as MediaType })),
      });
    }

    await notifyReportFiled(tx, userId, ReportType.DRIVER_REPORT_INCIDENT);

    return tx.report.findUnique({ where: { id: newReport.id }, include: { reasons: true, media: true } });
  });
}

export async function createPassengerReport(userId: string, data: unknown, mediaItems?: MediaItem[]) {
  const parsed = createPassengerReportSchema.safeParse(data);
  if (!parsed.success) zodValidateThrow(parsed);

  const existingReport = await prisma.report.findFirst({
    where: { reporterId: userId, bookingId: parsed.data!.bookingId, type: ReportType.PASSENGER_REPORT_DRIVER },
  });
  if (existingReport) throw new ApiError(400, 'คุณได้ส่ง Report การจองนี้ไปแล้ว');

  const { passengerReasons, ...rest } = parsed.data!;

  return prisma.$transaction(async (tx) => {
    const newReport = await tx.report.create({
      data: { ...rest, reporterId: userId, type: ReportType.PASSENGER_REPORT_DRIVER },
    });

    await tx.reportReason.createMany({
      data: passengerReasons.map((reason) => ({ reportId: newReport.id, passengerReason: reason as PassengerReportReason })),
    });

    if (mediaItems && mediaItems.length > 0) {
      await tx.reportMedia.createMany({
        data: mediaItems.map((m) => ({ reportId: newReport.id, url: m.url, publicId: m.publicId, type: m.type as MediaType })),
      });
    }

    await notifyReportFiled(tx, userId, ReportType.PASSENGER_REPORT_DRIVER);

    return tx.report.findUnique({ where: { id: newReport.id }, include: { reasons: true, media: true } });
  });
}

export async function updateReport(reportId: string, userId: string, data: unknown, mediaItems?: MediaItem[]) {
  const parsed = updateReportSchema.safeParse(data);
  if (!parsed.success) zodValidateThrow(parsed);

  const report = await prisma.report.findUnique({ where: { id: reportId }, include: { media: true } });
  if (!report) throw new ApiError(404, 'Report not found');
  if (report.reporterId !== userId) throw new ApiError(403, 'ไม่สามารถแก้ไข report ของผู้อื่นได้');
  if (report.status !== 'PENDING') throw new ApiError(403, 'ไม่สามารถแก้ไข report ที่ดำเนินการแล้ว');

  const { reasons, keepMediaIds, ...rest } = parsed.data!;

  return prisma.$transaction(async (tx) => {
    await tx.report.update({ where: { id: reportId }, data: { ...rest } });

    await tx.reportReason.deleteMany({ where: { reportId } });

    if (report.type === 'DRIVER_REPORT_INCIDENT') {
      await tx.reportReason.createMany({
        data: reasons.map((reason) => ({ reportId, driverReason: reason as DriverIncidentReason })),
      });
    } else if (report.type === 'PASSENGER_REPORT_DRIVER') {
      await tx.reportReason.createMany({
        data: reasons.map((reason) => ({ reportId, passengerReason: reason as PassengerReportReason })),
      });
    }

    const safeKeepIds = keepMediaIds || [];
    const mediaToDelete = report.media.filter((m) => !safeKeepIds.includes(m.id));
    if (mediaToDelete.length > 0) {
      await tx.reportMedia.deleteMany({ where: { id: { in: mediaToDelete.map((m) => m.id) } } });
    }

    if (mediaItems && mediaItems.length > 0) {
      await tx.reportMedia.createMany({
        data: mediaItems.map((m) => ({ reportId, url: m.url, publicId: m.publicId, type: m.type as MediaType })),
      });
    }

    return tx.report.findUnique({ where: { id: reportId }, include: { reasons: true, media: true } });
  });
}

export async function resolveReport(reportId: string) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new ApiError(404, 'Report not found');
  if (report.status === 'RESOLVED') throw new ApiError(400, 'Report นี้ได้รับการดำเนินการแล้ว');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.report.update({
      where: { id: reportId },
      data: { status: 'RESOLVED' },
      include: { reasons: true, media: true },
    });

    await notifyReportResolved(tx, report.reporterId, report.type);
    return updated;
  });
}

export async function getReportsByUserId(userId: string) {
  return prisma.report.findMany({
    where: { reporterId: userId },
    include: { reasons: true, media: true },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Admin: list all reports ───
interface AdminReportFilterOpts {
  q?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export async function getAllReports(opts: AdminReportFilterOpts = {}) {
  const { q, status, type, page = 1, limit = 20 } = opts;

  const where: Prisma.ReportWhereInput = {
    ...(status ? { status: status as never } : {}),
    ...(type ? { type: type as never } : {}),
    ...(q
      ? {
          OR: [
            { reporter: { firstName: { contains: q, mode: 'insensitive' as const } } },
            { reporter: { lastName: { contains: q, mode: 'insensitive' as const } } },
            { reporter: { username: { contains: q, mode: 'insensitive' as const } } },
            { reportedUser: { firstName: { contains: q, mode: 'insensitive' as const } } },
            { reportedUser: { lastName: { contains: q, mode: 'insensitive' as const } } },
            { reportedUser: { username: { contains: q, mode: 'insensitive' as const } } },
            { otherReasonText: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const skip = (page - 1) * limit;

  const [total, data] = await prisma.$transaction([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      include: {
        reporter: { select: { id: true, username: true, firstName: true, lastName: true, email: true, role: true, profilePicture: true, phoneNumber: true } },
        reportedUser: { select: { id: true, username: true, firstName: true, lastName: true, email: true, role: true, profilePicture: true, phoneNumber: true } },
        reasons: true,
        media: true,
        booking: {
          select: {
            id: true,
            route: {
              select: {
                id: true,
                startLocation: true,
                endLocation: true,
                departureTime: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

// ─── Admin: get single report by id ───
export async function getReportById(reportId: string) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      reporter: { select: { id: true, username: true, firstName: true, lastName: true, email: true, role: true, profilePicture: true, phoneNumber: true } },
      reportedUser: { select: { id: true, username: true, firstName: true, lastName: true, email: true, role: true, profilePicture: true, phoneNumber: true } },
      reasons: true,
      media: true,
      booking: {
        select: {
          id: true,
          route: {
            select: {
              id: true,
              startLocation: true,
              endLocation: true,
              departureTime: true,
              driver: { select: { id: true, username: true, firstName: true, lastName: true } },
              vehicle: { select: { id: true, vehicleModel: true, vehicleType: true, licensePlate: true } },
            },
          },
        },
      },
    },
  });

  if (!report) throw new ApiError(404, 'Report not found');
  return report;
}
