import { NextRequest, NextResponse } from 'next/server';

/**
 * CSP Report Endpoint
 * 
 * Browsers POST CSP violation reports here when the Content-Security-Policy 
 * or Content-Security-Policy-Report-Only headers are triggered.
 */
export async function POST(req: NextRequest) {
    try {
        const report = await req.json();
        
        // Log the violation for analysis
        // In a production app, you might send this to Sentry, Axiom, or a database
        console.warn('[CSP Violation Report]:', JSON.stringify(report, null, 2));

        return NextResponse.json({ processed: true }, { status: 200 });
    } catch (error) {
        console.error('[CSP Report Error]:', error);
        return NextResponse.json({ error: 'Failed to process report' }, { status: 400 });
    }
}
