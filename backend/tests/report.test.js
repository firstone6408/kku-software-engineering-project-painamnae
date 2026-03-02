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
    count: jest.fn(),
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
  $transaction: jest.fn((fn) => {
    if (typeof fn === 'function') return fn(mockPrisma);
    return Promise.all(fn);
  }),
  $queryRaw: jest.fn(),
};
jest.mock('../src/utils/prisma', () => mockPrisma);

// ─── Load app AFTER mocks are set up ───
const appModule = require('../app');
const app = appModule.default || appModule;

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

  it('201 — driver ก็สามารถสร้าง passenger report ได้ (เช่น driver จองเดินทางเป็นผู้โดยสาร)', async () => {
    mockCurrentUser = DRIVER_USER;
    mockPrisma.report.findFirst.mockResolvedValue(null);
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

  it('201 — passenger ก็สามารถสร้าง driver report ได้', async () => {
    mockCurrentUser = PASSENGER_USER;
    const driverReport = {
      ...FAKE_REPORT,
      id: 'report-003',
      type: 'DRIVER_REPORT_INCIDENT',
      reasons: [{ id: 'r3', driverReason: 'PASSENGER_RUDE' }],
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

// ══════════════════════════════════════════════════════
//  6b) PATCH /api/reports/:id/reject  (Admin only)
// ══════════════════════════════════════════════════════
describe('PATCH /api/reports/:id/reject', () => {
  it('200 — Admin reject report สำเร็จ', async () => {
    mockCurrentUser = ADMIN_USER;
    const pendingReport = { ...FAKE_REPORT, status: 'PENDING' };
    mockPrisma.report.findUnique.mockResolvedValue(pendingReport);
    mockPrisma.report.update.mockResolvedValue({ ...pendingReport, status: 'REJECTED' });
    mockPrisma.notification.create.mockResolvedValue({});

    const res = await request(app)
      .patch('/api/reports/report-001/reject')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('200 — Admin reject พร้อมเหตุผล', async () => {
    mockCurrentUser = ADMIN_USER;
    const pendingReport = { ...FAKE_REPORT, status: 'PENDING' };
    mockPrisma.report.findUnique.mockResolvedValue(pendingReport);
    mockPrisma.report.update.mockResolvedValue({ ...pendingReport, status: 'REJECTED', rejectionReason: 'หลักฐานไม่เพียงพอ' });
    mockPrisma.notification.create.mockResolvedValue({});

    const res = await request(app)
      .patch('/api/reports/report-001/reject')
      .set('Authorization', VALID_TOKEN)
      .send({ rejectionReason: 'หลักฐานไม่เพียงพอ' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('400 — report ที่ RESOLVED แล้ว reject ไม่ได้', async () => {
    mockCurrentUser = ADMIN_USER;
    mockPrisma.report.findUnique.mockResolvedValue({ ...FAKE_REPORT, status: 'RESOLVED' });

    const res = await request(app)
      .patch('/api/reports/report-001/reject')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(400);
  });

  it('403 — non-admin ไม่สามารถ reject', async () => {
    mockCurrentUser = PASSENGER_USER;

    const res = await request(app)
      .patch('/api/reports/report-001/reject')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(403);
  });
});

// ══════════════════════════════════════════════════════
//  7) GET /api/reports/admin  (Admin only)
// ══════════════════════════════════════════════════════
describe('GET /api/reports/admin', () => {
  const FAKE_ADMIN_REPORT = {
    ...FAKE_REPORT,
    reporter: { id: 'passenger-user-id-001', username: 'passenger1', firstName: 'สมศรี', lastName: 'ใจดี', email: 'test@test.com', role: 'PASSENGER', profilePicture: null },
    reportedUser: { id: 'driver-user-id-001', username: 'driver1', firstName: 'นาโมเน', lastName: 'อำรุง', email: 'driver@test.com', role: 'DRIVER', profilePicture: null },
    booking: { id: 'booking-001', route: { id: 'route-001', startLocation: { name: 'มข.' }, endLocation: { name: 'บขส.' }, departureTime: new Date() } },
  };

  it('200 — Admin ดึง report ทั้งหมดสำเร็จ', async () => {
    mockCurrentUser = ADMIN_USER;
    mockPrisma.report.count.mockResolvedValue(1);
    mockPrisma.report.findMany.mockResolvedValue([FAKE_ADMIN_REPORT]);

    const res = await request(app)
      .get('/api/reports/admin')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(1);
  });

  it('200 — ส่ง query filter status=PENDING ได้', async () => {
    mockCurrentUser = ADMIN_USER;
    mockPrisma.report.count.mockResolvedValue(1);
    mockPrisma.report.findMany.mockResolvedValue([FAKE_ADMIN_REPORT]);

    const res = await request(app)
      .get('/api/reports/admin?status=PENDING')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('403 — non-admin ไม่สามารถเข้าถึง', async () => {
    mockCurrentUser = PASSENGER_USER;

    const res = await request(app)
      .get('/api/reports/admin')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(403);
  });
});

// ══════════════════════════════════════════════════════
//  8) GET /api/reports/admin/:id  (Admin only)
// ══════════════════════════════════════════════════════
describe('GET /api/reports/admin/:id', () => {
  const FAKE_DETAIL_REPORT = {
    ...FAKE_REPORT,
    reporter: { id: 'passenger-user-id-001', username: 'passenger1', firstName: 'สมศรี', lastName: 'ใจดี', email: 'test@test.com', role: 'PASSENGER', profilePicture: null },
    reportedUser: { id: 'driver-user-id-001', username: 'driver1', firstName: 'นาโมเน', lastName: 'อำรุง', email: 'driver@test.com', role: 'DRIVER', profilePicture: null },
    booking: {
      id: 'booking-001',
      route: {
        id: 'route-001',
        startLocation: { name: 'มข.' },
        endLocation: { name: 'บขส.' },
        departureTime: new Date(),
        driver: { id: 'driver-user-id-001', username: 'driver1', firstName: 'นาโมเน', lastName: 'อำรุง' },
        vehicle: { id: 'vehicle-001', vehicleModel: 'Toyota Yaris', vehicleType: 'Sedan', licensePlate: 'กข 1234' },
      },
    },
  };

  it('200 — Admin ดึง report detail สำเร็จ', async () => {
    mockCurrentUser = ADMIN_USER;
    mockPrisma.report.findUnique.mockResolvedValue(FAKE_DETAIL_REPORT);

    const res = await request(app)
      .get('/api/reports/admin/report-001')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.reporter).toBeDefined();
    expect(res.body.data.booking).toBeDefined();
  });

  it('404 — report ไม่พบ', async () => {
    mockCurrentUser = ADMIN_USER;
    mockPrisma.report.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/reports/admin/nonexistent-id')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(404);
  });

  it('403 — non-admin ไม่สามารถเข้าถึง', async () => {
    mockCurrentUser = PASSENGER_USER;

    const res = await request(app)
      .get('/api/reports/admin/report-001')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(403);
  });
});
