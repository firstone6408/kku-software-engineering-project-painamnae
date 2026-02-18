/**
 * Report API — Automated Tests
 *
 * เทสทั้ง 5 endpoint:
 *   POST   /api/reports/driver       — คนขับรายงานเหตุการณ์
 *   POST   /api/reports/passenger    — ผู้โดยสารรายงานคนขับ
 *   GET    /api/reports/me           — ดึง report ของตัวเอง
 *   PUT    /api/reports/:id          — แก้ไข report (owner เท่านั้น, PENDING only)
 *   PATCH  /api/reports/:id/resolve  — Admin resolve report
 *
 * Strategy:
 *   - Mock JWT verifyToken → bypass auth ด้วย fake user
 *   - Mock Prisma client → ไม่ต้องเชื่อม DB จริง
 *   - Mock Cloudinary upload → ไม่ต้องอัปโหลดจริง
 */

const request = require('supertest');

// ───────────────────── Mocks ─────────────────────

// Mock JWT
const DRIVER_USER = { sub: 'driver-user-id-001', role: 'DRIVER' };
const PASSENGER_USER = { sub: 'passenger-user-id-001', role: 'PASSENGER' };
const ADMIN_USER = { sub: 'admin-user-id-001', role: 'ADMIN' };

let mockCurrentUser = PASSENGER_USER; // เปลี่ยนได้ในแต่ละ test

jest.mock('../src/utils/jwt', () => ({
  signToken: jest.fn(),
  verifyToken: jest.fn(() => mockCurrentUser),
}));

// Mock Cloudinary upload
jest.mock('../src/utils/cloudinary', () => ({
  uploadToCloudinary: jest.fn(() =>
    Promise.resolve({ url: 'https://cdn.test/img.jpg', public_id: 'test-id' })
  ),
}));

// ─── Mock Prisma ────
const mockPrisma = {
  report: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  reportReason: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  reportMedia: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
  $transaction: jest.fn((fn) => fn(mockPrisma)),
  $queryRaw: jest.fn(),
};
jest.mock('../src/utils/prisma', () => mockPrisma);

// ─── Load app AFTER mocks are set up ───
const app = require('../app');

// ─────────── Helpers ───────────
const VALID_TOKEN = 'Bearer fake-test-token';

const FAKE_REPORT = {
  id: 'report-001',
  reporterId: 'passenger-user-id-001',
  bookingId: 'booking-001',
  type: 'PASSENGER_REPORT_DRIVER',
  status: 'PENDING',
  reasons: [{ id: 'r1', passengerReason: 'RUDE_BEHAVIOR' }],
  media: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ───── Reset mocks before each test ─────
beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUser = PASSENGER_USER; // default
});

// ══════════════════════════════════════════════════════
//  1) Auth — ไม่มี token / token ผิด
// ══════════════════════════════════════════════════════
describe('Auth Guard', () => {
  it('GET /api/reports/me → 401 เมื่อไม่ส่ง token', async () => {
    const res = await request(app).get('/api/reports/me');
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/reports/driver → 401 เมื่อ token ไม่ถูกต้อง', async () => {
    const { verifyToken } = require('../src/utils/jwt');
    verifyToken.mockImplementationOnce(() => {
      throw new Error('invalid token');
    });

    const res = await request(app)
      .post('/api/reports/driver')
      .set('Authorization', 'Bearer bad-token')
      .send({});

    expect(res.statusCode).toBe(401);
  });
});

// ══════════════════════════════════════════════════════
//  2) POST /api/reports/passenger
// ══════════════════════════════════════════════════════
describe('POST /api/reports/passenger', () => {
  it('201 — ผู้โดยสารสร้าง report สำเร็จ', async () => {
    mockCurrentUser = PASSENGER_USER;
    mockPrisma.report.findFirst.mockResolvedValue(null); // ยังไม่เคยรายงาน
    mockPrisma.report.create.mockResolvedValue(FAKE_REPORT);
    mockPrisma.report.findUnique.mockResolvedValue(FAKE_REPORT);
    mockPrisma.reportReason.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.notification.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/reports/passenger')
      .set('Authorization', VALID_TOKEN)
      .field('reportedUserId', 'cly0000000000000000000001')
      .field('bookingId', 'cly0000000000000000000002')
      .field('passengerReasons', JSON.stringify(['RUDE_BEHAVIOR']));

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('403 — driver ไม่สามารถใช้ endpoint นี้', async () => {
    mockCurrentUser = DRIVER_USER;

    const res = await request(app)
      .post('/api/reports/passenger')
      .set('Authorization', VALID_TOKEN)
      .field('bookingId', 'cly0000000000000000000002')
      .field('passengerReasons', JSON.stringify(['RUDE_BEHAVIOR']));

    expect(res.statusCode).toBe(403);
  });
});

// ══════════════════════════════════════════════════════
//  3) POST /api/reports/driver
// ══════════════════════════════════════════════════════
describe('POST /api/reports/driver', () => {
  it('201 — คนขับสร้าง report สำเร็จ', async () => {
    mockCurrentUser = DRIVER_USER;
    const driverReport = {
      ...FAKE_REPORT,
      id: 'report-002',
      reporterId: 'driver-user-id-001',
      type: 'DRIVER_REPORT_INCIDENT',
      reasons: [{ id: 'r2', driverReason: 'PASSENGER_RUDE' }],
    };
    mockPrisma.report.findFirst.mockResolvedValue(null);
    mockPrisma.report.create.mockResolvedValue(driverReport);
    mockPrisma.report.findUnique.mockResolvedValue(driverReport);
    mockPrisma.reportReason.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.notification.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/reports/driver')
      .set('Authorization', VALID_TOKEN)
      .field('bookingId', 'cly0000000000000000000002')
      .field('driverReasons', JSON.stringify(['PASSENGER_RUDE']));

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('403 — passenger ไม่สามารถใช้ endpoint นี้', async () => {
    mockCurrentUser = PASSENGER_USER;

    const res = await request(app)
      .post('/api/reports/driver')
      .set('Authorization', VALID_TOKEN)
      .field('bookingId', 'cly0000000000000000000002')
      .field('driverReasons', JSON.stringify(['PASSENGER_RUDE']));

    expect(res.statusCode).toBe(403);
  });

  it('400 — ส่ง report ซ้ำบน booking เดียวกัน', async () => {
    mockCurrentUser = DRIVER_USER;
    mockPrisma.report.findFirst.mockResolvedValue(FAKE_REPORT); // มีอยู่แล้ว

    const res = await request(app)
      .post('/api/reports/driver')
      .set('Authorization', VALID_TOKEN)
      .field('bookingId', 'cly0000000000000000000002')
      .field('driverReasons', JSON.stringify(['PASSENGER_RUDE']));

    expect(res.statusCode).toBe(400);
  });
});

// ══════════════════════════════════════════════════════
//  4) GET /api/reports/me
// ══════════════════════════════════════════════════════
describe('GET /api/reports/me', () => {
  it('200 — ดึงรายการ report ของ user สำเร็จ', async () => {
    mockCurrentUser = PASSENGER_USER;
    mockPrisma.report.findMany.mockResolvedValue([FAKE_REPORT]);

    const res = await request(app)
      .get('/api/reports/me')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('200 — user ไม่มี report → ได้ array ว่าง', async () => {
    mockCurrentUser = PASSENGER_USER;
    mockPrisma.report.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/reports/me')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════
//  5) PUT /api/reports/:id
// ══════════════════════════════════════════════════════
describe('PUT /api/reports/:id', () => {
  it('200 — owner แก้ไข report PENDING สำเร็จ', async () => {
    mockCurrentUser = PASSENGER_USER;
    const pendingReport = { ...FAKE_REPORT, status: 'PENDING' };
    mockPrisma.report.findUnique
      .mockResolvedValueOnce(pendingReport)      // ใช้ตอน check ownership
      .mockResolvedValueOnce(pendingReport);      // ใช้ตอน return
    mockPrisma.report.update.mockResolvedValue(pendingReport);
    mockPrisma.reportReason.deleteMany.mockResolvedValue({});
    mockPrisma.reportReason.createMany.mockResolvedValue({ count: 1 });

    const res = await request(app)
      .put('/api/reports/report-001')
      .set('Authorization', VALID_TOKEN)
      .field('reasons', JSON.stringify(['RUDE_BEHAVIOR']))
      .field('otherReasonText', 'เพิ่มเติม');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('403 — ไม่ใช่ owner แก้ไขไม่ได้', async () => {
    mockCurrentUser = DRIVER_USER; // user ต่างคน
    const otherReport = { ...FAKE_REPORT, reporterId: 'someone-else' };
    mockPrisma.report.findUnique.mockResolvedValue(otherReport);

    const res = await request(app)
      .put('/api/reports/report-001')
      .set('Authorization', VALID_TOKEN)
      .field('reasons', JSON.stringify(['PASSENGER_RUDE']));

    expect(res.statusCode).toBe(403);
  });

  it('404 — report ไม่พบ', async () => {
    mockCurrentUser = PASSENGER_USER;
    mockPrisma.report.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/reports/nonexistent-id')
      .set('Authorization', VALID_TOKEN)
      .field('reasons', JSON.stringify(['RUDE_BEHAVIOR']));

    expect(res.statusCode).toBe(404);
  });

  it('403 — report ที่ RESOLVED แก้ไขไม่ได้', async () => {
    mockCurrentUser = PASSENGER_USER;
    const resolvedReport = { ...FAKE_REPORT, status: 'RESOLVED' };
    mockPrisma.report.findUnique.mockResolvedValue(resolvedReport);

    const res = await request(app)
      .put('/api/reports/report-001')
      .set('Authorization', VALID_TOKEN)
      .field('reasons', JSON.stringify(['RUDE_BEHAVIOR']));

    expect(res.statusCode).toBe(403);
  });
});

// ══════════════════════════════════════════════════════
//  6) PATCH /api/reports/:id/resolve  (Admin only)
// ══════════════════════════════════════════════════════
describe('PATCH /api/reports/:id/resolve', () => {
  it('200 — Admin resolve report สำเร็จ', async () => {
    mockCurrentUser = ADMIN_USER;
    const pendingReport = { ...FAKE_REPORT, status: 'PENDING' };
    const resolvedReport = { ...FAKE_REPORT, status: 'RESOLVED' };
    mockPrisma.report.findUnique.mockResolvedValue(pendingReport);
    mockPrisma.report.update.mockResolvedValue(resolvedReport);
    mockPrisma.notification.create.mockResolvedValue({});

    const res = await request(app)
      .patch('/api/reports/report-001/resolve')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('403 — non-admin ไม่สามารถ resolve', async () => {
    mockCurrentUser = PASSENGER_USER;

    const res = await request(app)
      .patch('/api/reports/report-001/resolve')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(403);
  });

  it('404 — report ไม่พบ', async () => {
    mockCurrentUser = ADMIN_USER;
    mockPrisma.report.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/reports/nonexistent-id/resolve')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(404);
  });

  it('400 — report ที่ RESOLVED แล้ว resolve ซ้ำไม่ได้', async () => {
    mockCurrentUser = ADMIN_USER;
    const alreadyResolved = { ...FAKE_REPORT, status: 'RESOLVED' };
    mockPrisma.report.findUnique.mockResolvedValue(alreadyResolved);

    const res = await request(app)
      .patch('/api/reports/report-001/resolve')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(400);
  });
});
