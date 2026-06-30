type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
}

const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

function formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : undefined,
  };
}

function logToConsole(entry: LogEntry): void {
  const { timestamp, level, message, context, error } = entry;
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  switch (level) {
    case 'debug':
      if (isDevelopment) console.debug(prefix, message, context ?? '', error ?? '');
      break;
    case 'info':
      console.info(prefix, message, context ?? '');
      break;
    case 'warn':
      console.warn(prefix, message, context ?? '', error ?? '');
      break;
    case 'error':
      console.error(prefix, message, context ?? '', error ?? '');
      break;
  }
}

function sendToSentry(entry: LogEntry): void {
  if (typeof window !== 'undefined' && window.Sentry) {
    const { level, message, context, error } = entry;
    if (level === 'error' && error) {
      window.Sentry.captureException(error, { extra: context });
    } else if (level === 'warn') {
      window.Sentry.captureMessage(message, { level: 'warning', extra: context });
    } else {
      window.Sentry.captureMessage(message, { level, extra: context });
    }
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    const entry = formatMessage('debug', message, context);
    logToConsole(entry);
  },

  info(message: string, context?: LogContext): void {
    const entry = formatMessage('info', message, context);
    logToConsole(entry);
    if (isProduction) sendToSentry(entry);
  },

  warn(message: string, context?: LogContext, error?: Error): void {
    const entry = formatMessage('warn', message, context, error);
    logToConsole(entry);
    if (isProduction) sendToSentry(entry);
  },

  error(message: string, context?: LogContext, error?: Error): void {
    const entry = formatMessage('error', message, context, error);
    logToConsole(entry);
    if (isProduction) sendToSentry(entry);
  },

  setUserContext(userId: string, email?: string, role?: string): void {
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.setUser({ id: userId, email, role });
    }
  },

  clearUserContext(): void {
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.setUser(null);
    }
  },

  addBreadcrumb(category: string, message: string, data?: LogContext): void {
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.addBreadcrumb({ category, message, data, level: 'info' });
    }
  },
};

export function createScopedLogger(scope: string) {
  return {
    debug: (message: string, context?: LogContext) => logger.debug(message, { ...context, scope }),
    info: (message: string, context?: LogContext) => logger.info(message, { ...context, scope }),
    warn: (message: string, context?: LogContext, error?: Error) => logger.warn(message, { ...context, scope }, error),
    error: (message: string, context?: LogContext, error?: Error) => logger.error(message, { ...context, scope }, error),
  };
}