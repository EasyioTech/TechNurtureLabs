import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { checkR2Health, formatR2HealthReport } from '@/lib/r2-health-check';

/**
 * Endpoint: GET /api/admin/r2-health
 * Only super_admin can call this
 * Returns R2 connectivity status and diagnostic information
 */
export async function GET(request: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || (session.role !== 'super_admin' && session.userType !== 'super_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const status = await checkR2Health();
        const report = formatR2HealthReport(status);

        // Log the report server-side for debugging
        console.log(report);

        return NextResponse.json({
            status: status.connected ? 'healthy' : 'unhealthy',
            ...status,
            report
        });
    } catch (err: any) {
        return NextResponse.json({
            error: err?.message || 'Failed to check R2 health'
        }, { status: 500 });
    }
}
