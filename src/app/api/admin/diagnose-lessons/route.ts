import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lessons, mediaAssets } from '@/db/schema';
import { requireSuperAdmin } from '@/lib/admin-guard';
import { isNull, eq } from 'drizzle-orm';

/**
 * Diagnostic endpoint: Find lessons with missing content
 * Helps identify which lessons will show "Content Unavailable" to students
 */
export async function GET(req: NextRequest) {
    try {
        await requireSuperAdmin();

        const searchParams = req.nextUrl.searchParams;
        const courseId = searchParams.get('courseId');

        // Find all lessons with missing/empty content
        let query = db.query.lessons.findMany({
            with: {
                asset: {
                    columns: {
                        id: true,
                        file_path: true,
                        file_name: true,
                        processing_status: true,
                    }
                }
            },
            orderBy: (lessons, { asc }) => [asc(lessons.sequence_order)]
        });

        // Filter by course if specified
        const results = [];

        if (courseId) {
            const courseLessons = await db.query.lessons.findMany({
                where: eq(lessons.course_id, courseId),
                with: {
                    asset: {
                        columns: {
                            id: true,
                            file_path: true,
                            file_name: true,
                            processing_status: true,
                        }
                    }
                },
                orderBy: (lessons, { asc }) => [asc(lessons.sequence_order)]
            });

            for (const lesson of courseLessons) {
                const hasContent = checkLessonContent(lesson);
                results.push({
                    ...hasContent
                });
            }
        } else {
            // Scan all lessons
            const allLessons = await db.query.lessons.findMany({
                with: {
                    asset: {
                        columns: {
                            id: true,
                            file_path: true,
                            file_name: true,
                            processing_status: true,
                        }
                    }
                },
                limit: 500,
                orderBy: (lessons, { asc }) => [asc(lessons.created_at)]
            });

            for (const lesson of allLessons) {
                const hasContent = checkLessonContent(lesson);
                if (!hasContent.hasValidContent) {
                    results.push(hasContent);
                }
            }
        }

        return NextResponse.json({
            total_checked: courseId ? results.length : 500,
            missing_content: results.filter(r => !r.hasValidContent).length,
            issues: results.filter(r => !r.hasValidContent)
        });
    } catch (error: any) {
        console.error('[Diagnose Lessons Error]:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: error.status || 500 }
        );
    }
}

function checkLessonContent(lesson: any) {
    const issues = [];
    let hasValidContent = true;

    if (lesson.content_type === 'quiz') {
        // Quizzes don't need file content
        return {
            lessonId: lesson.id,
            title: lesson.title,
            contentType: lesson.content_type,
            hasValidContent: true,
            issues: []
        };
    }

    // Check if content_url or asset exists
    if (!lesson.content_url && !lesson.asset) {
        issues.push('No content_url or asset associated');
        hasValidContent = false;
    }

    // If using asset, check file_path is not empty
    if (lesson.asset) {
        if (!lesson.asset.file_path || lesson.asset.file_path.trim() === '') {
            issues.push(`Asset has empty file_path (asset_id: ${lesson.asset.id})`);
            hasValidContent = false;
        }

        if (lesson.asset.processing_status !== 'completed') {
            issues.push(`Asset processing status: ${lesson.asset.processing_status} (not completed)`);
            hasValidContent = false;
        }
    }

    // If legacy content_url, check it's not empty
    if (!lesson.asset && lesson.content_url) {
        if (lesson.content_url.trim() === '') {
            issues.push('Legacy content_url is empty');
            hasValidContent = false;
        }
    }

    return {
        lessonId: lesson.id,
        title: lesson.title,
        contentType: lesson.content_type,
        courseId: lesson.course_id,
        assetId: lesson.asset?.id,
        filePath: lesson.asset?.file_path || lesson.content_url,
        processingStatus: lesson.asset?.processing_status || 'N/A',
        hasValidContent,
        issues
    };
}
