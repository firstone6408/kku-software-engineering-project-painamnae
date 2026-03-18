/**
 * Location Sharing API — Automated Tests (Refactored for lineLinkStatus)
 */

const request = require('supertest');

// ───────────────────── Mocks ─────────────────────

const PASSENGER_USER = { sub: 'user-id-001', role: 'PASSENGER' };
let mockCurrentUser = PASSENGER_USER;

jest.mock('../src/utils/jwt', () => ({
  signToken: jest.fn(),
  verifyToken: jest.fn(() => mockCurrentUser),
}));

jest.mock('../src/utils/lineMessaging', () => ({
  sendPushMessage: jest.fn(() => Promise.resolve()),
  sendReplyMessage: jest.fn(() => Promise.resolve()),
  buildLocationMessage: jest.fn(() => 'mock location message'),
  buildStoppedMessage: jest.fn(() => 'mock stopped message'),
  buildExpiredMessage: jest.fn(() => 'mock expired message'),
}));

jest.mock('../src/utils/googleMaps', () => ({
  reverseGeocode: jest.fn(() =>
    Promise.resolve({
      results: [{ formatted_address: 'มหาวิทยาลัยขอนแก่น, ขอนแก่น' }],
      status: 'OK',
    })
  ),
  getDirections: jest.fn(),
  geocode: jest.fn(),
}));

// ─── Mock Prisma ────
const FUTURE_DATE = new Date(Date.now() + 30 * 60 * 1000);
const PAST_DATE = new Date(Date.now() - 10 * 60 * 1000);

const FAKE_CONTACT = {
  id: 'cly0000000000000000000099',
  userId: 'user-id-001',
  name: 'มะลิ สิงหา',
  relationship: 'แม่',
  lineUserId: 'U1234567890abcdef',
  lineLinkToken: 'A3K7P2',
  lineLinkStatus: 'LINKED',
  lineLinkedAt: new Date(),
  phoneNumber: '0987654321',
  email: 'mali.s@gmail.com',
};

const FAKE_SESSION = {
  id: 'session-001',
  userId: 'user-id-001',
  durationMinutes: 30,
  intervalMinutes: 10,
  status: 'ACTIVE',
  lastLatitude: 16.4467,
  lastLongitude: 102.836,
  lastAddress: 'มหาวิทยาลัยขอนแก่น',
  lastSentAt: new Date(),
  nextSendAt: FUTURE_DATE,
  expiresAt: FUTURE_DATE,
  stoppedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  contacts: [FAKE_CONTACT],
};

const mockPrisma = {
  locationSharingSession: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  emergencyContact: {
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(() =>
      Promise.resolve({ firstName: 'ปรียา', lastName: 'ใจดี', username: 'priya' })
    ),
  },
  $queryRaw: jest.fn(),
};
jest.mock('../src/utils/prisma', () => mockPrisma);

const appModule = require('../app');
const app = appModule.default || appModule;

const VALID_TOKEN = 'Bearer fake-test-token';

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUser = PASSENGER_USER;
});

// ══════════════════════════════════════════════════════
//  1) Auth Guard
// ══════════════════════════════════════════════════════
describe('Auth Guard', () => {
  it('POST /api/location-sharing → 401 เมื่อไม่ส่ง token', async () => {
    const res = await request(app).post('/api/location-sharing');
    expect(res.statusCode).toBe(401);
  });
});

// ══════════════════════════════════════════════════════
//  2) POST /api/location-sharing
// ══════════════════════════════════════════════════════
describe('POST /api/location-sharing', () => {
  it('201 — เริ่ม session สำเร็จ', async () => {
    mockPrisma.locationSharingSession.findFirst.mockResolvedValue(null);
    mockPrisma.emergencyContact.findMany.mockResolvedValue([FAKE_CONTACT]);
    mockPrisma.locationSharingSession.create.mockResolvedValue(FAKE_SESSION);

    const res = await request(app)
      .post('/api/location-sharing')
      .set('Authorization', VALID_TOKEN)
      .send({
        contactIds: ['cly0000000000000000000099'],
        durationMinutes: 30,
        latitude: 16.4467,
        longitude: 102.836,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('400 — ไม่มี contactIds', async () => {
    const res = await request(app)
      .post('/api/location-sharing')
      .set('Authorization', VALID_TOKEN)
      .send({ durationMinutes: 30, latitude: 16.4467, longitude: 102.836 });

    expect(res.statusCode).toBe(400);
  });

  it('400 — durationMinutes ไม่ valid (7)', async () => {
    const res = await request(app)
      .post('/api/location-sharing')
      .set('Authorization', VALID_TOKEN)
      .send({
        contactIds: ['cly0000000000000000000001'],
        durationMinutes: 7,
        latitude: 16.4467,
        longitude: 102.836,
      });

    expect(res.statusCode).toBe(400);
  });

  it('400 — มี session active อยู่แล้ว', async () => {
    mockPrisma.locationSharingSession.findFirst.mockResolvedValue(FAKE_SESSION);
    mockPrisma.emergencyContact.findMany.mockResolvedValue([FAKE_CONTACT]);

    const res = await request(app)
      .post('/api/location-sharing')
      .set('Authorization', VALID_TOKEN)
      .send({
        contactIds: ['cly0000000000000000000099'],
        durationMinutes: 30,
        latitude: 16.4467,
        longitude: 102.836,
      });

    expect(res.statusCode).toBe(400);
  });
});

// ══════════════════════════════════════════════════════
//  3) PATCH /api/location-sharing/:sessionId/location
// ══════════════════════════════════════════════════════
describe('PATCH /api/location-sharing/:sessionId/location', () => {
  it('200 — อัปเดตตำแหน่งสำเร็จ', async () => {
    mockPrisma.locationSharingSession.findFirst.mockResolvedValue(FAKE_SESSION);
    mockPrisma.locationSharingSession.update.mockResolvedValue({
      ...FAKE_SESSION,
      lastLatitude: 16.45,
      lastLongitude: 102.84,
    });

    const res = await request(app)
      .patch('/api/location-sharing/session-001/location')
      .set('Authorization', VALID_TOKEN)
      .send({ latitude: 16.45, longitude: 102.84 });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('400 — session ไม่ active', async () => {
    mockPrisma.locationSharingSession.findFirst.mockResolvedValue({
      ...FAKE_SESSION,
      status: 'EXPIRED',
    });

    const res = await request(app)
      .patch('/api/location-sharing/session-001/location')
      .set('Authorization', VALID_TOKEN)
      .send({ latitude: 16.45, longitude: 102.84 });

    expect(res.statusCode).toBe(400);
  });

  it('404 — session ไม่พบ', async () => {
    mockPrisma.locationSharingSession.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/location-sharing/nonexistent/location')
      .set('Authorization', VALID_TOKEN)
      .send({ latitude: 16.45, longitude: 102.84 });

    expect(res.statusCode).toBe(404);
  });
});

// ══════════════════════════════════════════════════════
//  4) POST /api/location-sharing/:sessionId/send
// ══════════════════════════════════════════════════════
describe('POST /api/location-sharing/:sessionId/send', () => {
  it('200 — ส่ง LINE สำเร็จ', async () => {
    mockPrisma.locationSharingSession.findFirst.mockResolvedValue({
      ...FAKE_SESSION,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    mockPrisma.locationSharingSession.update.mockResolvedValue({
      ...FAKE_SESSION,
      lastSentAt: new Date(),
    });

    const res = await request(app)
      .post('/api/location-sharing/session-001/send')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('400 — session หมดอายุ (ส่ง LINE แจ้งหมดเวลา)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      firstName: 'ปรียา', lastName: 'ใจดี', username: 'priya'
    });
    mockPrisma.locationSharingSession.findFirst.mockResolvedValue({
      ...FAKE_SESSION,
      expiresAt: PAST_DATE,
      contacts: [FAKE_CONTACT],
    });
    mockPrisma.locationSharingSession.update.mockResolvedValue({
      ...FAKE_SESSION,
      status: 'EXPIRED',
    });

    const res = await request(app)
      .post('/api/location-sharing/session-001/send')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(400);
  });
});

// ══════════════════════════════════════════════════════
//  5) PATCH /api/location-sharing/:sessionId/stop
// ══════════════════════════════════════════════════════
describe('PATCH /api/location-sharing/:sessionId/stop', () => {
  it('200 — หยุด session สำเร็จ', async () => {
    mockPrisma.locationSharingSession.findFirst.mockResolvedValue(FAKE_SESSION);
    mockPrisma.locationSharingSession.update.mockResolvedValue({
      ...FAKE_SESSION,
      status: 'STOPPED',
      stoppedAt: new Date(),
    });

    const res = await request(app)
      .patch('/api/location-sharing/session-001/stop')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('404 — session ไม่พบ (ไม่ใช่ owner)', async () => {
    mockPrisma.locationSharingSession.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/location-sharing/nonexistent/stop')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(404);
  });

  it('400 — session ไม่ active', async () => {
    mockPrisma.locationSharingSession.findFirst.mockResolvedValue({
      ...FAKE_SESSION,
      status: 'STOPPED',
    });

    const res = await request(app)
      .patch('/api/location-sharing/session-001/stop')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(400);
  });
});

// ══════════════════════════════════════════════════════
//  6) GET /api/location-sharing/active
// ══════════════════════════════════════════════════════
describe('GET /api/location-sharing/active', () => {
  it('200 — ดึง session ที่ active อยู่', async () => {
    mockPrisma.locationSharingSession.findFirst.mockResolvedValue(FAKE_SESSION);

    const res = await request(app)
      .get('/api/location-sharing/active')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('200 — ไม่มี active session → data = null', async () => {
    mockPrisma.locationSharingSession.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/location-sharing/active')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeNull();
  });
});

// ══════════════════════════════════════════════════════
//  7) GET /api/location-sharing/:sessionId
// ══════════════════════════════════════════════════════
describe('GET /api/location-sharing/:sessionId', () => {
  it('200 — ดึงรายละเอียด session สำเร็จ', async () => {
    mockPrisma.locationSharingSession.findFirst.mockResolvedValue(FAKE_SESSION);

    const res = await request(app)
      .get('/api/location-sharing/session-001')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('404 — session ไม่พบ', async () => {
    mockPrisma.locationSharingSession.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/location-sharing/nonexistent')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(404);
  });
});

// ══════════════════════════════════════════════════════
//  8) GET /api/location-sharing/history
// ══════════════════════════════════════════════════════
describe('GET /api/location-sharing/history', () => {
  it('200 — ดึงประวัติ session ย้อนหลัง', async () => {
    mockPrisma.locationSharingSession.findMany.mockResolvedValue([
      { ...FAKE_SESSION, status: 'STOPPED', stoppedAt: new Date() },
      { ...FAKE_SESSION, id: 'session-002', status: 'EXPIRED' },
    ]);

    const res = await request(app)
      .get('/api/location-sharing/history')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  it('200 — ไม่มีประวัติ → ได้ array ว่าง', async () => {
    mockPrisma.locationSharingSession.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/location-sharing/history')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════
//  9) PATCH /api/location-sharing/:sessionId/expire
// ══════════════════════════════════════════════════════
describe('PATCH /api/location-sharing/:sessionId/expire', () => {
  it('200 — หมดเวลา session สำเร็จ (ส่ง LINE แจ้ง)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      firstName: 'ปรียา', lastName: 'ใจดี', username: 'priya'
    });
    mockPrisma.locationSharingSession.findFirst.mockResolvedValue(FAKE_SESSION);
    mockPrisma.locationSharingSession.update.mockResolvedValue({
      ...FAKE_SESSION,
      status: 'EXPIRED',
      nextSendAt: null,
    });

    const res = await request(app)
      .patch('/api/location-sharing/session-001/expire')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('404 — session ไม่พบ', async () => {
    mockPrisma.locationSharingSession.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/location-sharing/nonexistent/expire')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(404);
  });

  it('200 — session ที่ EXPIRED แล้ว → return ปกติ (idempotent)', async () => {
    mockPrisma.locationSharingSession.findFirst.mockResolvedValue({
      ...FAKE_SESSION,
      status: 'EXPIRED',
    });

    const res = await request(app)
      .patch('/api/location-sharing/session-001/expire')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
