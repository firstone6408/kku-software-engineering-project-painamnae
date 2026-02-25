import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
import { z, ZodTypeAny } from 'zod';

interface ValidationSchema {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

const validate = (schema: ValidationSchema) => (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const validationSchema = z.object({
      body: schema.body || z.any(),
      query: schema.query || z.any(),
      params: schema.params || z.any(),
    });

    const parsed = validationSchema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    req.body = parsed.body;
    req.query = parsed.query;
    req.params = parsed.params;

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors
        .map((i) => `${i.path.join('.')} - ${i.message}`)
        .join(', ');
      return next(new ApiError(400, `Validation error: ${messages}`));
    }
    next(error);
  }
};

export default validate;
