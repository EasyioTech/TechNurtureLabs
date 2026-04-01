'use server';

import { db } from '@/lib/db';
import {
    certificates, userCertificates, courses, enrollments,
    students, schools, courseProgress
} from '@/db/schema';
import { eq, and, isNull, desc, count, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { requireSuperAdmin } from '@/lib/admin-guard';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CertificateConfig = {
    id: string;
    course_id: string;
    title: string;
    description: string | null;
    min_progress_pct: string;
    is_active: boolean;
    created_at: Date | string;
};

export type CompletedStudent = {
    user_id: string;
    full_name: string;
    email: string | null;
    school_name: string;
    completed_at: Date | string | null;
    progress_pct: string;
    enrollment_id: string;
    certificate_issued: boolean;
    certificate_id: string | null;
    verification_code: string | null;
};

export type CourseWithCert = {
    id: string;
    title: string;
    thumbnail_url: string | null;
    is_published: boolean;
    total_lessons: number;
    enrolled_count: number;
    completed_count: number;
    certificate: CertificateConfig | null;
};

// ─── Schema ──────────────────────────────────────────────────────────────────

const certSchema = z.object({
    id: z.string().uuid().optional().nullable(),
    course_id: z.string().uuid(),
    title: z.string().min(1, 'Certificate title is required').max(255),
    description: z.string().optional().nullable(),
    min_progress_pct: z.coerce.number().min(0).max(100).default(100),
    is_active: z.boolean().default(true),
});

// ─── Fetch all courses with certificate info ──────────────────────────────────

export async function fetchCoursesWithCertificates(): Promise<CourseWithCert[]> {
    await requireSuperAdmin();

    const rows = await db.query.courses.findMany({
        where: isNull(courses.deleted_at),
        orderBy: [desc(courses.created_at)],
        with: {
            certificates: {
                limit: 1,
                orderBy: [desc(certificates.created_at)],
            },
        },
    });

    // Get enrollment counts per course
    const enrollCounts = await db
        .select({
            course_id: enrollments.course_id,
            total: count(enrollments.id),
        })
        .from(enrollments)
        .where(isNull(enrollments.deleted_at))
        .groupBy(enrollments.course_id);

    const enrollMap = Object.fromEntries(enrollCounts.map(r => [r.course_id, Number(r.total)]));

    // Get completion counts per course (progress_pct >= 100 or >= '100')
    const completeCounts = await db
        .select({
            course_id: courseProgress.course_id,
            total: count(courseProgress.id),
        })
        .from(courseProgress)
        .where(sql`CAST(${courseProgress.progress_pct} AS NUMERIC) >= 100`)
        .groupBy(courseProgress.course_id);

    const completeMap = Object.fromEntries(completeCounts.map(r => [r.course_id, Number(r.total)]));

    return rows.map(c => ({
        id: c.id,
        title: c.title,
        thumbnail_url: c.thumbnail_url,
        is_published: c.is_published,
        total_lessons: c.total_lessons,
        enrolled_count: enrollMap[c.id] ?? 0,
        completed_count: completeMap[c.id] ?? 0,
        certificate: (c.certificates as any[])?.[0]
            ? {
                id: (c.certificates as any[])[0].id,
                course_id: c.id,
                title: (c.certificates as any[])[0].title,
                description: (c.certificates as any[])[0].description,
                min_progress_pct: (c.certificates as any[])[0].min_progress_pct,
                is_active: (c.certificates as any[])[0].is_active,
                created_at: (c.certificates as any[])[0].created_at,
            }
            : null,
    }));
}

// ─── Save (create / update) certificate config ────────────────────────────────

export async function saveCertificateConfig(data: unknown) {
    await requireSuperAdmin();

    const parsed = certSchema.parse(data);

    if (parsed.id) {
        // Update
        const [updated] = await db
            .update(certificates)
            .set({
                title: parsed.title,
                description: parsed.description ?? null,
                min_progress_pct: String(parsed.min_progress_pct),
                is_active: parsed.is_active,
                updated_at: new Date(),
            })
            .where(eq(certificates.id, parsed.id))
            .returning();
        return updated;
    } else {
        // Check if one already exists for the course
        const existing = await db.query.certificates.findFirst({
            where: eq(certificates.course_id, parsed.course_id),
        });
        if (existing) {
            // Update the existing one
            const [updated] = await db
                .update(certificates)
                .set({
                    title: parsed.title,
                    description: parsed.description ?? null,
                    min_progress_pct: String(parsed.min_progress_pct),
                    is_active: parsed.is_active,
                    updated_at: new Date(),
                })
                .where(eq(certificates.id, existing.id))
                .returning();
            return updated;
        }
        const [created] = await db
            .insert(certificates)
            .values({
                course_id: parsed.course_id,
                title: parsed.title,
                description: parsed.description ?? null,
                min_progress_pct: String(parsed.min_progress_pct),
                is_active: parsed.is_active,
            } as any)
            .returning();
        return created;
    }
}

// ─── Delete certificate config ────────────────────────────────────────────────

export async function deleteCertificateConfig(id: string) {
    await requireSuperAdmin();
    await db.delete(certificates).where(eq(certificates.id, id));
}

// ─── Fetch students who completed a specific course ───────────────────────────

export async function fetchCompletedStudents(courseId: string): Promise<CompletedStudent[]> {
    await requireSuperAdmin();

    // Students where course_progress >= 100
    const progRows = await db
        .select({
            user_id: courseProgress.user_id,
            course_id: courseProgress.course_id,
            completed_at: courseProgress.completed_at,
            progress_pct: courseProgress.progress_pct,
            enrollment_id: courseProgress.enrollment_id,
        })
        .from(courseProgress)
        .where(
            and(
                eq(courseProgress.course_id, courseId),
                sql`${courseProgress.progress_pct} >= 100`
            )
        )
        .orderBy(desc(courseProgress.completed_at));

    if (progRows.length === 0) return [];

    const studentIds = [...new Set(progRows.map(r => r.user_id))];

    // Get student info with school name
    const studentRows = studentIds.length > 0
        ? await db
            .select({
                id: students.id,
                first_name: students.first_name,
                last_name: students.last_name,
                email: students.email,
                school_id: students.school_id,
            })
            .from(students)
            .where(inArray(students.id, studentIds))
        : [];

    const schoolIds = [...new Set(studentRows.map(r => r.school_id))];
    const schoolRows = schoolIds.length > 0
        ? await db
            .select({ id: schools.id, name: schools.name })
            .from(schools)
            .where(inArray(schools.id, schoolIds))
        : [];

    const schoolMap = Object.fromEntries(schoolRows.map(s => [s.id, s.name]));
    const studentMap = Object.fromEntries(
        studentRows.map(s => [s.id, {
            full_name: `${s.first_name} ${s.last_name}`.trim(),
            email: s.email,
            school_name: schoolMap[s.school_id] ?? 'Unknown School',
        }])
    );

    // Get certificates already issued
    const enrollmentIds = progRows.map(r => r.enrollment_id);
    const issuedCerts = enrollmentIds.length > 0
        ? await db
            .select({
                enrollment_id: userCertificates.enrollment_id,
                id: userCertificates.id,
                verification_code: userCertificates.verification_code,
            })
            .from(userCertificates)
            .innerJoin(certificates, eq(userCertificates.certificate_id, certificates.id))
            .where(eq(certificates.course_id, courseId))
        : [];

    const certMap = Object.fromEntries(
        issuedCerts.map(c => [c.enrollment_id, { id: c.id, verification_code: c.verification_code }])
    );

    return progRows.map(row => {
        const student = studentMap[row.user_id];
        const issued = certMap[row.enrollment_id];
        return {
            user_id: row.user_id,
            full_name: student?.full_name ?? 'Unknown',
            email: student?.email ?? null,
            school_name: student?.school_name ?? 'Unknown',
            completed_at: row.completed_at,
            progress_pct: String(row.progress_pct),
            enrollment_id: row.enrollment_id,
            certificate_issued: !!issued,
            certificate_id: issued?.id ?? null,
            verification_code: issued?.verification_code ?? null,
        };
    });
}

// ─── Issue a certificate to a student ────────────────────────────────────────

export async function issueCertificate(payload: {
    certificate_id: string;
    user_id: string;
    enrollment_id: string;
}) {
    await requireSuperAdmin();

    const code = `TECH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const [row] = await db
        .insert(userCertificates)
        .values({
            user_id: payload.user_id,
            certificate_id: payload.certificate_id,
            enrollment_id: payload.enrollment_id,
            verification_code: code,
        } as any)
        .onConflictDoNothing()
        .returning();

    return row;
}

// ─── Revoke a certificate ─────────────────────────────────────────────────────

export async function revokeCertificate(userCertId: string) {
    await requireSuperAdmin();
    await db.delete(userCertificates).where(eq(userCertificates.id, userCertId));
}
