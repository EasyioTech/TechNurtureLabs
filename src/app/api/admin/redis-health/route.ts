import { NextRequest, NextResponse } from 'next/server';
import { getSystemHealth } from '@/modules/super-admin/actions/redis-monitoring';
import { verifySession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || session.userType !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const stats = await getSystemHealth();
        return NextResponse.json(stats);
    } catch (error: any) {
        console.error("Redis health API error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
