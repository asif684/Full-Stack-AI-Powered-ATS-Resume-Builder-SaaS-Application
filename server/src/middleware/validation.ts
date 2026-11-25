import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/errorHandler';

export const validate = validateHandler;
export const validateQuery = validateQueryHandler;
export const validateParams = validateParamsHandler;

export function validateHandler(schema: ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    console.log('Validation middleware called for:', req.path);
    try {
      schema.parse(req.body);
      console.log('Validation passed');
      next();
    } catch (error) {
      console.log('Validation error:', error);
      if (error instanceof ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
        return next(new AppError(`Validation error: ${messages}`, 400));
      }
      return next(error);
    }
  };
}

export function validateQueryHandler(schema: ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
        next(new AppError(`Validation error: ${messages}`, 400));
      }
      next(error);
    }
  };
}

export function validateParamsHandler(schema: ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
        next(new AppError(`Validation error: ${messages}`, 400));
      }
      next(error);
    }
  };
}