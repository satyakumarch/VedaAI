// ============================================================
// VedaAI Backend - Zod Request Validation Middleware
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    schema.parse(req.body); // throws ZodError if invalid — caught by errorHandler
    next();
  };
