import 'dotenv/config';
import jwt, { SignOptions, JwtPayload as JwtBasePayload } from 'jsonwebtoken';

export interface JwtPayload extends JwtBasePayload {
  sub: string;
  role: string;
}

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('Missing JWT_SECRET in environment');
}

export const signToken = (
  payload: { sub: string; role: string },
  options: SignOptions = { expiresIn: '1h' }
): string => {
  return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};
