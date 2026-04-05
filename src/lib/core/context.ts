import { AsyncLocalStorage } from 'node:async_hooks';

interface TraceContext {
  traceId: string;
  userId?: string;
  schoolId?: string;
  tenantId?: string; // Unified identifier
}

/**
 * Global storage for request-specific context (TraceID, etc.)
 * This persists across asynchronous calls in the same request chain.
 */
export const traceStorage = new AsyncLocalStorage<TraceContext>();

/**
 * Returns the current trace ID if available.
 */
export function getTraceId(): string | undefined {
  return traceStorage.getStore()?.traceId;
}

/**
 * Returns the current school ID if available.
 */
export function getSchoolId(): string | undefined {
  return traceStorage.getStore()?.schoolId;
}
