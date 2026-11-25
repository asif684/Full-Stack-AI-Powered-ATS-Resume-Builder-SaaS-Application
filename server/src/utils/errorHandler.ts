import { Request, Response, NextFunction, RequestHandler } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  let error = err;

  if (!(err instanceof AppError)) {
    error = new AppError('Internal server error', 500, false);
  }

  const appError = error as AppError;

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('=== ERROR HANDLER ===');
    console.error('Path:', req.path);
    console.error('Method:', req.method);
    console.error('Error:', appError);
    console.error('Stack:', appError.stack);
    console.error('=====================');
  }

  res.status(appError.statusCode || 500).json({
    success: false,
    error: appError.message || 'Server error',
    ...(process.env.NODE_ENV === 'development' && { stack: appError.stack }),
  });
}

export function handleAsync(fn: (req: Request, res: Response) => Promise<any>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}