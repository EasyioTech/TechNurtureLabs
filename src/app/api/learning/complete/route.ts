import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { finalizeAndCompleteLesson } from '@/lib/services/learning-session';

/**
 * Handles the final completion of a lesson.
 * Enforces verified time spent and 90% progress threshold.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { lessonId, sessionToken } = await req.json();

        if (!lessonId || !sessionToken) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const result = await finalizeAndCompleteLesson(lessonId, sessionToken);

        if (result.error) {
            return NextResponse.json({ 
                error: result.error, 
                code: result.code 
            }, { status: 403 });
        }

        return NextResponse.json({ success: true, message: 'Lesson marked complete' });
    } catch (error: any) {
        console.error('[Learning Complete Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
