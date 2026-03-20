import { NextResponse } from 'next/server';
import { logger } from './logger';

/** Standard success response: { success: true, data: T, error: null } */
export function ok<T>(data: T, status = 200): NextResponse {
    return NextResponse.json({ success: true, data, error: null }, { status });
}

/** Standard failure response: { success: false, data: null, error: string } */
export function fail(error: string, status = 400): NextResponse {
    return NextResponse.json({ success: false, data: null, error }, { status });
}

/** Catch-all API error handler — logs and returns 500 without leaking internals */
export function handleApiError(err: unknown, context: string): NextResponse {
    logger.error(`Unhandled error in ${context}`, err);
    return NextResponse.json(
        { success: false, data: null, error: 'Internal server error' },
        { status: 500 }
    );
}

/** Parse and validate the request body with Zod. Returns parsed data or throws ZodError. */
export async function parseBody<T>(
    request: Request,
    schema: { parse: (data: unknown) => T }
): Promise<T> {
    const raw = await request.json();
    return schema.parse(raw);
}
