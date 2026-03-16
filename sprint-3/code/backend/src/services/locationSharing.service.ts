import prisma from '../utils/prisma';
import ApiError from '../utils/ApiError';
import { StartSharingInput, UpdateLocationInput } from '../validations/locationSharing.validation';
import { sendPushMessage, buildLocationMessage, buildStoppedMessage } from '../utils/lineMessaging';
import { EmergencyContact } from '@prisma/client';
import { reverseGeocode } from '../utils/googleMaps';

const INTERVAL_MINUTES = 10; // ความถี่ในการส่ง (fixed)

/**
 * แปลง lat,lng เป็นที่อยู่ภาษาไทย
 */
const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
  try {
    const data = await reverseGeocode(lat, lng);
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    return `${lat}, ${lng}`;
  } catch {
    return `${lat}, ${lng}`;
  }
};

/**
 * ดึงชื่อ user สำหรับแสดงในข้อความ
 */
const getUserDisplayName = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, username: true },
  });
  if (!user) return 'ผู้ใช้';
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  return user.username;
};

/**
 * เริ่ม session แจ้งตำแหน่ง + ส่ง LINE ครั้งแรก
 */
export const startSession = async (userId: string, data: StartSharingInput) => {
  // ตรวจสอบว่ามี session ที่ active อยู่หรือไม่
  const existingSession = await prisma.locationSharingSession.findFirst({
    where: { userId, status: 'ACTIVE' },
  });

  if (existingSession) {
    throw new ApiError(400, 'คุณมี session แจ้งตำแหน่งที่กำลังทำงานอยู่แล้ว');
  }

  // ตรวจสอบว่า contacts เป็นของ user จริง
  const contacts = await prisma.emergencyContact.findMany({
    where: { id: { in: data.contactIds }, userId },
  });

  if (contacts.length === 0) {
    throw new ApiError(400, 'ไม่พบผู้ติดต่อฉุกเฉินที่เลือก');
  }

  if (contacts.length !== data.contactIds.length) {
    throw new ApiError(400, 'ผู้ติดต่อบางคนไม่พบในระบบ');
  }

  // ตรวจสอบว่ามี contact ที่ LINKED อย่างน้อย 1 คน
  const linkedContacts = contacts.filter((c: EmergencyContact) => c.lineLinkStatus === 'LINKED' && c.lineUserId);
  if (linkedContacts.length === 0) {
    throw new ApiError(400, 'ผู้ติดต่อที่เลือกยังไม่ได้เชื่อมต่อ LINE กรุณาให้ผู้ติดต่อเพิ่มเพื่อนใน LINE OA ก่อน');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + data.durationMinutes * 60 * 1000);
  const nextSendAt = new Date(now.getTime() + INTERVAL_MINUTES * 60 * 1000);

  // reverse geocode ตำแหน่งปัจจุบัน
  const address = await getAddressFromCoords(data.latitude, data.longitude);

  // สร้าง session
  const session = await prisma.locationSharingSession.create({
    data: {
      userId,
      durationMinutes: data.durationMinutes,
      intervalMinutes: INTERVAL_MINUTES,
      status: 'ACTIVE',
      lastLatitude: data.latitude,
      lastLongitude: data.longitude,
      lastAddress: address,
      lastSentAt: now,
      nextSendAt: nextSendAt > expiresAt ? null : nextSendAt,
      expiresAt,
      contacts: {
        connect: data.contactIds.map((id) => ({ id })),
      },
    },
    include: { contacts: true },
  });

  // ส่ง LINE ข้อความแรกทันที (เฉพาะ LINKED contacts)
  const userName = await getUserDisplayName(userId);
  const isLast = data.durationMinutes <= INTERVAL_MINUTES;
  const messageText = buildLocationMessage(userName, address, data.latitude, data.longitude, INTERVAL_MINUTES, isLast);

  const sendPromises = linkedContacts.map((contact: EmergencyContact) =>
    sendPushMessage({
      lineUserId: contact.lineUserId!,
      messages: [{ type: 'text', text: messageText }],
    }).catch((err) => {
      console.error(`[LINE] Failed to send to ${contact.lineUserId}:`, err.message);
    })
  );

  await Promise.allSettled(sendPromises);

  // ถ้า duration <= interval แสดงว่ามีแค่ครั้งเดียว → expire ทันที
  if (isLast) {
    await prisma.locationSharingSession.update({
      where: { id: session.id },
      data: { status: 'EXPIRED' },
    });
  }

  return session;
};

/**
 * อัปเดตตำแหน่งล่าสุด
 */
export const updateLocation = async (sessionId: string, userId: string, data: UpdateLocationInput) => {
  const session = await prisma.locationSharingSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    throw new ApiError(404, 'ไม่พบ session');
  }

  if (session.status !== 'ACTIVE') {
    throw new ApiError(400, 'Session ไม่ได้อยู่ในสถานะ active');
  }

  const address = await getAddressFromCoords(data.latitude, data.longitude);

  return prisma.locationSharingSession.update({
    where: { id: sessionId },
    data: {
      lastLatitude: data.latitude,
      lastLongitude: data.longitude,
      lastAddress: address,
    },
  });
};

/**
 * ส่ง LINE update ตามรอบ (frontend เรียก)
 */
export const sendLocationUpdate = async (sessionId: string, userId: string) => {
  const session = await prisma.locationSharingSession.findFirst({
    where: { id: sessionId, userId },
    include: { contacts: true },
  });

  if (!session) {
    throw new ApiError(404, 'ไม่พบ session');
  }

  if (session.status !== 'ACTIVE') {
    throw new ApiError(400, 'Session ไม่ได้อยู่ในสถานะ active');
  }

  const now = new Date();

  // ตรวจสอบว่า session หมดอายุหรือยัง
  if (now >= session.expiresAt) {
    await prisma.locationSharingSession.update({
      where: { id: sessionId },
      data: { status: 'EXPIRED' },
    });
    throw new ApiError(400, 'Session หมดอายุแล้ว');
  }

  if (!session.lastLatitude || !session.lastLongitude) {
    throw new ApiError(400, 'ยังไม่มีข้อมูลตำแหน่ง');
  }

  const userName = await getUserDisplayName(userId);
  const address = session.lastAddress || `${session.lastLatitude}, ${session.lastLongitude}`;

  // ตรวจสอบว่าครั้งนี้เป็นครั้งสุดท้ายไหม
  const nextSendTime = new Date(now.getTime() + INTERVAL_MINUTES * 60 * 1000);
  const isLast = nextSendTime >= session.expiresAt;

  const messageText = buildLocationMessage(
    userName,
    address,
    session.lastLatitude,
    session.lastLongitude,
    INTERVAL_MINUTES,
    isLast
  );

  // ส่ง LINE ไปยัง LINKED contacts เท่านั้น
  const linkedContacts = session.contacts.filter((c: EmergencyContact) => c.lineLinkStatus === 'LINKED' && c.lineUserId);
  const sendPromises = linkedContacts.map((contact: EmergencyContact) =>
    sendPushMessage({
      lineUserId: contact.lineUserId!,
      messages: [{ type: 'text', text: messageText }],
    }).catch((err) => {
      console.error(`[LINE] Failed to send to ${contact.lineUserId}:`, err.message);
    })
  );

  await Promise.allSettled(sendPromises);

  // อัปเดต lastSentAt และ nextSendAt
  const updateData: Record<string, unknown> = {
    lastSentAt: now,
    nextSendAt: isLast ? null : nextSendTime,
  };

  // ถ้าเป็นครั้งสุดท้าย → expire session
  if (isLast) {
    updateData.status = 'EXPIRED';
  }

  return prisma.locationSharingSession.update({
    where: { id: sessionId },
    data: updateData,
    include: { contacts: true },
  });
};

/**
 * หยุด session + ส่งข้อความสุดท้าย
 */
export const stopSession = async (sessionId: string, userId: string) => {
  const session = await prisma.locationSharingSession.findFirst({
    where: { id: sessionId, userId },
    include: { contacts: true },
  });

  if (!session) {
    throw new ApiError(404, 'ไม่พบ session');
  }

  if (session.status !== 'ACTIVE') {
    throw new ApiError(400, 'Session ไม่ได้อยู่ในสถานะ active');
  }

  // ส่งข้อความหยุดให้ทุก contact
  const userName = await getUserDisplayName(userId);
  const messageText = buildStoppedMessage(userName);

  const sendPromises = session.contacts
    .filter((contact: EmergencyContact) => contact.lineLinkStatus === 'LINKED' && contact.lineUserId)
    .map((contact: EmergencyContact) =>
      sendPushMessage({
        lineUserId: contact.lineUserId!,
        messages: [{ type: 'text', text: messageText }],
      }).catch((err) => {
        console.error(`[LINE] Failed to send stop message to ${contact.lineUserId}:`, err.message);
      })
    );

  await Promise.allSettled(sendPromises);

  return prisma.locationSharingSession.update({
    where: { id: sessionId },
    data: {
      status: 'STOPPED',
      stoppedAt: new Date(),
      nextSendAt: null,
    },
    include: { contacts: true },
  });
};

/**
 * ดึง session ที่ active อยู่
 */
export const getActiveSession = async (userId: string) => {
  // หา session ACTIVE ที่ยังไม่หมดอายุ
  const session = await prisma.locationSharingSession.findFirst({
    where: { userId, status: 'ACTIVE' },
    include: { contacts: true },
  });

  if (session && new Date() >= session.expiresAt) {
    // session หมดอายุ → อัปเดตเป็น EXPIRED
    await prisma.locationSharingSession.update({
      where: { id: session.id },
      data: { status: 'EXPIRED' },
    });
    return null;
  }

  return session;
};

/**
 * ดึง session ตาม ID
 */
export const getSessionById = async (sessionId: string, userId: string) => {
  const session = await prisma.locationSharingSession.findFirst({
    where: { id: sessionId, userId },
    include: { contacts: true },
  });

  if (!session) {
    throw new ApiError(404, 'ไม่พบ session');
  }

  return session;
};

/**
 * ดึงประวัติการแจ้งตำแหน่ง (ทุก session ที่จบแล้ว + active)
 */
export const getSessionHistory = async (userId: string) => {
  return prisma.locationSharingSession.findMany({
    where: { userId },
    include: {
      contacts: {
        select: {
          id: true,
          name: true,
          relationship: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20, // จำกัด 20 รายการล่าสุด
  });
};
