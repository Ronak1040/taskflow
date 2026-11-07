import { env } from '../config/env.js';

type LogLevel = 'debug' | 'http' | 'info' | 'warn' | 'error';

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  http: 1,
  info: 2,
  warn: 3,
  error: 4,
};

const currentLevelPriority = levelPriority[env.LOG_LEVEL as LogLevel] ?? 2;

const formatMessage = (level: LogLevel, message: string, meta?: unknown): string => {
  const timestamp = new Date().toISOString();
  const formattedMeta = meta ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedMeta}`;
};

export const logger = {
  debug(message: string, meta?: unknown) {
    if (levelPriority.debug >= currentLevelPriority) {
      console.debug(`\x1b[36m${formatMessage('debug', message, meta)}\x1b[0m`);
    }
  },
  http(message: string, meta?: unknown) {
    if (levelPriority.http >= currentLevelPriority) {
      console.log(`\x1b[35m${formatMessage('http', message, meta)}\x1b[0m`);
    }
  },
  info(message: string, meta?: unknown) {
    if (levelPriority.info >= currentLevelPriority) {
      console.info(`\x1b[32m${formatMessage('info', message, meta)}\x1b[0m`);
    }
  },
  warn(message: string, meta?: unknown) {
    if (levelPriority.warn >= currentLevelPriority) {
      console.warn(`\x1b[33m${formatMessage('warn', message, meta)}\x1b[0m`);
    }
  },
  error(message: string, meta?: unknown) {
    if (levelPriority.error >= currentLevelPriority) {
      console.error(`\x1b[31m${formatMessage('error', message, meta)}\x1b[0m`);
    }
  },
};
