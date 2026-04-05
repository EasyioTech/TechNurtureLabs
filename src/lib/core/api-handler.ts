import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { traceStorage } from './context';

/**
 * Custom error type for application-level errors
 */
export class AppError extends Error {
    constructor(
        public message: string,
        public code: string = 'BAD_REQUEST',
        public statusCode: number = 400,
        public details?: any
    ) {
        super(message);
        this.name = 'AppError';
    }
}

/**
 * Standard API Response Structure
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        traceId?: string;
        durationMs?: number;
    };
}

type HandlerFunction<T = any, B = any, P = any, Q = any> = (
    req: NextRequest, 
    context: { params: P, body: B, query: Q }
) => Promise<T>;

interface HandlerOptions<
    B extends z.ZodTypeAny = z.ZodTypeAny, 
    P extends z.ZodTypeAny = z.ZodTypeAny, 
    Q extends z.ZodTypeAny = z.ZodTypeAny
> {
    bodySchema?: B;
    paramsSchema?: P;
    querySchema?: Q;
    action: string;
}

/**
 * Unified API Handler Wrapper
 * - Injects TraceID context
 * - Standardizes error responses
 * - Automatically validates body, params, and query
 * - Performance tracking
 */
export function createApiHandler<
    T = any, 
    B extends z.ZodTypeAny = z.ZodTypeAny, 
    P extends z.ZodTypeAny = z.ZodTypeAny, 
    Q extends z.ZodTypeAny = z.ZodTypeAny
>(
    options: HandlerOptions<B, P, Q>,
    handler: HandlerFunction<T, z.infer<B>, z.infer<P>, z.infer<Q>>
) {
    return async (req: NextRequest, { params }: { params: any }): Promise<NextResponse<ApiResponse<T>>> => {
        const start = Date.now();
        const traceId = req.headers.get('x-request-id') || crypto.randomUUID();

        // 1. Wrap in Trace Context
        return traceStorage.run({ traceId }, async () => {
            try {
                logger.info(`[API] START: ${options.action} ${req.method} ${req.nextUrl.pathname}`);

                // 2. Extract Data
                let body: any = undefined;
                const contentType = req.headers.get('content-type');
                if (['POST', 'PUT', 'PATCH'].includes(req.method) && contentType?.includes('application/json')) {
                    try {
                        body = await req.json();
                    } catch (e) {
                         // Body might be empty or malformed
                    }
                }

                const query = Object.fromEntries(req.nextUrl.searchParams.entries());

                // 3. Validation
                let validatedBody: z.infer<B> = body as any;
                if (options.bodySchema) {
                    const result = options.bodySchema.safeParse(body);
                    if (!result.success) {
                        return createErrorResponse('VALIDATION_ERROR', 'Invalid request body', result.error.format(), 400, start, traceId);
                    }
                    validatedBody = result.data;
                }

                let validatedParams: z.infer<P> = params as any;
                if (options.paramsSchema) {
                    const result = options.paramsSchema.safeParse(params);
                    if (!result.success) {
                        return createErrorResponse('VALIDATION_ERROR', 'Invalid route parameters', result.error.format(), 400, start, traceId);
                    }
                    validatedParams = result.data;
                }

                let validatedQuery: z.infer<Q> = query as any;
                if (options.querySchema) {
                    const result = options.querySchema.safeParse(query);
                    if (!result.success) {
                        return createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', result.error.format(), 400, start, traceId);
                    }
                    validatedQuery = result.data;
                }

                // 4. Execute Handler
                const result = await handler(req, { 
                    params: validatedParams, 
                    body: validatedBody, 
                    query: validatedQuery 
                });

                const duration = Date.now() - start;
                logger.info(`[API] DONE: ${options.action} (took ${duration}ms)`);

                // 5. Standard Success Response
                const response: ApiResponse<T> = {
                    success: true,
                    data: result,
                    meta: { traceId, durationMs: duration }
                };

                return NextResponse.json(response, {
                    headers: { 'x-request-id': traceId }
                });

            } catch (error: any) {
                const duration = Date.now() - start;
                
                // App-specific errors
                if (error instanceof AppError) {
                    logger.warn(`[API] APP_ERROR: ${options.action} - ${error.message}`);
                    return createErrorResponse(error.code, error.message, error.details, error.statusCode, start, traceId);
                }

                // Unexpected errors
                logger.error(`[API] UNEXPECTED_ERROR: ${options.action}`, error, { durationMs: duration });
                return createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred', undefined, 500, start, traceId);
            }
        });
    };
}

function createErrorResponse(code: string, message: string, details: any, status: number, start: number, traceId: string) {
    const errorResponse: ApiResponse = {
        success: false,
        error: { code, message, details },
        meta: { traceId, durationMs: Date.now() - start }
    };

    return NextResponse.json(errorResponse, { 
        status,
        headers: { 'x-request-id': traceId }
    });
}
