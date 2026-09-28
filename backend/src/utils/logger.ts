/**
 * Minimal structured logger. Swap this out for pino/winston later if needed —
 * every call site imports from here, so the swap is one file.
 */

type LogFields = Record<string, unknown>;

function timestamp(): string {
  return new Date().toISOString();
}

function write(level: string, message: string, fields?: LogFields): void {
  const base = `[${timestamp()}] [${level.toUpperCase()}] ${message}`;
  if (fields && Object.keys(fields).length > 0) {
    // eslint-disable-next-line no-console
    console.log(base, JSON.stringify(fields));
  } else {
    // eslint-disable-next-line no-console
    console.log(base);
  }
}

export const logger = {
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) => write("error", message, fields),
  debug: (message: string, fields?: LogFields) => {
    if (process.env.NODE_ENV !== "production") write("debug", message, fields);
  },
};
