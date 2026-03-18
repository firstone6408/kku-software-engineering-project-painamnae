/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: ระบบรายงานปัญหา — ผู้โดยสารรายงานคนขับ / คนขับรายงานเหตุการณ์
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ReportMedia:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "cmrptmedia001"
 *         reportId:
 *           type: string
 *           example: "cmrpt001"
 *         url:
 *           type: string
 *           example: "https://res.cloudinary.com/xxx/image/upload/v1/reports/abc.jpg"
 *         publicId:
 *           type: string
 *           example: "reports/abc"
 *         type:
 *           type: string
 *           enum: [IMAGE, VIDEO]
 *           example: "IMAGE"
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     ReportReason:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "cmrptreason001"
 *         reportId:
 *           type: string
 *           example: "cmrpt001"
 *         passengerReason:
 *           type: string
 *           nullable: true
 *           enum: [FAST_DRIVING, RUDE_BEHAVIOR, RECKLESS_DRIVING, UNSAFE_DRIVING, INAPPROPRIATE_CONDUCT, OTHER]
 *           example: "RUDE_BEHAVIOR"
 *         driverReason:
 *           type: string
 *           nullable: true
 *           enum: [ACCIDENT, PASSENGER_MISCONDUCT, PASSENGER_NO_SHOW, PASSENGER_RUDE, DAMAGE_TO_VEHICLE, OTHER]
 *           example: null
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     Report:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "cmrpt001"
 *         type:
 *           type: string
 *           enum: [PASSENGER_REPORT_DRIVER, DRIVER_REPORT_INCIDENT]
 *           example: "PASSENGER_REPORT_DRIVER"
 *         reporterId:
 *           type: string
 *           example: "cmuser001"
 *         reportedUserId:
 *           type: string
 *           nullable: true
 *           example: "cmuser002"
 *         bookingId:
 *           type: string
 *           nullable: true
 *           example: "cmbooking001"
 *         status:
 *           type: string
 *           enum: [PENDING, RESOLVED, REJECTED]
 *           example: "PENDING"
 *         otherReasonText:
 *           type: string
 *           nullable: true
 *           example: "คนขับพูดจาไม่สุภาพมาก"
 *         rejectionReason:
 *           type: string
 *           nullable: true
 *           description: เหตุผลการปฏิเสธจาก Admin (มีค่าเฉพาะเมื่อ status = REJECTED)
 *           example: null
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         reasons:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ReportReason'
 *         media:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ReportMedia'
 */

// ==========================================
// POST /api/reports/passenger
// ==========================================
/**
 * @swagger
 * /api/reports/passenger:
 *   post:
 *     summary: สร้าง Report — ผู้โดยสารรายงานคนขับ
 *     description: |
 *       ผู้โดยสารสร้าง Report เพื่อรายงานพฤติกรรมของคนขับให้ Admin ทราบ
 *       - ต้องเลือกเหตุผลอย่างน้อย 1 ข้อ
 *       - แนบรูปภาพ/วิดีโอได้สูงสุด 10 ไฟล์ (ไม่เกิน 50MB ต่อไฟล์)
 *       - สร้างได้ 1 report ต่อ 1 booking เท่านั้น
 *       - ระบบจะส่ง Notification ยืนยันให้ผู้ report ว่า report ถูกส่งถึง Admin แล้ว
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [reportedUserId, bookingId, passengerReasons]
 *             properties:
 *               reportedUserId:
 *                 type: string
 *                 description: ID ของคนขับที่ต้องการรายงาน
 *                 example: "cmuser002"
 *               bookingId:
 *                 type: string
 *                 description: ID ของการจอง
 *                 example: "cmbooking001"
 *               passengerReasons:
 *                 type: string
 *                 description: JSON array ของเหตุผล (PassengerReportReason enum)
 *                 example: '["RUDE_BEHAVIOR","UNSAFE_DRIVING"]'
 *               otherReasonText:
 *                 type: string
 *                 description: รายละเอียดเพิ่มเติม (กรณีเลือก OTHER)
 *                 example: "คนขับพูดจาไม่สุภาพ"
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: ไฟล์รูปภาพ/วิดีโอ (สูงสุด 10 ไฟล์)
 *     responses:
 *       201:
 *         description: Report created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Report created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *       400:
 *         description: |
 *           - Validation error (เหตุผลไม่ถูกต้อง)
 *           - คุณได้ส่ง Report การจองนี้ไปแล้ว
 *       403:
 *         description: Forbidden — เฉพาะ PASSENGER เท่านั้น
 */

// ==========================================
// POST /api/reports/driver
// ==========================================
/**
 * @swagger
 * /api/reports/driver:
 *   post:
 *     summary: สร้าง Report — คนขับรายงานเหตุการณ์
 *     description: |
 *       คนขับสร้าง Report เพื่อรายงานเหตุการณ์ (อุบัติเหตุ, ผู้โดยสารมีปัญหา ฯลฯ) ให้ Admin ทราบ
 *       - ต้องเลือกเหตุผลอย่างน้อย 1 ข้อ
 *       - แนบรูปภาพ/วิดีโอได้สูงสุด 10 ไฟล์ (ไม่เกิน 50MB ต่อไฟล์)
 *       - สร้างได้ 1 report ต่อ 1 booking เท่านั้น
 *       - ระบบจะส่ง Notification ยืนยันให้ผู้ report ว่า report ถูกส่งถึง Admin แล้ว
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [bookingId, driverReasons]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 description: ID ของการจอง
 *                 example: "cmbooking001"
 *               driverReasons:
 *                 type: string
 *                 description: JSON array ของเหตุผล (DriverIncidentReason enum)
 *                 example: '["PASSENGER_NO_SHOW","PASSENGER_RUDE"]'
 *               otherReasonText:
 *                 type: string
 *                 description: รายละเอียดเพิ่มเติม (กรณีเลือก OTHER)
 *                 example: "ผู้โดยสารไม่มาตามเวลานัดหมาย"
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: ไฟล์รูปภาพ/วิดีโอ (สูงสุด 10 ไฟล์)
 *     responses:
 *       201:
 *         description: Report created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Report created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *       400:
 *         description: |
 *           - Validation error (เหตุผลไม่ถูกต้อง)
 *           - คุณได้ส่ง Report การจองนี้ไปแล้ว
 *       403:
 *         description: Forbidden — เฉพาะ DRIVER เท่านั้น
 */

// ==========================================
// PUT /api/reports/:id
// ==========================================
/**
 * @swagger
 * /api/reports/{id}:
 *   put:
 *     summary: แก้ไข Report (เฉพาะ PENDING เท่านั้น)
 *     description: |
 *       แก้ไข Report ที่สร้างไว้ — เปลี่ยนเหตุผล, เพิ่ม/ลบสื่อ
 *       - แก้ไขได้เฉพาะ report ที่มีสถานะ PENDING และเป็นของตัวเองเท่านั้น
 *       - ใช้ `keepMediaIds` เพื่อระบุ media เดิมที่ต้องการเก็บไว้ (ที่ไม่อยู่ใน list จะถูกลบ)
 *       - เพิ่มไฟล์ใหม่ได้ผ่าน field `media`
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "cmrpt001"
 *         description: ID ของ Report ที่ต้องการแก้ไข
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [reasons]
 *             properties:
 *               reasons:
 *                 type: string
 *                 description: |
 *                   JSON array ของเหตุผลใหม่
 *                   - ถ้า report ประเภท PASSENGER → ใช้ PassengerReportReason enum
 *                   - ถ้า report ประเภท DRIVER → ใช้ DriverIncidentReason enum
 *                 example: '["RUDE_BEHAVIOR","OTHER"]'
 *               otherReasonText:
 *                 type: string
 *                 description: รายละเอียดเพิ่มเติม
 *                 example: "แก้ไขรายละเอียดเพิ่มเติม"
 *               keepMediaIds:
 *                 type: string
 *                 description: JSON array ของ media ID ที่ต้องการเก็บไว้ (ที่เหลือจะถูกลบ)
 *                 example: '["cmrptmedia001","cmrptmedia002"]'
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: ไฟล์ใหม่ที่ต้องการเพิ่ม
 *     responses:
 *       200:
 *         description: Report updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Report updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *       403:
 *         description: |
 *           - ไม่สามารถแก้ไข report ของผู้อื่นได้
 *           - ไม่สามารถแก้ไข report ที่ดำเนินการแล้ว (status !== PENDING)
 *       404:
 *         description: Report not found
 */

// ==========================================
// GET /api/reports/me
// ==========================================
/**
 * @swagger
 * /api/reports/me:
 *   get:
 *     summary: ดึง Report ทั้งหมดของตัวเอง
 *     description: |
 *       ดึงรายการ Report ทั้งหมดที่ผู้ใช้ที่ล็อกอินเป็นผู้สร้าง
 *       เรียงตามวันที่สร้างล่าสุดก่อน — รวม reasons และ media
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Reports retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Report'
 */

// ==========================================
// PATCH /api/reports/:id/resolve (Admin only)
// ==========================================
/**
 * @swagger
 * /api/reports/{id}/resolve:
 *   patch:
 *     summary: Admin ดำเนินการ Report (Resolve)
 *     description: |
 *       Admin เปลี่ยนสถานะ Report จาก PENDING เป็น RESOLVED
 *       ระบบจะส่ง Notification แจ้งผู้ส่ง Report ว่าเคสได้รับการดำเนินการแล้ว
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "cmrpt001"
 *         description: ID ของ Report ที่ต้องการ Resolve
 *     responses:
 *       200:
 *         description: Report resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Report resolved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *       400:
 *         description: |
 *           - Report นี้ได้รับการดำเนินการแล้ว (status === RESOLVED)
 *           - Report นี้ถูกปฏิเสธแล้ว (status === REJECTED)
 *       403:
 *         description: Forbidden — เฉพาะ ADMIN เท่านั้น
 *       404:
 *         description: Report not found
 */

// ==========================================
// PATCH /api/reports/:id/reject (Admin only)
// ==========================================
/**
 * @swagger
 * /api/reports/{id}/reject:
 *   patch:
 *     summary: Admin ปฏิเสธ Report (Reject)
 *     description: |
 *       Admin เปลี่ยนสถานะ Report จาก PENDING เป็น REJECTED พร้อมเหตุผลการปฏิเสธ (ไม่บังคับ)
 *       - ไม่สามารถปฏิเสธ Report ที่ RESOLVED หรือ REJECTED แล้วได้
 *       - ระบบจะส่ง Notification แจ้งผู้ส่ง Report ว่าเคสถูกปฏิเสธ (พร้อมเหตุผลถ้ามี)
 *       - เมื่อปฏิเสธแล้วจะไม่สามารถเปลี่ยนแปลงสถานะได้อีก
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "cmrpt001"
 *         description: ID ของ Report ที่ต้องการปฏิเสธ
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rejectionReason:
 *                 type: string
 *                 description: เหตุผลการปฏิเสธ (ไม่บังคับ)
 *                 example: "หลักฐานไม่เพียงพอ"
 *     responses:
 *       200:
 *         description: Report rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Report rejected successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *       400:
 *         description: |
 *           - Report นี้ได้รับการดำเนินการแล้ว (status === RESOLVED)
 *           - Report นี้ถูกปฏิเสธแล้ว (status === REJECTED)
 *       403:
 *         description: Forbidden — เฉพาะ ADMIN เท่านั้น
 *       404:
 *         description: Report not found
 */

// ==========================================
// GET /api/reports/admin (Admin only)
// ==========================================
/**
 * @swagger
 * /api/reports/admin:
 *   get:
 *     summary: Admin ดึง Report ทั้งหมดในระบบ
 *     description: |
 *       Admin ดึงรายการ Report ทั้งหมด พร้อมข้อมูลผู้แจ้ง, ผู้ถูกแจ้ง, เหตุผล, สื่อ, และ Booking
 *       รองรับ filter ตาม status, type, ค้นหาข้อความ และ pagination
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: ค้นหาจากชื่อ/username ของผู้แจ้งหรือผู้ถูกแจ้ง หรือ otherReasonText
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, RESOLVED, REJECTED]
 *         description: กรองตามสถานะ
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PASSENGER_REPORT_DRIVER, DRIVER_REPORT_INCIDENT]
 *         description: กรองตามประเภท
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: หน้าที่ต้องการ
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: จำนวน report ต่อหน้า
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Reports retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Report'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 5
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *       403:
 *         description: Forbidden — เฉพาะ ADMIN เท่านั้น
 */

// ==========================================
// GET /api/reports/admin/:id (Admin only)
// ==========================================
/**
 * @swagger
 * /api/reports/admin/{id}:
 *   get:
 *     summary: Admin ดึง Report ตาม ID
 *     description: |
 *       Admin ดึง Report เดียวพร้อมข้อมูลทั้งหมด รวมถึง reporter, reportedUser,
 *       reasons, media, booking และ route (driver + vehicle)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "cmrpt001"
 *         description: ID ของ Report
 *     responses:
 *       200:
 *         description: Report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Report retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *       403:
 *         description: Forbidden — เฉพาะ ADMIN เท่านั้น
 *       404:
 *         description: Report not found
 */

// ==========================================
// Enum References
// ==========================================
/**
 * @swagger
 * components:
 *   schemas:
 *     PassengerReportReasonEnum:
 *       type: string
 *       description: เหตุผลที่ผู้โดยสารใช้รายงานคนขับ
 *       enum:
 *         - FAST_DRIVING
 *         - RUDE_BEHAVIOR
 *         - RECKLESS_DRIVING
 *         - UNSAFE_DRIVING
 *         - INAPPROPRIATE_CONDUCT
 *         - OTHER
 *
 *     DriverIncidentReasonEnum:
 *       type: string
 *       description: เหตุผลที่คนขับใช้รายงานเหตุการณ์
 *       enum:
 *         - ACCIDENT
 *         - PASSENGER_MISCONDUCT
 *         - PASSENGER_NO_SHOW
 *         - PASSENGER_RUDE
 *         - DAMAGE_TO_VEHICLE
 *         - OTHER
 *
 *     ReportStatusEnum:
 *       type: string
 *       description: สถานะของ Report
 *       enum:
 *         - PENDING
 *         - RESOLVED
 *         - REJECTED
 *
 *     ReportTypeEnum:
 *       type: string
 *       description: ประเภทของ Report
 *       enum:
 *         - PASSENGER_REPORT_DRIVER
 *         - DRIVER_REPORT_INCIDENT
 */
