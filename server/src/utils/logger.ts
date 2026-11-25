import { env } from '../config/env';

export function logger(
  level: 'error' | 'warn' | 'info' | 'debug',
  message: string,
  meta?: any
) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

  if (meta) {
    console.log(logMessage, JSON.stringify(meta, null, 2));
  } else {
    console[level](logMessage);
  }
}

export const loggerError = (message: string, meta?: any) => logger('error', message, meta);
export const loggerWarn = (message: string, meta?: any) => logger('warn', message, meta);
export const loggerInfo = (message: string, meta?: any) => logger('info', message, meta);
export const loggerDebug = (message: string, meta?: any) => logger('debug', message, meta);