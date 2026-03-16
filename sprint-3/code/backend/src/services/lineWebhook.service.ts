import prisma from '../utils/prisma';
import { sendReplyMessage } from '../utils/lineMessaging';

/**
 * จัดการ follow event — ส่ง welcome message
 */
export const handleFollow = async (event: any) => {
  const replyToken = event.replyToken;
  if (!replyToken) return;

  await sendReplyMessage({
    replyToken,
    messages: [
      {
        type: 'text',
        text: [
          '🚗 สวัสดีค่ะ! ยินดีต้อนรับสู่ ไปนำแน่',
          '',
          'หากคุณได้รับรหัส 6 หลักจากผู้ใช้งานระบบ กรุณาพิมพ์รหัสนั้นส่งมาในแชทนี้เพื่อเชื่อมต่อบัญชีผู้ติดต่อฉุกเฉิน',
          '',
          '📝 ตัวอย่าง: A3K7P2',
        ].join('\n'),
      },
    ],
  }).catch((err) => {
    console.error('[LINE Webhook] Failed to reply follow:', err.message);
  });
};

/**
 * จัดการ message event — ค้นหา token เพื่อ link
 */
export const handleMessage = async (event: any) => {
  const replyToken = event.replyToken;
  const lineUserId = event.source?.userId;
  const messageText = event.message?.text?.trim().toUpperCase();

  if (!replyToken || !lineUserId || !messageText) return;

  // เช็คก่อนว่า user นี้เคย LINKED อยู่แล้วไหม
  const existingContact = await prisma.emergencyContact.findFirst({
    where: {
      lineUserId,
      lineLinkStatus: 'LINKED',
    },
    select: { id: true },
  });

  // เคยเชื่อมแล้ว → ไม่ต้องตอบอะไร
  if (existingContact) {
    return;
  }

  // ค้นหา contact ที่มี lineLinkToken ตรงกัน
  const contact = await prisma.emergencyContact.findUnique({
    where: { lineLinkToken: messageText },
  });

  // ไม่เจอ token → บอกให้พิมพ์ใหม่
  if (!contact) {
    await sendReplyMessage({
      replyToken,
      messages: [
        {
          type: 'text',
          text: '❌ ไม่พบรหัสนี้ในระบบ กรุณาตรวจสอบรหัส 6 หลักแล้วพิมพ์ใหม่อีกครั้ง',
        },
      ],
    }).catch((err) => {
      console.error('[LINE Webhook] Failed to reply invalid token:', err.message);
    });
    return;
  }

  // ถ้า LINKED อยู่แล้ว → ไม่ reply (ประหยัด limit)
  if (contact.lineLinkStatus === 'LINKED' && contact.lineUserId) {
    return;
  }

  // Link สำเร็จ → อัปเดต DB
  await prisma.emergencyContact.update({
    where: { id: contact.id },
    data: {
      lineUserId,
      lineLinkStatus: 'LINKED',
      lineLinkedAt: new Date(),
    },
  });

  // ดึงชื่อ user ที่เพิ่มผู้ติดต่อ
  const owner = await prisma.user.findUnique({
    where: { id: contact.userId },
    select: { firstName: true, lastName: true, username: true },
  });
  const ownerName = owner
    ? owner.firstName && owner.lastName
      ? `${owner.firstName} ${owner.lastName}`
      : owner.firstName || owner.username
    : 'ผู้ใช้';

  await sendReplyMessage({
    replyToken,
    messages: [
      {
        type: 'text',
        text: [
          '✅ เชื่อมต่อสำเร็จ!',
          '',
          `คุณถูกเพิ่มเป็นผู้ติดต่อฉุกเฉินของ ${ownerName}`,
          'เมื่อผู้ใช้เริ่มแจ้งตำแหน่ง ระบบจะส่งข้อความอัปเดตตำแหน่งมาที่แชทนี้',
        ].join('\n'),
      },
    ],
  }).catch((err) => {
    console.error('[LINE Webhook] Failed to reply success:', err.message);
  });
};

/**
 * จัดการ unfollow event — ลบ lineUserId ออก
 */
export const handleUnfollow = async (event: any) => {
  const lineUserId = event.source?.userId;
  if (!lineUserId) return;

  // ค้นหาทุก contact ที่ผูกกับ lineUserId นี้
  const contacts = await prisma.emergencyContact.findMany({
    where: { lineUserId },
  });

  // อัปเดตทุกตัว
  for (const contact of contacts) {
    await prisma.emergencyContact.update({
      where: { id: contact.id },
      data: {
        lineUserId: null,
        lineLinkStatus: 'UNLINKED',
        lineLinkedAt: null,
      },
    });
  }
};
