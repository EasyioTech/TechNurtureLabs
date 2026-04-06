/**
 * PHASE 3 HARDENING: Runtime Boundary Detection
 *
 * Detects execution environment and prevents cross-boundary imports.
 * Used to catch architectural violations early with clear diagnostics.
 */

export const ExecutionEnvironment = {
  NEXT_JS_SERVER: 'next.js_server',
  NEXT_JS_BROWSER: 'next.js_browser',
  STANDALONE_WORKER: 'standalone_worker',
  UNKNOWN: 'unknown'
} as const;

export type ExecutionEnv = typeof ExecutionEnvironment[keyof typeof ExecutionEnvironment];

/**
 * Detects the current execution environment
 */
export function detectExecutionEnvironment(): ExecutionEnv {
  // In Next.js server context: __NEXT_PROCESSED_ENV is defined
  if (typeof (global as any).__NEXT_PROCESSED_ENV !== 'undefined') {
    return ExecutionEnvironment.NEXT_JS_SERVER;
  }

  // In browser: window exists
  if (typeof window !== 'undefined') {
    return ExecutionEnvironment.NEXT_JS_BROWSER;
  }

  // In standalone Node.js (worker): check for tsx/Node process markers
  if (typeof process !== 'undefined' && process.env.NODE_ENV) {
    // If we got here and it's Node (no window), we're in a worker or CLI
    return ExecutionEnvironment.STANDALONE_WORKER;
  }

  return ExecutionEnvironment.UNKNOWN;
}

/**
 * Asserts that code is running in a server context (Next.js or Worker)
 * Fails fast with clear diagnostics if called from browser
 */
export function assertServerContext(moduleName: string) {
  const env = detectExecutionEnvironment();
  if (env === ExecutionEnvironment.NEXT_JS_BROWSER) {
    throw new Error(
      `[RUNTIME ERROR] Module '${moduleName}' cannot be used from browser context.\n` +
      `This module contains server-only operations (DB, auth, etc.).\n` +
      `Please move this code to a Server Component or API route.`
    );
  }
}

/**
 * Asserts that code is running in Next.js context (not standalone worker)
 * Helps catch worker imports of auth/session-specific modules
 */
export function assertNextJsContext(moduleName: string) {
  const env = detectExecutionEnvironment();
  if (env === ExecutionEnvironment.STANDALONE_WORKER) {
    throw new Error(
      `[RUNTIME ERROR] Module '${moduleName}' is Next.js-specific and cannot be imported in standalone workers.\n` +
      `This module depends on Next.js features like cookies(), headers(), or sessions.\n` +
      `Solution: Move Next.js-specific logic to action functions or lazy-load it only when needed.`
    );
  }
}

/**
 * Asserts that code is NOT running in a Next.js context
 * Useful for modules designed only for standalone workers
 */
export function assertWorkerContext(moduleName: string) {
  const env = detectExecutionEnvironment();
  if (env === ExecutionEnvironment.NEXT_JS_SERVER || env === ExecutionEnvironment.NEXT_JS_BROWSER) {
    throw new Error(
      `[RUNTIME ERROR] Module '${moduleName}' is worker-only and cannot be imported in Next.js.\n` +
      `This module is designed exclusively for background workers.\n` +
      `If you need this functionality in Next.js, create a wrapper.`
    );
  }
}

/**
 * Warn about potential architecture violations
 * Non-fatal, helps developers identify problematic patterns
 */
export function warnCrossEnvironmentImport(from: string, to: string) {
  const env = detectExecutionEnvironment();
  console.warn(
    `[ARCHITECTURE WARNING] Potential cross-environment import detected.\n` +
    `From: ${from}\n` +
    `To: ${to}\n` +
    `Environment: ${env}\n` +
    `This may cause issues when code is imported in different contexts.`
  );
}
