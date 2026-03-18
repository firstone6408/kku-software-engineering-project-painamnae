import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { signToken } from '../utils/jwt';
import * as userService from '../services/user.service';
import ApiError from '../utils/ApiError';
import { AuthenticatedRequest } from '../middlewares/auth';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  let user;
  if (email) {
    user = await userService.getUserByEmail(email);
  } else if (username) {
    user = await userService.getUserByUsername(username);
  }

  if (user && !user.isActive) {
    throw new ApiError(401, 'Your account has been deactivated.');
  }

  const passwordIsValid = user ? await userService.comparePassword(user, password) : false;
  if (!user || !passwordIsValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = signToken({ sub: user.id, role: user.role });
  const {
    password: _,
    gender,
    phoneNumber,
    otpCode,
    nationalIdNumber,
    nationalIdPhotoUrl,
    nationalIdExpiryDate,
    selfiePhotoUrl,
    isVerified,
    isActive,
    lastLogin,
    createdAt,
    updatedAt,
    username: __,
    email: ___,
    ...safeUser
  } = user;

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { token, user: safeUser },
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.sub;
  const { currentPassword, newPassword } = req.body;

  const result = await userService.updatePassword(userId, currentPassword, newPassword);

  if (!result.success) {
    if (result.error === 'INCORRECT_PASSWORD') {
      throw new ApiError(401, 'Incorrect current password.');
    }
    throw new ApiError(500, 'Could not update password.');
  }

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
    data: null,
  });
});
