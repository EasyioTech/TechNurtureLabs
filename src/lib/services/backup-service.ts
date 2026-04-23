import { db } from '@/lib/db';
import * as schema from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { uploadFile, getObjectStream, s3Client, isCloudflareConfigured } from '@/lib/storage';
import { PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { serverEnv } from '@/lib/env.server';
import crypto from 'crypto';

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

export interface LessonBackupData {
    version: string;
    timestamp: string;
    lesson: typeof schema.lessons.$inferSelect & {
        quiz?: typeof schema.quizzes.$inferSelect & {
            questions: (typeof schema.quizQuestions.$inferSelect & {
                options: typeof schema.quizOptions.$inferSelect[];
            })[];
        };
    };
    mediaAsset?: typeof schema.mediaAssets.$inferSelect;
}

/**
 * Calculate SHA256 hash of backup data to detect changes
 */
export function calculateBackupHash(data: CourseBackupData): string {
    const jsonStr = JSON.stringify(data);
    return crypto.createHash('sha256').update(jsonStr).digest('hex');
}

/**
 * Get the most recent backup hash from R2 metadata
 * Returns null if no previous backup exists
 */
export async function getLastBackupHash(courseId?: string): Promise<{ hash: string; fileName: string } | null> {
    if (!isCloudflareConfigured || !s3Client) return null;

    try {
        const prefix = 'backups/courses/';
        const command = new ListObjectsV2Command({
            Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
            Prefix: prefix,
        });

        const response = await s3Client.send(command);
        if (!response.Contents || response.Contents.length === 0) return null;

        // Get the most recent backup file
        const sortedBackups = (response.Contents || [])
            .sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0));

        const latestBackup = sortedBackups[0];
        if (!latestBackup?.Key) return null;

        // Download and parse the latest backup
        const getCommand = new GetObjectCommand({
            Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
            Key: latestBackup.Key,
        });

        const getResponse = await s3Client.send(getCommand);
        const bodyContents = await getResponse.Body?.transformToString();
        if (!bodyContents) return null;

        const lastBackup = JSON.parse(bodyContents);
        const hash = calculateBackupHash(lastBackup);
        return { hash, fileName: latestBackup.Key };
    } catch (error) {
        console.error('[Backup Service] Error getting last backup hash:', error);
        return null;
    }
}

export async function exportAllCourses(): Promise<CourseBackupData> {
    // 1. Fetch all classes (excluding deleted ones)
    const classes = await db.query.classes.findMany({
        where: (classes, { isNull }) => isNull(classes.deleted_at)
    });

    // 2. Fetch all courses with full depth (excluding deleted ones)
    const allCourses = await db.query.courses.findMany({
        where: (courses, { isNull }) => isNull(courses.deleted_at),
        with: {
            lessons: {
                where: (lessons, { isNull }) => isNull(lessons.deleted_at),
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
                where: (quizzes, { and, isNull }) => and(
                    isNull(quizzes.lesson_id),
                    isNull(quizzes.deleted_at)
                ),
                with: {
                    questions: {
                        with: {
                            options: true
                        }
                    }
                }
            },
            classMapping: {
                where: (mapping, { isNull }) => isNull(mapping.deleted_at)
            }
        }
    });

    // 3. Collect all referenced media asset IDs
    const assetIds = new Set<string>();
    allCourses.forEach(course => {
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

export async function exportLesson(lessonId: string): Promise<LessonBackupData> {
    const lesson = await db.query.lessons.findFirst({
        where: (lessons, { and, eq, isNull }) => and(
            eq(lessons.id, lessonId),
            isNull(lessons.deleted_at)
        ),
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
    });

    if (!lesson) throw new Error("Lesson not found");

    const mediaAsset = lesson.asset_id 
        ? await db.query.mediaAssets.findFirst({ where: eq(schema.mediaAssets.id, lesson.asset_id) })
        : undefined;

    return {
        version: '1.0',
        timestamp: new Date().toISOString(),
        lesson,
        mediaAsset
    };
}

export async function exportCourse(courseId: string): Promise<CourseBackupData> {
    const course = await db.query.courses.findFirst({
        where: (courses, { and, eq, isNull }) => and(
            eq(courses.id, courseId),
            isNull(courses.deleted_at)
        ),
        with: {
            lessons: {
                where: (lessons, { isNull }) => isNull(lessons.deleted_at),
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
                where: (quizzes, { and, isNull }) => and(
                    isNull(quizzes.lesson_id),
                    isNull(quizzes.deleted_at)
                ),
                with: {
                    questions: {
                        with: {
                            options: true
                        }
                    }
                }
            },
            classMapping: {
                where: (mapping, { isNull }) => isNull(mapping.deleted_at)
            }
        }
    });

    if (!course) throw new Error("Course not found");

    const assetIds = new Set<string>();
    course.lessons.forEach(lesson => {
        if (lesson.asset_id) assetIds.add(lesson.asset_id);
    });

    const mediaAssets = assetIds.size > 0 
        ? await db.query.mediaAssets.findMany({
            where: inArray(schema.mediaAssets.id, Array.from(assetIds))
          })
        : [];

    return {
        version: '1.0',
        timestamp: new Date().toISOString(),
        classes: [], 
        courses: [course as any],
        mediaAssets
    };
}

export async function uploadBackupToR2(backupData: any, type: 'course' | 'lesson' = 'course'): Promise<{ fileName: string; hash: string; isNew: boolean }> {
    if (!isCloudflareConfigured || !s3Client) {
        throw new Error("R2 is not configured. Cannot save backup.");
    }

    // Calculate hash of current backup data
    const currentHash = calculateBackupHash(backupData);

    // Check if data has changed since last backup
    const lastBackup = await getLastBackupHash();
    const isNew = !lastBackup || lastBackup.hash !== currentHash;

    if (!isNew) {
        console.log('[Backup Service] No changes detected. Skipping backup creation.');
        return {
            fileName: lastBackup?.fileName || '',
            hash: currentHash,
            isNew: false
        };
    }

    const payload = JSON.stringify(backupData);
    const prefix = type === 'course' ? 'courses' : 'lessons';

    let baseName = 'backup';
    if (type === 'course') {
        const bd = backupData as CourseBackupData;
        baseName = bd.courses.length === 1 ? bd.courses[0].title.replace(/\s+/g, '_').toLowerCase() : 'all_courses';
    } else {
        const bd = backupData as LessonBackupData;
        baseName = bd.lesson.title.replace(/\s+/g, '_').toLowerCase();
    }

    const fileName = `backups/${prefix}/${baseName}_${new Date().getTime()}.json`;

    const command = new PutObjectCommand({
        Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
        Key: fileName,
        Body: Buffer.from(payload),
        ContentType: 'application/json',
        Metadata: {
            'backup-hash': currentHash,
            'backup-timestamp': new Date().toISOString(),
        }
    });

    await s3Client.send(command);
    console.log(`[Backup Service] New backup created: ${fileName}`);
    return { fileName, hash: currentHash, isNew: true };
}

export async function downloadBackupFromR2(fileName: string): Promise<any> {
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
    console.log(`[Backup Service] Starting system restore for ${backupData.courses.length} courses...`);
    let coursesCount = 0;
    let lessonsCount = 0;
    let assetsCount = 0;
    let quizzesCount = 0;

    return await db.transaction(async (tx) => {
        // PERFORMANCE: Batch fetch all existing records to avoid N+1 queries
        // CRITICAL: Only fetch non-deleted courses to prevent resurrecting soft-deleted data
        const existingClasses = await tx.query.classes.findMany({
            where: (classes, { isNull }) => isNull(classes.deleted_at)
        });
        const existingAssets = await tx.query.mediaAssets.findMany();
        const existingCourses = await tx.query.courses.findMany({
            where: (courses, { isNull }) => isNull(courses.deleted_at)
        });

        // Build lookup maps
        const classByLevel = new Map(existingClasses.map(c => [c.level, c]));
        const assetByPath = new Map(existingAssets.map(a => [a.file_path, a]));
        const courseBySlug = new Map(existingCourses.map(c => [c.slug, c]));

        // 1. Restore Classes
        console.log(`[Backup Service] Step 1: Restoring ${backupData.classes.length} classes...`);
        const classMap = new Map<string, string>();
        for (const cls of backupData.classes) {
            const existingClass = classByLevel.get(cls.level);
            if (existingClass) {
                classMap.set(cls.id, existingClass.id);
            } else {
                const [newCls] = await tx.insert(schema.classes).values({ name: cls.name, level: cls.level }).returning();
                classMap.set(cls.id, newCls.id);
            }
        }

        // 2. Restore Media Assets
        console.log(`[Backup Service] Step 2: Restoring ${backupData.mediaAssets.length} media assets...`);
        const assetMap = new Map<string, string>();
        for (const asset of backupData.mediaAssets) {
            const existingAsset = assetByPath.get(asset.file_path);
            if (existingAsset) {
                assetMap.set(asset.id, existingAsset.id);
            } else {
                const [newAsset] = await tx.insert(schema.mediaAssets).values({
                    ...asset,
                    id: undefined,
                    created_at: new Date(),
                    updated_at: new Date()
                }).returning();
                assetMap.set(asset.id, newAsset.id);
                assetsCount++;
            }
        }

        // 3. Restore Courses
        for (const courseData of backupData.courses) {
            let courseId: string;
            const existingCourse = courseBySlug.get(courseData.slug);

            if (existingCourse) {
                await tx.update(schema.courses).set({
                    title: courseData.title,
                    description: courseData.description,
                    thumbnail_url: courseData.thumbnail_url,
                    is_published: courseData.is_published,
                    all_classes: courseData.all_classes,
                    total_lessons: courseData.total_lessons,
                    total_xp: courseData.total_xp,
                    category: courseData.category,
                    topics: courseData.topics,
                    updated_at: new Date(),
                    deleted_at: null,
                }).where(eq(schema.courses.id, existingCourse.id));
                courseId = existingCourse.id;
            } else {
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
                courseId = newCourse.id;
                coursesCount++;
            }
            console.log(`[Backup Service] Processed Course: ${courseData.title} (ID: ${courseId})`);

            // 4. Restore Class Mapping
            for (const mapping of courseData.classMapping) {
                const newClassId = classMap.get(mapping.class_id);
                if (newClassId) {
                    await tx.insert(schema.courseClassMapping).values({
                        course_id: courseId,
                        class_id: newClassId,
                    }).onConflictDoUpdate({
                        target: [schema.courseClassMapping.course_id, schema.courseClassMapping.class_id],
                        set: { deleted_at: null }
                    });
                }
            }

            // 5. Restore Lessons
            for (const lessonData of courseData.lessons) {
                const existingLesson = await tx.query.lessons.findFirst({
                    where: (lessons, { and, eq }) => and(eq(lessons.course_id, courseId), eq(lessons.title, lessonData.title))
                });

                let lessonId: string;
                const lessonPayload = {
                    course_id: courseId,
                    title: lessonData.title,
                    description: lessonData.description,
                    content_type: lessonData.content_type,
                    content_url: lessonData.content_url,
                    content_items: lessonData.content_items,
                    asset_id: lessonData.asset_id ? (assetMap.get(lessonData.asset_id) || lessonData.asset_id) : null,
                    sequence_order: lessonData.sequence_order,
                    duration_minutes: lessonData.duration_minutes,
                    xp_reward: lessonData.xp_reward,
                    is_published: lessonData.is_published,
                    updated_at: new Date(),
                    deleted_at: null,
                };

                if (existingLesson) {
                    await tx.update(schema.lessons).set(lessonPayload).where(eq(schema.lessons.id, existingLesson.id));
                    lessonId = existingLesson.id;
                } else {
                    const [nl] = await tx.insert(schema.lessons).values({ ...lessonPayload, updated_at: undefined }).returning();
                    lessonId = nl.id;
                    lessonsCount++;
                }

                if (lessonData.quiz) {
                    const quiz = lessonData.quiz;
                    const existingQuiz = await tx.query.quizzes.findFirst({ where: eq(schema.quizzes.lesson_id, lessonId) });
                    let quizId: string;
                    const quizPayload = {
                        lesson_id: lessonId,
                        course_id: courseId,
                        title: quiz.title,
                        description: quiz.description,
                        time_limit_secs: quiz.time_limit_secs,
                        pass_percentage: quiz.pass_percentage,
                        max_attempts: quiz.max_attempts,
                        xp_reward: quiz.xp_reward,
                        is_published: quiz.is_published,
                        updated_at: new Date(),
                        deleted_at: null,
                    };

                    if (existingQuiz) {
                        await tx.update(schema.quizzes).set(quizPayload).where(eq(schema.quizzes.id, existingQuiz.id));
                        quizId = existingQuiz.id;
                    } else {
                        const [nq] = await tx.insert(schema.quizzes).values({ ...quizPayload, updated_at: undefined }).returning();
                        quizId = nq.id;
                        quizzesCount++;
                    }

                    await tx.delete(schema.quizQuestions).where(eq(schema.quizQuestions.quiz_id, quizId));
                    for (const qData of quiz.questions) {
                        const [newQ] = await tx.insert(schema.quizQuestions).values({
                            quiz_id: quizId,
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

            // 6. Restore Course-level Quizzes
            for (const quizData of courseData.quizzes) {
                const existingQuiz = await tx.query.quizzes.findFirst({
                    where: (quizzes, { and, eq, isNull }) => and(eq(quizzes.course_id, courseId), isNull(quizzes.lesson_id), eq(quizzes.title, quizData.title))
                });

                let quizId: string;
                const quizPayload = {
                    course_id: courseId,
                    lesson_id: null,
                    title: quizData.title,
                    description: quizData.description,
                    time_limit_secs: quizData.time_limit_secs,
                    pass_percentage: quizData.pass_percentage,
                    max_attempts: quizData.max_attempts,
                    xp_reward: quizData.xp_reward,
                    is_published: quizData.is_published,
                    updated_at: new Date(),
                    deleted_at: null,
                };

                if (existingQuiz) {
                    await tx.update(schema.quizzes).set(quizPayload).where(eq(schema.quizzes.id, existingQuiz.id));
                    quizId = existingQuiz.id;
                } else {
                    const [nq] = await tx.insert(schema.quizzes).values({ ...quizPayload, updated_at: undefined }).returning();
                    quizId = nq.id;
                    quizzesCount++;
                }

                await tx.delete(schema.quizQuestions).where(eq(schema.quizQuestions.quiz_id, quizId));
                for (const qData of quizData.questions) {
                    const [newQ] = await tx.insert(schema.quizQuestions).values({
                        quiz_id: quizId,
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

        console.log(`[Backup Service] Restore completed: ${coursesCount} courses, ${lessonsCount} lessons, ${assetsCount} assets, ${quizzesCount} quizzes.`);
        return { success: true, coursesCount, lessonsCount, assetsCount, quizzesCount };
    });
}

export async function restoreLessonBackup(backupData: LessonBackupData, targetCourseId: string) {
    return await db.transaction(async (tx) => {
        const { lesson, mediaAsset } = backupData;
        
        let assetId = null;
        if (mediaAsset) {
            const existingAsset = await tx.query.mediaAssets.findFirst({ where: eq(schema.mediaAssets.file_path, mediaAsset.file_path) });
            if (existingAsset) {
                assetId = existingAsset.id;
            } else {
                const [na] = await tx.insert(schema.mediaAssets).values({
                    ...mediaAsset,
                    id: undefined,
                    created_at: new Date(),
                    updated_at: new Date()
                }).returning();
                assetId = na.id;
            }
        }

        console.log(`[Backup Service] Restoring lesson "${lesson.title}" into course ID ${targetCourseId}`);
        const existingLesson = await tx.query.lessons.findFirst({
            where: (l, { and, eq }) => and(eq(l.course_id, targetCourseId), eq(l.title, lesson.title))
        });

        const lessonPayload = {
            course_id: targetCourseId,
            title: lesson.title,
            description: lesson.description,
            content_type: lesson.content_type,
            content_url: lesson.content_url,
            content_items: lesson.content_items,
            asset_id: assetId || lesson.asset_id,
            sequence_order: lesson.sequence_order,
            duration_minutes: lesson.duration_minutes,
            xp_reward: lesson.xp_reward,
            is_published: lesson.is_published,
            updated_at: new Date(),
            deleted_at: null,
        };

        let lessonId: string;
        if (existingLesson) {
            await tx.update(schema.lessons).set(lessonPayload).where(eq(schema.lessons.id, existingLesson.id));
            lessonId = existingLesson.id;
        } else {
            const [nl] = await tx.insert(schema.lessons).values({ ...lessonPayload, updated_at: undefined }).returning();
            lessonId = nl.id;
        }

        if (lesson.quiz) {
            const quiz = lesson.quiz;
            const existingQuiz = await tx.query.quizzes.findFirst({ where: eq(schema.quizzes.lesson_id, lessonId) });
            let quizId: string;
            
            const quizPayload = {
                lesson_id: lessonId,
                course_id: targetCourseId,
                title: quiz.title,
                description: quiz.description,
                time_limit_secs: quiz.time_limit_secs,
                pass_percentage: quiz.pass_percentage,
                max_attempts: quiz.max_attempts,
                xp_reward: quiz.xp_reward,
                is_published: quiz.is_published,
                updated_at: new Date(),
                deleted_at: null,
            };

            if (existingQuiz) {
                await tx.update(schema.quizzes).set(quizPayload).where(eq(schema.quizzes.id, existingQuiz.id));
                quizId = existingQuiz.id;
            } else {
                const [nq] = await tx.insert(schema.quizzes).values({ ...quizPayload, updated_at: undefined }).returning();
                quizId = nq.id;
            }

            await tx.delete(schema.quizQuestions).where(eq(schema.quizQuestions.quiz_id, quizId));
            for (const q of quiz.questions) {
                const [newQ] = await tx.insert(schema.quizQuestions).values({
                    quiz_id: quizId,
                    question_text: q.question_text,
                    question_type: q.question_type,
                    explanation: q.explanation,
                    points: q.points,
                    time_limit_secs: q.time_limit_secs,
                    sequence_order: q.sequence_order
                }).returning();

                for (const opt of q.options) {
                    await tx.insert(schema.quizOptions).values({
                        question_id: newQ.id,
                        option_text: opt.option_text,
                        is_correct: opt.is_correct,
                        sequence_order: opt.sequence_order
                    });
                }
            }
        }
        console.log(`[Backup Service] Lesson restore completed successfully`);
        return { success: true };
    });
}


