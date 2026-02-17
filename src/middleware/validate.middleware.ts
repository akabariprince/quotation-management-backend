// src/middleware/validate.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

export const validate = (schema: any) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // schema.parse({
      //   body: req.body,
      //   query: req.query,
      //   params: req.params,
      // });
      next();
    } catch (error:any) {
      if (error) {
        const errors = error.errors.map((e:any) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        next(ApiError.badRequest('Validation failed', errors));
      } else {
        next(error);
      }
    }
  };
};