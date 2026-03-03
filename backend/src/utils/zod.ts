import { z } from 'zod';
import ApiError from '../utils/ApiError';

export const zodValidateThrow = (parsed: z.SafeParseError<unknown>): never => {
  const messages = parsed.error.errors
    .map((i) => `${i.path.join('.')} - ${i.message}`)
    .join(', ');
  throw new ApiError(400, `Validation error: ${messages}`);
};
