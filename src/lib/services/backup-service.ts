import { db } from '@/lib/db';
import * as schema from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { uploadFile, getObjectStream, s3Client, isCloudflareConfigured } from '@/lib/storage';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { serverEnv } from '@/lib/env.server';

export interface CourseBackupData {
    version: string;
    timestamp: string;
    classes: typeof schema.classes.$inferSelect[];
    courses: (typeof schema.courses.$inferSelect & {
        lessons: (typeof schema.lessons.$inferSelect & {
            quiz?: typeof schema.quizzes.$inferSelect & {
                questions: (typeof schema.quizQuestions.$inferSelect & {
                    options: typeof schema.quizOptions.$inferSelect[];
                })[];
            };
        })[];
        quizzes: (typeof schema.quizzes.$inferSelect & {
            questions: (typeof schema.quizQuestions.$inferSelect & {
                options: typeof schema.quizOptions.$inferSelect[];
            })[];
        })[];
        classMapping: typeof schema.courseClassMapping.$inferSelect[];
    })[];
    mediaAssets: typeof schema.mediaAssets.$inferSelect[];
}

export async function exportAllCourses(): Promise<CourseBackupData> {
    // 1. Fetch all classes
    const classes = await db.query.classes.findMany();

    // 2. Fetch all courses with full depth
    const allCourses = await db.query.courses.findMany({
        with: {
            lessons: {
                with: {
                    quiz: {
                        with: {
                            questions: {
                                with: {
                                    options: true
                                }
                            }
                        }
                    }
                }
            },
            quizzes: {
                // Quizzes can be top-level too if not linked to lesson
                where: (quizzes, { isNull }) => isNull(quizzes.lesson_id),
                with: {
                    questions: {
                        with: {
                            options: true
                        }
                    }
                }
            },
            classMapping: true
        }
    });

    // 3. Collect all referenced media asset IDs
    const assetIds = new Set<string>();
    allCourses.forEach(course => {
        if (course.thumbnail_url?.includes('/api/media/')) {
            // Might be a media asset ID or path
        }
        course.lessons.forEach(lesson => {
            if (lesson.asset_id) assetIds.add(lesson.asset_id);
        });
    });

    const mediaAssets = assetIds.size > 0 
        ? await db.query.mediaAssets.findMany({
            where: inArray(schema.mediaAssets.id, Array.from(assetIds))
          })
        : [];

    return {
        version: '1.0',
        timestamp: new Date().toISOString(),
        classes,
        courses: allCourses,
        mediaAssets
    };
}

export async function uploadBackupToR2(backupData: CourseBackupData): Promise<string> {
    if (!isCloudflareConfigured || !s3Client) {
        throw new Error("R2 is not configured. Cannot save backup.");
    }

    const payload = JSON.stringify(backupData);
    const fileName = `backups/courses/all_courses_${new Date().getTime()}.json`;

    const command = new PutObjectCommand({
        Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
        Key: fileName,
        Body: Buffer.from(payload),
        ContentType: 'application/json',
    });

    await s3Client.send(command);
    return fileName;
}

export async function downloadBackupFromR2(fileName: string): Promise<CourseBackupData> {
    if (!isCloudflareConfigured || !s3Client) {
        throw new Error("R2 is not configured.");
    }

    const command = new GetObjectCommand({
        Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
        Key: fileName,
    });

    const response = await s3Client.send(command);
    const bodyContents = await response.Body?.transformToString();
    if (!bodyContents) throw new Error("Backup file is empty");

    return JSON.parse(bodyContents);
}

export async function restoreBackup(backupData: CourseBackupData, superAdminId: string) {
    return await db.transaction(async (tx) => {
        // 1. Restore Classes (or map existing)
        const classMap = new Map<string, string>(); // oldId -> newId
        for (const cls of backupData.classes) {
            const existingClass = await tx.query.classes.findFirst({
                where: eq(schema.classes.level, cls.level)
            });

            if (existingClass) {
                classMap.set(cls.id, existingClass.id);
            } else {
                const [newCls] = await tx.insert(schema.classes).values({
                    name: cls.name,
                    level: cls.level,
                }).returning();
                classMap.set(cls.id, newCls.id);
            }
        }

        // 2. Restore Media Assets
        const assetMap = new Map<string, string>(); // oldId -> newId
        for (const asset of backupData.mediaAssets) {
            const [newAsset] = await tx.insert(schema.mediaAssets).values({
                ...asset,
                id: undefined, // Let DB generate new
                created_at: new Date(),
                updated_at: new Date()
            }).returning();
            assetMap.set(asset.id, newAsset.id);
        }

        // 3. Restore Courses
        for (const courseData of backupData.courses) {
            // Check if course slug already exists
            const existingCourse = await tx.query.courses.findFirst({
                where: eq(schema.courses.slug, courseData.slug)
            });

            if (existingCourse) {
                console.log(`[Backup] Skipping course ${courseData.slug} - already exists`);
                continue;
            }

            const [newCourse] = await tx.insert(schema.courses).values({
                title: courseData.title,
                slug: courseData.slug,
                description: courseData.description,
                thumbnail_url: courseData.thumbnail_url,
                is_published: courseData.is_published,
                all_classes: courseData.all_classes,
                total_lessons: courseData.total_lessons,
                total_xp: courseData.total_xp,
                category: courseData.category,
                topics: courseData.topics,
                created_by: superAdminId,
            }).returning();

            // 4. Restore Class Mapping
            for (const mapping of courseData.classMapping) {
                const newClassId = classMap.get(mapping.class_id);
                if (newClassId) {
                    await tx.insert(schema.courseClassMapping).values({
                        course_id: newCourse.id,
                        class_id: newClassId,
                        is_active: mapping.is_active
                    });
                }
            }

            // 5. Restore Lessons
            for (const lessonData of courseData.lessons) {
                const [newLesson] = await tx.insert(schema.lessons).values({
                    course_id: newCourse.id,
                    title: lessonData.title,
                    description: lessonData.description,
                    content_type: lessonData.content_type,
                    content_url: lessonData.content_url,
                    content_items: lessonData.content_items,
                    asset_id: lessonData.asset_id ? assetMap.get(lessonData.asset_id) : null,
                    sequence_order: lessonData.sequence_order,
                    duration_minutes: lessonData.duration_minutes,
                    xp_reward: lessonData.xp_reward,
                    is_published: lessonData.is_published,
                }).returning();

                // 6. Restore Lesson Quizzes
                if (lessonData.quiz) {
                    const quiz = lessonData.quiz;
                    const [newQuiz] = await tx.insert(schema.quizzes).values({
                        lesson_id: newLesson.id,
                        course_id: newCourse.id,
                        title: quiz.title,
                        description: quiz.description,
                        time_limit_secs: quiz.time_limit_secs,
                        pass_percentage: quiz.pass_percentage,
                        max_attempts: quiz.max_attempts,
                        xp_reward: quiz.xp_reward,
                        is_published: quiz.is_published,
                    }).returning();

                    // 7. Restore Quiz Questions
                    for (const qData of quiz.questions) {
                        const [newQ] = await tx.insert(schema.quizQuestions).values({
                            quiz_id: newQuiz.id,
                            question_text: qData.question_text,
                            question_type: qData.question_type,
                            explanation: qData.explanation,
                            points: qData.points,
                            time_limit_secs: qData.time_limit_secs,
                            sequence_order: qData.sequence_order,
                        }).returning();

                        // 8. Restore Quiz Options
                        for (const opt of qData.options) {
                            await tx.insert(schema.quizOptions).values({
                                question_id: newQ.id,
                                option_text: opt.option_text,
                                is_correct: opt.is_correct,
                                sequence_order: opt.sequence_order
                            });
                        }
                    }
                }
            }

            // Restore Top-level quizzes? (If any)
            for (const quizData of courseData.quizzes) {
                 const [newQuiz] = await tx.insert(schema.quizzes).values({
                    course_id: newCourse.id,
                    title: quizData.title,
                    description: quizData.description,
                    time_limit_secs: quizData.time_limit_secs,
                    pass_percentage: quizData.pass_percentage,
                    max_attempts: quizData.max_attempts,
                    xp_reward: quizData.xp_reward,
                    is_published: quizData.is_published,
                }).returning();

                for (const qData of quizData.questions) {
                    const [newQ] = await tx.insert(schema.quizQuestions).values({
                        quiz_id: newQuiz.id,
                        question_text: qData.question_text,
                        question_type: qData.question_type,
                        explanation: qData.explanation,
                        points: qData.points,
                        time_limit_secs: qData.time_limit_secs,
                        sequence_order: qData.sequence_order,
                    }).returning();

                    for (const opt of qData.options) {
                        await tx.insert(schema.quizOptions).values({
                            question_id: newQ.id,
                            option_text: opt.option_text,
                            is_correct: opt.is_correct,
                            sequence_order: opt.sequence_order
                        });
                    }
                }
            }
        }
    });
}
