import { traceStorage } from './core/context';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMeta extends Record<string, unknown> {
    context?: string;
    userId?: string;
    ip?: string;
    path?: string;
    error?: string;
    stack?: string;
    durationMs?: number;
}

function formatEntry(level: LogLevel, message: string, meta?: LogMeta): string {
    const store = traceStorage.getStore();
    return JSON.stringify({
        level,
        traceId: store?.traceId,
        userId: meta?.userId || store?.userId,
        ts: new Date().toISOString(),
        message,
        ...meta,
    });
}

function normalizeError(err: unknown): LogMeta {
    if (err instanceof Error) {
        return { error: err.message, stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined };
    }
    return { error: String(err) };
}

export const logger = {
    info(message: string, meta?: LogMeta) {
        console.log(formatEntry('info', message, meta));
    },

    warn(message: string, meta?: LogMeta) {
        console.warn(formatEntry('warn', message, meta));
    },

    error(message: string, errOrMeta?: unknown, meta?: LogMeta) {
        const errMeta = errOrMeta instanceof Error || (errOrMeta && typeof errOrMeta === 'object' && !(errOrMeta as any).level)
            ? normalizeError(errOrMeta)
            : (errOrMeta as LogMeta | undefined);
        console.error(formatEntry('error', message, { ...errMeta, ...meta }));
    },

    debug(message: string, meta?: LogMeta) {
        if (process.env.NODE_ENV !== 'production') {
            console.log(formatEntry('debug', message, meta));
        }
    },

    /** Structured auth event: login, logout, session expiry, 2FA, rate limit hits */
    auth(event: string, meta?: LogMeta) {
        console.log(formatEntry('info', `[Auth] ${event}`, meta));
    },

    /** Structured payment event */
    payment(event: string, meta?: LogMeta) {
        console.log(formatEntry('info', `[Payment] ${event}`, meta));
    },

    /** Upload lifecycle events */
    upload(event: string, meta?: LogMeta) {
        console.log(formatEntry('info', `[Upload] ${event}`, meta));
    },
};
