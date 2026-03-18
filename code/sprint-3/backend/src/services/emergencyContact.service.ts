import prisma from '../utils/prisma';
import ApiError from '../utils/ApiError';
import { CreateEmergencyContactInput, UpdateEmergencyContactInput } from '../validations/emergencyContact.validation';

/**
 * สร้าง token 6 ตัว (ตัวเลข + ตัวอักษรตัวใหญ่) ที่ unique
 */
const generateLinkToken = async (): Promise<string> => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ไม่มี I,O,0,1 กัน confuse
  const MAX_ATTEMPTS = 10;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let token = '';
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // ตรวจ unique
    const existing = await prisma.emergencyContact.findUnique({
      where: { lineLinkToken: token },
    });
    if (!existing) return token;
  }

  throw new ApiError(500, 'ไม่สามารถสร้าง token ได้ กรุณาลองใหม่');
};

export const createContact = async (userId: string, data: CreateEmergencyContactInput) => {
  const lineLinkToken = await generateLinkToken();

  return prisma.emergencyContact.create({
    data: {
      userId,
      name: data.name,
      relationship: data.relationship,
      phoneNumber: data.phoneNumber,
      email: data.email,
      lineLinkToken,
      lineLinkStatus: 'PENDING',
    },
  });
};

export const getContactsByUserId = async (userId: string) => {
  return prisma.emergencyContact.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

export const getContactById = async (id: string, userId: string) => {
  const contact = await prisma.emergencyContact.findFirst({
    where: { id, userId },
  });

  if (!contact) {
    throw new ApiError(404, 'ไม่พบผู้ติดต่อฉุกเฉิน');
  }

  return contact;
};

export const updateContact = async (id: string, userId: string, data: UpdateEmergencyContactInput) => {
  const contact = await prisma.emergencyContact.findFirst({
    where: { id, userId },
  });

  if (!contact) {
    throw new ApiError(404, 'ไม่พบผู้ติดต่อฉุกเฉิน');
  }

  return prisma.emergencyContact.update({
    where: { id },
    data,
  });
};

export const deleteContact = async (id: string, userId: string) => {
  const contact = await prisma.emergencyContact.findFirst({
    where: { id, userId },
  });

  if (!contact) {
    throw new ApiError(404, 'ไม่พบผู้ติดต่อฉุกเฉิน');
  }

  return prisma.emergencyContact.delete({
    where: { id },
  });
};
