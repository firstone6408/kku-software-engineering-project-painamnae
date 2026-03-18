import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from './auth';

export async function requirePassengerNotSuspended(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) return next(); // เผื่อบางเส้นทางยังไม่ได้ protect

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passengerSuspendedUntil: true },
    });

    if (user?.passengerSuspendedUntil && user.passengerSuspendedUntil > new Date()) {
      res.status(403).json({
        success: false,
        message: 'คุณถูกระงับสิทธิ์การจองชั่วคราว โปรดลองใหม่ภายหลัง',
      });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}
