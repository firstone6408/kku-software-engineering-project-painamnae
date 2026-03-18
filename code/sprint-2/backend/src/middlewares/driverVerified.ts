import { Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import ApiError from '../utils/ApiError';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from './auth';

const requireDriverVerified = asyncHandler(async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const driverId = req.user!.sub;
  const dv = await prisma.driverVerification.findUnique({
    where: { userId: driverId },
  });
  if (!dv || dv.status === 'REJECTED') {
    throw new ApiError(403, 'คุณต้องยืนยันตัวตนผู้ขับก่อนจึงจะดำเนินการนี้ได้');
  }
  next();
});

export default requireDriverVerified;
