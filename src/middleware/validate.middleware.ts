// src/middleware/validate.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

const setRequestProperty = <K extends keyof Request>(
  req: Request,
  key: K,
  value: Request[K],
) => {
  try {
    Object.defineProperty(req, key, {
      value,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  } catch {
    (req as unknown as Record<string, unknown>)[key as string] = value;
  }
};

export const validate = (schema: any) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const safeBody = req.body ?? {};
      const safeQuery = req.query ?? {};
      const safeParams = req.params ?? {};

      const wrappedResult = schema.safeParse({
        body: safeBody,
        query: safeQuery,
        params: safeParams,
      });

      if (wrappedResult.success) {
        const parsed = wrappedResult.data;

        if (parsed && typeof parsed === 'object' && 'body' in parsed) {
          req.body = parsed.body;
        }

        if (parsed && typeof parsed === 'object' && 'query' in parsed) {
          setRequestProperty(req, 'query', parsed.query as Request['query']);
        }

        if (parsed && typeof parsed === 'object' && 'params' in parsed) {
          setRequestProperty(req, 'params', parsed.params as Request['params']);
        }

        next();
        return;
      }

      const directResult = schema.safeParse(safeBody);
      if (directResult.success) {
        req.body = directResult.data;
        next();
        return;
      }

      const error = wrappedResult.error ?? directResult.error;
      const errors = error.issues.map((issue: any) => ({
        field: issue.path.length > 0 ? issue.path.join('.') : 'body',
        message: issue.message,
      }));
      next(ApiError.badRequest('Validation failed', errors));
    } catch (error: any) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue: any) => ({
          field: issue.path.length > 0 ? issue.path.join('.') : 'body',
          message: issue.message,
        }));
        next(ApiError.badRequest('Validation failed', errors));
        return;
      }
      next(error);
    }
  };
};
