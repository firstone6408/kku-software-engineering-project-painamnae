const z = require("zod");
const {
  PassengerReportReason,
  DriverIncidentReason,
} = require("@prisma/client");

const createDriverReportSchema = z.object({
  bookingId: z.string().cuid(),
  driverReasons: z.preprocess(
    (val) => (typeof val === "string" ? JSON.parse(val) : val),
    z.array(z.nativeEnum(DriverIncidentReason)).min(1, "กรุณาเลือกเหตุผลอย่างน้อย 1 ข้อ")
  ),
  otherReasonText: z.string().optional(),
});

const createPassengerReportSchema = z.object({
  reportedUserId: z.string().cuid(),
  bookingId: z.string().cuid(),
  passengerReasons: z.preprocess(
    (val) => (typeof val === "string" ? JSON.parse(val) : val),
    z.array(z.nativeEnum(PassengerReportReason)).min(1, "กรุณาเลือกเหตุผลอย่างน้อย 1 ข้อ")
  ),
  otherReasonText: z.string().optional(),
});

const updateReportSchema = z.object({
  reasons: z.preprocess(
    (val) => (typeof val === "string" ? JSON.parse(val) : val),
    z.array(z.string()).min(1, "กรุณาเลือกเหตุผลอย่างน้อย 1 ข้อ")
  ),
  otherReasonText: z.string().optional(),
  keepMediaIds: z.preprocess(
    (val) => (typeof val === "string" ? JSON.parse(val) : val),
    z.array(z.string().cuid()).optional()
  ),
});

module.exports = {
  createDriverReportSchema,
  createPassengerReportSchema,
  updateReportSchema,
};
