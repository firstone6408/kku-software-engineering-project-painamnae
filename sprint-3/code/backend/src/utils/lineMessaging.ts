import axios from 'axios';

const LINE_API_URL = 'https://api.line.me/v2/bot/message/push';
const LINE_REPLY_API_URL = 'https://api.line.me/v2/bot/message/reply';
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

interface SendPushMessageOptions {
  lineUserId: string;
  messages: Array<{ type: string; text: string }>;
}

interface SendReplyMessageOptions {
  replyToken: string;
  messages: Array<{ type: string; text: string }>;
}

/**
 * ส่ง Push Message ไปยัง LINE User
 */
export const sendPushMessage = async ({ lineUserId, messages }: SendPushMessageOptions): Promise<void> => {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn('[LINE] LINE_CHANNEL_ACCESS_TOKEN is not set — skipping message send');
    return;
  }

  await axios.post(
    LINE_API_URL,
    {
      to: lineUserId,
      messages,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
    }
  );
};

/**
 * ตอบกลับ Message ผ่าน Reply Token (ใช้ตอน webhook)
 */
export const sendReplyMessage = async ({ replyToken, messages }: SendReplyMessageOptions): Promise<void> => {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn('[LINE] LINE_CHANNEL_ACCESS_TOKEN is not set — skipping reply');
    return;
  }

  await axios.post(
    LINE_REPLY_API_URL,
    {
      replyToken,
      messages,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
    }
  );
};

/**
 * สร้างข้อความแจ้งตำแหน่ง
 */
export const buildLocationMessage = (
  userName: string,
  address: string,
  lat: number,
  lng: number,
  intervalMinutes: number,
  isLast: boolean
): string => {
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const statusLine = isLast
    ? '🛑 หยุดการแจ้งตำแหน่งแล้ว'
    : `🔄 จะแจ้งตำแหน่งทุกๆ ${intervalMinutes} นาที`;

  return [
    `📍 อัปเดตตำแหน่ง - ไปนำแหน่`,
    ``,
    `${userName} กำลังเดินทาง`,
    `ปัจจุบันอยู่ที่: ${address}`,
    ``,
    statusLine,
    ``,
    `ดูตำแหน่งบนแผนที่: ${googleMapsUrl}`,
  ].join('\n');
};

/**
 * สร้างข้อความหยุดการแจ้งเตือน (เมื่อ user หยุดเอง)
 */
export const buildStoppedMessage = (userName: string): string => {
  return [
    `📍 อัปเดตตำแหน่ง - ไปนำแหน่`,
    ``,
    `${userName} ได้หยุดการแจ้งตำแหน่งแล้ว`,
    ``,
    `🛑 หยุดการแจ้งตำแหน่งแล้ว`,
  ].join('\n');
};

/**
 * สร้างข้อความหมดเวลา (เมื่อ session หมดอายุอัตโนมัติ)
 */
export const buildExpiredMessage = (userName: string): string => {
  return [
    `📍 อัปเดตตำแหน่ง - ไปนำแหน่`,
    ``,
    `การแจ้งตำแหน่งของ ${userName} จบลงแล้ว`,
    `เนื่องจากครบกำหนดเวลาที่ตั้งไว้`,
    ``,
    `⏰ สิ้นสุดการแจ้งตำแหน่งแล้ว`,
  ].join('\n');
};
