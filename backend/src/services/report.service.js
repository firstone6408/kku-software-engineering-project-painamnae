const {
  createDriverReportSchema,
  createPassengerReportSchema,
  updateReportSchema,
} = require("../validations/report.validation");
const { zodValidateThrow } = require("../utils/zod");
const prisma = require("../utils/prisma");
const { ReportType } = require("@prisma/client");
const ApiError = require("../utils/ApiError");

/**
 * ส่ง notification ยืนยันให้ผู้ส่ง report ว่า report ถูกส่งไปหา admin แล้ว
 */
async function notifyReportFiled(tx, reporterId, reportType) {
  const typeLabel =
    reportType === ReportType.PASSENGER_REPORT_DRIVER
      ? "รายงานปัญหาคนขับ"
      : "รายงานเหตุการณ์";

  await tx.notification.create({
    data: {
      userId: reporterId,
      type: "SYSTEM",
      title: "✅ ส่ง Report สำเร็จ",
      body: `${typeLabel}ของคุณได้ถูกส่งไปยังผู้ดูแลระบบแล้ว เราจะแจ้งผลให้ทราบเมื่อดำเนินการเสร็จสิ้น`,
    },
  });
}

/**
 * ส่ง notification แจ้งผู้ report เมื่อ admin resolve เคส
 */
async function notifyReportResolved(tx, reporterId, reportType) {
  const typeLabel =
    reportType === ReportType.PASSENGER_REPORT_DRIVER
      ? "รายงานปัญหาคนขับ"
      : "รายงานเหตุการณ์";

  await tx.notification.create({
    data: {
      userId: reporterId,
      type: "SYSTEM",
      title: "📋 Report ของคุณได้รับการดำเนินการแล้ว",
      body: `${typeLabel}ของคุณได้รับการตรวจสอบและดำเนินการโดยผู้ดูแลระบบเรียบร้อยแล้ว`,
    },
  });
}

async function createDriverReport(userId, data, mediaItems) {
  const parsed = createDriverReportSchema.safeParse(data);
  if (!parsed.success) {
    zodValidateThrow(parsed);
  }

  // เช็คว่า user นี้ เคยสร้าง report ประเภท DRIVER_REPORT_INCIDENT บน booking นี้แล้วหรือยัง
  const existingReport = await prisma.report.findFirst({
    where: {
      reporterId: userId,
      bookingId: parsed.data.bookingId,
      type: ReportType.DRIVER_REPORT_INCIDENT,
    },
  });
  if (existingReport) {
    throw new ApiError(400, "คุณได้ส่ง Report การจองนี้ไปแล้ว");
  }

  const { driverReasons, ...rest } = parsed.data;

  const created = await prisma.$transaction(async (tx) => {
    // 1. Create Report
    const newReport = await tx.report.create({
      data: {
        ...rest,
        reporterId: userId,
        type: ReportType.DRIVER_REPORT_INCIDENT,
      },
    });

    // 2. Create reasons
    await tx.reportReason.createMany({
      data: driverReasons.map((reason) => ({
        reportId: newReport.id,
        driverReason: reason,
      })),
    });

    // 3. Create media (ถ้ามี)
    if (mediaItems && mediaItems.length > 0) {
      await tx.reportMedia.createMany({
        data: mediaItems.map((m) => ({
          reportId: newReport.id,
          url: m.url,
          publicId: m.publicId,
          type: m.type,
        })),
      });
    }

    // 4. ส่ง Notification ยืนยันให้ผู้ report
    await notifyReportFiled(tx, userId, ReportType.DRIVER_REPORT_INCIDENT);

    return tx.report.findUnique({
      where: { id: newReport.id },
      include: { reasons: true, media: true },
    });
  });

  return created;
}

async function createPassengerReport(userId, data, mediaItems) {
  const parsed = createPassengerReportSchema.safeParse(data);
  if (!parsed.success) {
    zodValidateThrow(parsed);
  }

  // เช็คว่า user นี้ เคยสร้าง report ประเภท PASSENGER_REPORT_DRIVER บน booking นี้แล้วหรือยัง
  const existingReport = await prisma.report.findFirst({
    where: {
      reporterId: userId,
      bookingId: parsed.data.bookingId,
      type: ReportType.PASSENGER_REPORT_DRIVER,
    },
  });
  if (existingReport) {
    throw new ApiError(400, "คุณได้ส่ง Report การจองนี้ไปแล้ว");
  }

  const { passengerReasons, ...rest } = parsed.data;

  const created = await prisma.$transaction(async (tx) => {
    // 1. Create Report
    const newReport = await tx.report.create({
      data: {
        ...rest,
        reporterId: userId,
        type: ReportType.PASSENGER_REPORT_DRIVER,
      },
    });

    // 2. Create reasons
    await tx.reportReason.createMany({
      data: passengerReasons.map((reason) => ({
        reportId: newReport.id,
        passengerReason: reason,
      })),
    });

    // 3. Create media (ถ้ามี)
    if (mediaItems && mediaItems.length > 0) {
      await tx.reportMedia.createMany({
        data: mediaItems.map((m) => ({
          reportId: newReport.id,
          url: m.url,
          publicId: m.publicId,
          type: m.type,
        })),
      });
    }

    // 4. ส่ง Notification ยืนยันให้ผู้ report
    await notifyReportFiled(tx, userId, ReportType.PASSENGER_REPORT_DRIVER);

    return tx.report.findUnique({
      where: { id: newReport.id },
      include: { reasons: true, media: true },
    });
  });

  return created;
}

async function updateReport(reportId, userId, data, mediaItems) {
  const parsed = updateReportSchema.safeParse(data);
  if (!parsed.success) {
    zodValidateThrow(parsed);
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { media: true },
  });
  if (!report) {
    throw new ApiError(404, "Report not found");
  }
  if (report.reporterId !== userId) {
    throw new ApiError(403, "ไม่สามารถแก้ไข report ของผู้อื่นได้");
  }
  if (report.status !== "PENDING") {
    throw new ApiError(403, "ไม่สามารถแก้ไข report ที่ดำเนินการแล้ว");
  }

  const { reasons, keepMediaIds, ...rest } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update Report
    await tx.report.update({
      where: { id: reportId },
      data: { ...rest },
    });

    // 2. Update reasons — ลบของเดิม แล้วสร้างใหม่
    await tx.reportReason.deleteMany({
      where: { reportId },
    });

    if (report.type === "DRIVER_REPORT_INCIDENT") {
      await tx.reportReason.createMany({
        data: reasons.map((reason) => ({
          reportId,
          driverReason: reason,
        })),
      });
    } else if (report.type === "PASSENGER_REPORT_DRIVER") {
      await tx.reportReason.createMany({
        data: reasons.map((reason) => ({
          reportId,
          passengerReason: reason,
        })),
      });
    }

    // 3. Update media — ลบ media ที่ไม่อยู่ใน keepMediaIds
    const safeKeepIds = keepMediaIds || [];
    const mediaToDelete = report.media.filter(
      (m) => !safeKeepIds.includes(m.id)
    );
    if (mediaToDelete.length > 0) {
      await tx.reportMedia.deleteMany({
        where: {
          id: { in: mediaToDelete.map((m) => m.id) },
        },
      });
    }

    // 4. Create new media (ถ้ามี)
    if (mediaItems && mediaItems.length > 0) {
      await tx.reportMedia.createMany({
        data: mediaItems.map((m) => ({
          reportId,
          url: m.url,
          publicId: m.publicId,
          type: m.type,
        })),
      });
    }

    return tx.report.findUnique({
      where: { id: reportId },
      include: { reasons: true, media: true },
    });
  });

  return updated;
}

/**
 * Admin resolve report — เปลี่ยนสถานะเป็น RESOLVED + แจ้ง notification ให้ผู้ report
 */
async function resolveReport(reportId) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
  });
  if (!report) {
    throw new ApiError(404, "Report not found");
  }
  if (report.status === "RESOLVED") {
    throw new ApiError(400, "Report นี้ได้รับการดำเนินการแล้ว");
  }

  const resolved = await prisma.$transaction(async (tx) => {
    const updated = await tx.report.update({
      where: { id: reportId },
      data: { status: "RESOLVED" },
      include: { reasons: true, media: true },
    });

    // ส่ง notification แจ้งผู้ report
    await notifyReportResolved(tx, report.reporterId, report.type);

    return updated;
  });

  return resolved;
}

async function getReportsByUserId(userId) {
  return prisma.report.findMany({
    where: {
      reporterId: userId,
    },
    include: {
      reasons: true,
      media: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

module.exports = {
  updateReport,
  createDriverReport,
  createPassengerReport,
  getReportsByUserId,
  resolveReport,
};
