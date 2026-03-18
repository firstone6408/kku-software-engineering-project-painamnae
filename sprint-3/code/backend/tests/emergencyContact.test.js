/**
 * Emergency Contact API — Automated Tests (Refactored for name + lineLinkToken)
 */

const request = require('supertest');

// ───────────────────── Mocks ─────────────────────

const PASSENGER_USER = { sub: 'user-id-001', role: 'PASSENGER' };
let mockCurrentUser = PASSENGER_USER;

jest.mock('../src/utils/jwt', () => ({
  signToken: jest.fn(),
  verifyToken: jest.fn(() => mockCurrentUser),
}));

// ─── Mock Prisma ────
const FAKE_CONTACT = {
  id: 'cly0000000000000000000001',
  userId: 'user-id-001',
  name: 'มะลิ สิงหา',
  relationship: 'แม่',
  lineUserId: null,
  lineLinkToken: 'A3K7P2',
  lineLinkStatus: 'PENDING',
  lineLinkedAt: null,
  phoneNumber: '0987654321',
  email: 'mali.s@gmail.com',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  emergencyContact: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $queryRaw: jest.fn(),
};
jest.mock('../src/utils/prisma', () => mockPrisma);

// ─── Load app AFTER mocks ───
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
  it('GET /api/emergency-contacts/me → 401 เมื่อไม่ส่ง token', async () => {
    const res = await request(app).get('/api/emergency-contacts/me');
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/emergency-contacts → 401 เมื่อ token ไม่ถูกต้อง', async () => {
    mockCurrentUser = null;
    const res = await request(app)
      .post('/api/emergency-contacts')
      .set('Authorization', 'Bearer bad-token');
    expect(res.statusCode).toBe(401);
  });
});

// ══════════════════════════════════════════════════════
//  2) POST /api/emergency-contacts
// ══════════════════════════════════════════════════════
describe('POST /api/emergency-contacts', () => {
  it('201 — สร้าง contact สำเร็จ (มี lineLinkToken กลับมา)', async () => {
    mockPrisma.emergencyContact.findUnique.mockResolvedValue(null); // token unique
    mockPrisma.emergencyContact.create.mockResolvedValue(FAKE_CONTACT);

    const res = await request(app)
      .post('/api/emergency-contacts')
      .set('Authorization', VALID_TOKEN)
      .send({
        name: 'มะลิ สิงหา',
        relationship: 'แม่',
        phoneNumber: '0987654321',
        email: 'mali.s@gmail.com',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('400 — ข้อมูลไม่ครบ (missing name)', async () => {
    const res = await request(app)
      .post('/api/emergency-contacts')
      .set('Authorization', VALID_TOKEN)
      .send({
        relationship: 'แม่',
        phoneNumber: '0987654321',
        email: 'mali.s@gmail.com',
      });

    expect(res.statusCode).toBe(400);
  });

  it('400 — email ไม่ valid', async () => {
    const res = await request(app)
      .post('/api/emergency-contacts')
      .set('Authorization', VALID_TOKEN)
      .send({
        name: 'มะลิ สิงหา',
        relationship: 'แม่',
        phoneNumber: '0987654321',
        email: 'not-an-email',
      });

    expect(res.statusCode).toBe(400);
  });
});

// ══════════════════════════════════════════════════════
//  3) GET /api/emergency-contacts/me
// ══════════════════════════════════════════════════════
describe('GET /api/emergency-contacts/me', () => {
  it('200 — ดึงรายชื่อทั้งหมดสำเร็จ', async () => {
    mockPrisma.emergencyContact.findMany.mockResolvedValue([FAKE_CONTACT]);

    const res = await request(app)
      .get('/api/emergency-contacts/me')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('200 — ไม่มี contact → ได้ array ว่าง', async () => {
    mockPrisma.emergencyContact.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/emergency-contacts/me')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════
//  4) GET /api/emergency-contacts/:id
// ══════════════════════════════════════════════════════
describe('GET /api/emergency-contacts/:id', () => {
  it('200 — ดึง contact สำเร็จ', async () => {
    mockPrisma.emergencyContact.findFirst.mockResolvedValue(FAKE_CONTACT);

    const res = await request(app)
      .get(`/api/emergency-contacts/${FAKE_CONTACT.id}`)
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('404 — ไม่พบ contact', async () => {
    mockPrisma.emergencyContact.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/emergency-contacts/nonexistent')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(404);
  });
});

// ══════════════════════════════════════════════════════
//  5) PUT /api/emergency-contacts/:id
// ══════════════════════════════════════════════════════
describe('PUT /api/emergency-contacts/:id', () => {
  it('200 — แก้ไข contact สำเร็จ', async () => {
    mockPrisma.emergencyContact.findFirst.mockResolvedValue(FAKE_CONTACT);
    mockPrisma.emergencyContact.update.mockResolvedValue({
      ...FAKE_CONTACT,
      name: 'มะลิ ใจดี',
    });

    const res = await request(app)
      .put(`/api/emergency-contacts/${FAKE_CONTACT.id}`)
      .set('Authorization', VALID_TOKEN)
      .send({ name: 'มะลิ ใจดี' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('404 — ไม่พบ contact (ไม่ใช่ owner)', async () => {
    mockPrisma.emergencyContact.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/emergency-contacts/nonexistent')
      .set('Authorization', VALID_TOKEN)
      .send({ name: 'test' });

    expect(res.statusCode).toBe(404);
  });

  it('400 — email ไม่ valid', async () => {
    const res = await request(app)
      .put(`/api/emergency-contacts/${FAKE_CONTACT.id}`)
      .set('Authorization', VALID_TOKEN)
      .send({ email: 'bad-email' });

    expect(res.statusCode).toBe(400);
  });
});

// ══════════════════════════════════════════════════════
//  6) DELETE /api/emergency-contacts/:id
// ══════════════════════════════════════════════════════
describe('DELETE /api/emergency-contacts/:id', () => {
  it('200 — ลบ contact สำเร็จ', async () => {
    mockPrisma.emergencyContact.findFirst.mockResolvedValue(FAKE_CONTACT);
    mockPrisma.emergencyContact.delete.mockResolvedValue(FAKE_CONTACT);

    const res = await request(app)
      .delete(`/api/emergency-contacts/${FAKE_CONTACT.id}`)
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('404 — ไม่พบ contact', async () => {
    mockPrisma.emergencyContact.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/emergency-contacts/nonexistent')
      .set('Authorization', VALID_TOKEN);

    expect(res.statusCode).toBe(404);
  });
});
