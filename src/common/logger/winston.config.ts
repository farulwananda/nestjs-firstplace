import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, context, stack }) => {
    const ctx = context ? `[${context as string}]` : '';
    const stackTrace = stack ? `\n${stack as string}` : '';
    return `${timestamp as string} ${level} ${ctx} ${message as string}${stackTrace}`;
  }),
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const winstonConfig: WinstonModuleOptions = {
  transports: [
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
    }),

    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp(), errors({ stack: true }), json()),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp(), errors({ stack: true }), json()),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
};
