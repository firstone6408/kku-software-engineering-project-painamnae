/**
 * LINE Webhook API — Automated Tests
 *
 * Endpoint: POST /api/line-webhook
 *
 * Strategy:
 *   - Mock Prisma → ไม่ต้องเชื่อม DB จริง
 *   - Mock LINE replyMessage → ไม่ส่งจริง
 *   - ไม่ต้อง auth → LINE เรียกมาเอง
 */

const request = require('supertest');

// ───────────────────── Mocks ─────────────────────

// Mock JWT (still needed because app loads auth middleware)
jest.mock('../src/utils/jwt', () => ({
  signToken: jest.fn(),
  verifyToken: jest.fn(() => null),
}));

// Mock LINE Messaging
jest.mock('../src/utils/lineMessaging', () => ({
  sendPushMessage: jest.fn(() => Promise.resolve()),
  sendReplyMessage: jest.fn(() => Promise.resolve()),
  buildLocationMessage: jest.fn(() => 'mock location message'),
  buildStoppedMessage: jest.fn(() => 'mock stopped message'),
}));

const { sendReplyMessage } = require('../src/utils/lineMessaging');

// Mock Google Maps
jest.mock('../src/utils/googleMaps', () => ({
  reverseGeocode: jest.fn(),
  getDirections: jest.fn(),
  geocode: jest.fn(),
}));

// ─── Mock Prisma ────
const FAKE_CONTACT_PENDING = {
  id: 'contact-001',
  userId: 'user-id-001',
  name: 'มะลิ สิงหา',
  relationship: 'แม่',
  lineUserId: null,
  lineLinkToken: 'A3K7P2',
  lineLinkStatus: 'PENDING',
  lineLinkedAt: null,
  phoneNumber: '0987654321',
  email: 'mali.s@gmail.com',
};

const FAKE_CONTACT_LINKED = {
  ...FAKE_CONTACT_PENDING,
  lineUserId: 'U9902de5e64de9a107a11812b09926182',
  lineLinkStatus: 'LINKED',
  lineLinkedAt: new Date(),
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
  user: {
    findUnique: jest.fn(() =>
      Promise.resolve({ firstName: 'ปรียา', lastName: 'ใจดี', username: 'priya' })
    ),
  },
  $queryRaw: jest.fn(),
};
jest.mock('../src/utils/prisma', () => mockPrisma);

// ─── Load app AFTER mocks ───
const appModule = require('../app');
const app = appModule.default || appModule;

beforeEach(() => {
  jest.clearAllMocks();
});

// ══════════════════════════════════════════════════════
//  1) follow event — ส่ง welcome message
// ══════════════════════════════════════════════════════
describe('POST /api/line-webhook — follow event', () => {
  it('200 — ตอบกลับ welcome message', async () => {
    const res = await request(app)
      .post('/api/line-webhook')
      .send({
        events: [
          {
            type: 'follow',
            replyToken: 'reply-token-001',
            source: { type: 'user', userId: 'U9902de5e64de9a107a11812b09926182' },
          },
        ],
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // ให้เวลา async handler ทำงาน
    await new Promise((r) => setTimeout(r, 100));

    expect(sendReplyMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        replyToken: 'reply-token-001',
      })
    );
  });
});

// ══════════════════════════════════════════════════════
//  2) message event — token ถูกต้อง → link สำเร็จ
// ══════════════════════════════════════════════════════
describe('POST /api/line-webhook — message event', () => {
  it('200 — token ถูกต้อง → link สำเร็จ', async () => {
    mockPrisma.emergencyContact.findUnique.mockResolvedValue(FAKE_CONTACT_PENDING);
    mockPrisma.emergencyContact.update.mockResolvedValue(FAKE_CONTACT_LINKED);

    const res = await request(app)
      .post('/api/line-webhook')
      .send({
        events: [
          {
            type: 'message',
            message: { type: 'text', text: 'A3K7P2' },
            replyToken: 'reply-token-002',
            source: { type: 'user', userId: 'U9902de5e64de9a107a11812b09926182' },
          },
        ],
      });

    expect(res.statusCode).toBe(200);

    await new Promise((r) => setTimeout(r, 100));

    expect(mockPrisma.emergencyContact.findUnique).toHaveBeenCalledWith({
      where: { lineLinkToken: 'A3K7P2' },
    });
    expect(mockPrisma.emergencyContact.update).toHaveBeenCalledWith({
      where: { id: 'contact-001' },
      data: expect.objectContaining({
        lineUserId: 'U9902de5e64de9a107a11812b09926182',
        lineLinkStatus: 'LINKED',
      }),
    });
  });

  it('200 — token ผิด → reply error', async () => {
    mockPrisma.emergencyContact.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/line-webhook')
      .send({
        events: [
          {
            type: 'message',
            message: { type: 'text', text: 'WRONGX' },
            replyToken: 'reply-token-003',
            source: { type: 'user', userId: 'U9902de5e64de9a107a11812b09926182' },
          },
        ],
      });

    expect(res.statusCode).toBe(200);

    await new Promise((r) => setTimeout(r, 100));

    expect(sendReplyMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        replyToken: 'reply-token-003',
        messages: expect.arrayContaining([
          expect.objectContaining({ text: expect.stringContaining('ไม่พบรหัส') }),
        ]),
      })
    );
  });

  it('200 — contact ที่ LINKED แล้ว → ไม่ reply (ประหยัด limit)', async () => {
    mockPrisma.emergencyContact.findUnique.mockResolvedValue(FAKE_CONTACT_LINKED);

    const res = await request(app)
      .post('/api/line-webhook')
      .send({
        events: [
          {
            type: 'message',
            message: { type: 'text', text: 'A3K7P2' },
            replyToken: 'reply-token-004',
            source: { type: 'user', userId: 'U9902de5e64de9a107a11812b09926182' },
          },
        ],
      });

    expect(res.statusCode).toBe(200);

    await new Promise((r) => setTimeout(r, 100));

    // ไม่ควร reply เพราะ LINKED แล้ว
    expect(sendReplyMessage).not.toHaveBeenCalled();
    // ไม่ควร update DB
    expect(mockPrisma.emergencyContact.update).not.toHaveBeenCalled();
  });

  it('200 — token ที่พิมพ์ตัวเล็ก → ยัง match ได้ (uppercase)', async () => {
    mockPrisma.emergencyContact.findUnique.mockResolvedValue(FAKE_CONTACT_PENDING);
    mockPrisma.emergencyContact.update.mockResolvedValue(FAKE_CONTACT_LINKED);

    const res = await request(app)
      .post('/api/line-webhook')
      .send({
        events: [
          {
            type: 'message',
            message: { type: 'text', text: '  a3k7p2  ' },
            replyToken: 'reply-token-005',
            source: { type: 'user', userId: 'U9902de5e64de9a107a11812b09926182' },
          },
        ],
      });

    expect(res.statusCode).toBe(200);

    await new Promise((r) => setTimeout(r, 100));

    expect(mockPrisma.emergencyContact.findUnique).toHaveBeenCalledWith({
      where: { lineLinkToken: 'A3K7P2' },
    });
  });
});

// ══════════════════════════════════════════════════════
//  3) unfollow event — set UNLINKED
// ══════════════════════════════════════════════════════
describe('POST /api/line-webhook — unfollow event', () => {
  it('200 — ลบ lineUserId + set UNLINKED', async () => {
    mockPrisma.emergencyContact.findMany.mockResolvedValue([FAKE_CONTACT_LINKED]);
    mockPrisma.emergencyContact.update.mockResolvedValue({
      ...FAKE_CONTACT_LINKED,
      lineUserId: null,
      lineLinkStatus: 'UNLINKED',
    });

    const res = await request(app)
      .post('/api/line-webhook')
      .send({
        events: [
          {
            type: 'unfollow',
            source: { type: 'user', userId: 'U9902de5e64de9a107a11812b09926182' },
          },
        ],
      });

    expect(res.statusCode).toBe(200);

    await new Promise((r) => setTimeout(r, 100));

    expect(mockPrisma.emergencyContact.findMany).toHaveBeenCalledWith({
      where: { lineUserId: 'U9902de5e64de9a107a11812b09926182' },
    });
    expect(mockPrisma.emergencyContact.update).toHaveBeenCalledWith({
      where: { id: FAKE_CONTACT_LINKED.id },
      data: expect.objectContaining({
        lineUserId: null,
        lineLinkStatus: 'UNLINKED',
        lineLinkedAt: null,
      }),
    });
  });
});

// ══════════════════════════════════════════════════════
//  4) Edge cases
// ══════════════════════════════════════════════════════
describe('POST /api/line-webhook — edge cases', () => {
  it('200 — empty events array', async () => {
    const res = await request(app)
      .post('/api/line-webhook')
      .send({ events: [] });

    expect(res.statusCode).toBe(200);
  });

  it('200 — no events field', async () => {
    const res = await request(app)
      .post('/api/line-webhook')
      .send({});

    expect(res.statusCode).toBe(200);
  });

  it('200 — unknown event type → ignored', async () => {
    const res = await request(app)
      .post('/api/line-webhook')
      .send({
        events: [{ type: 'postback', data: 'test' }],
      });

    expect(res.statusCode).toBe(200);
  });
});
