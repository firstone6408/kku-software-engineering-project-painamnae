import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import ApiError from '../utils/ApiError';
import { verifyToken, JwtPayload } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    role: string;
  };
}

export const protect = asyncHandler(async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  let token: string | undefined;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      // Get token from header
      token = authHeader.split(' ')[1];

      // Verify token
      const decoded: JwtPayload = verifyToken(token);

      // Attach user to the request object
      req.user = {
        sub: decoded.sub,
        role: decoded.role,
      };

      next();
    } catch (error) {
      console.error(error);
      throw new ApiError(401, 'Not authorized, token failed');
    }
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token');
  }
});

export const requireAdmin = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    throw new ApiError(403, 'Forbidden: Admin access required');
  }
};
