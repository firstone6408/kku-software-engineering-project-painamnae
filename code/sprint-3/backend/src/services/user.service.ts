import prisma from '../utils/prisma';
import ApiError from '../utils/ApiError';
import bcrypt from 'bcrypt';
import { Prisma, User } from '@prisma/client';

const SALT_ROUNDS = 10;

type SafeUser = Omit<User, 'password'>;

interface SearchUsersOpts {
  page?: number;
  limit?: number;
  q?: string;
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const searchUsers = async (opts: SearchUsersOpts = {}): Promise<PaginatedResult<unknown>> => {
  const {
    page = 1,
    limit = 20,
    q,
    role,
    isActive,
    isVerified,
    createdFrom,
    createdTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = opts;

  const where: Prisma.UserWhereInput = {
    ...(role && { role: role as never }),
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
    ...(typeof isVerified === 'boolean' ? { isVerified } : {}),
    ...((createdFrom || createdTo) ? {
      createdAt: {
        ...(createdFrom ? { gte: new Date(createdFrom) } : {}),
        ...(createdTo ? { lte: new Date(createdTo) } : {}),
      },
    } : {}),
    ...(q ? {
      OR: [
        { email: { contains: q, mode: 'insensitive' as const } },
        { username: { contains: q, mode: 'insensitive' as const } },
        { firstName: { contains: q, mode: 'insensitive' as const } },
        { lastName: { contains: q, mode: 'insensitive' as const } },
        { phoneNumber: { contains: q, mode: 'insensitive' as const } },
      ],
    } : {}),
  };

  const skip = (page - 1) * limit;
  const take = limit;

  const [total, dataRaw] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
      select: {
        id: true, email: true, username: true,
        firstName: true, lastName: true, gender: true,
        phoneNumber: true, profilePicture: true,
        role: true, isVerified: true, isActive: true,
        createdAt: true, updatedAt: true,
      },
    }),
  ]);

  return {
    data: dataRaw,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const getUserByUsername = async (username: string) => {
  return prisma.user.findUnique({ where: { username } });
};

export const comparePassword = async (user: User, plainPassword: string): Promise<boolean> => {
  return bcrypt.compare(plainPassword, user.password);
};

export const getAllUsers = async (): Promise<SafeUser[]> => {
  const users = await prisma.user.findMany({ where: { isActive: true } });
  return users.map((user) => {
    const { password, ...safeUser } = user;
    return safeUser;
  });
};

export const getUserById = async (id: string): Promise<SafeUser> => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, 'User not found');
  const { password, ...safeUser } = user;
  return safeUser;
};

export const getUserPublicById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, firstName: true, lastName: true,
      profilePicture: true, role: true, isVerified: true,
      createdAt: true,
    },
  });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

interface CreateUserData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  gender: string;
  nationalIdNumber: string;
  nationalIdExpiryDate: string;
  nationalIdPhotoUrl?: string;
  selfiePhotoUrl?: string;
  role?: string;
}

export const createUser = async (data: CreateUserData): Promise<SafeUser> => {
  const existingUserByEmail = await getUserByEmail(data.email);
  if (existingUserByEmail) throw new ApiError(409, 'This email is already in use.');
  const existingUserByUsername = await getUserByUsername(data.username);
  if (existingUserByUsername) throw new ApiError(409, 'This username is already taken.');

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const createData: Prisma.UserCreateInput = {
    email: data.email,
    username: data.username,
    password: hashedPassword,
    firstName: data.firstName,
    lastName: data.lastName,
    phoneNumber: data.phoneNumber,
    gender: data.gender,
    nationalIdNumber: data.nationalIdNumber,
    nationalIdExpiryDate: new Date(data.nationalIdExpiryDate),
    nationalIdPhotoUrl: data.nationalIdPhotoUrl,
    selfiePhotoUrl: data.selfiePhotoUrl,
    role: (data.role as never) || 'PASSENGER',
  };

  const user = await prisma.user.create({ data: createData });
  const { password, ...safeUser } = user;
  return safeUser;
};

export const updatePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  const userWithPassword = await prisma.user.findUnique({ where: { id: userId } });
  if (!userWithPassword) return { success: false, error: 'USER_NOT_FOUND' };

  const isPasswordCorrect = await bcrypt.compare(currentPassword, userWithPassword.password);
  if (!isPasswordCorrect) return { success: false, error: 'INCORRECT_PASSWORD' };

  const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { password: hashedNewPassword } });
  return { success: true };
};

export const updateUserProfile = async (id: string, data: Prisma.UserUpdateInput): Promise<SafeUser> => {
  const updatedUser = await prisma.user.update({ where: { id }, data });
  const { password, ...safeUser } = updatedUser;
  return safeUser;
};

export const deleteUser = async (id: string): Promise<SafeUser> => {
  const deletedUser = await prisma.user.delete({ where: { id } });
  const { password, ...safeDeletedUser } = deletedUser;
  return safeDeletedUser;
};
