'use server';

import { db } from '@/lib/db';
import { certificates, userCertificates, courses, enrollments, students } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';

export type StudentCertificate = {
    id: string;
    course_id: string;
    course_title: string;
    certificate_title: string;
    certificate_description: string | null;
    verification_code: string;
    issued_at: Date | string;
    student_name: string;
};

// ─── Fetch all certificates earned by student ──────────────────────────────────

export async function getStudentCertificates(): Promise<StudentCertificate[]> {
    const session = await verifySession();
    if (!session || session.userType !== 'student') {
        throw new Error('Unauthorized');
    }

    const rows = await db
        .select({
            id: userCertificates.id,
            course_id: certificates.course_id,
            course_title: courses.title,
            certificate_title: certificates.title,
            certificate_description: certificates.description,
            verification_code: userCertificates.verification_code,
            issued_at: userCertificates.created_at,
            student_name: students.first_name,
        })
        .from(userCertificates)
        .innerJoin(certificates, eq(userCertificates.certificate_id, certificates.id))
        .innerJoin(courses, eq(certificates.course_id, courses.id))
        .innerJoin(students, eq(userCertificates.user_id, students.id))
        .where(eq(userCertificates.user_id, session.userId));

    return rows.map(row => ({
        id: row.id,
        course_id: row.course_id,
        course_title: row.course_title,
        certificate_title: row.certificate_title,
        certificate_description: row.certificate_description,
        verification_code: row.verification_code,
        issued_at: row.issued_at,
        student_name: row.student_name || '',
    }));
}

// ─── Check if student has certificate for a specific course ──────────────────

export async function hasCertificateForCourse(courseId: string): Promise<boolean> {
    const session = await verifySession();
    if (!session || session.userType !== 'student') {
        return false;
    }

    const row = await db
        .select({ id: userCertificates.id })
        .from(userCertificates)
        .innerJoin(certificates, eq(userCertificates.certificate_id, certificates.id))
        .where(
            and(
                eq(userCertificates.user_id, session.userId),
                eq(certificates.course_id, courseId)
            )
        )
        .then(res => res[0]);

    return !!row;
}

// ─── Get certificate for specific course ─────────────────────────────────────

export async function getCertificateForCourse(courseId: string): Promise<StudentCertificate | null> {
    const session = await verifySession();
    if (!session || session.userType !== 'student') {
        return null;
    }

    const row = await db
        .select({
            id: userCertificates.id,
            course_id: certificates.course_id,
            course_title: courses.title,
            certificate_title: certificates.title,
            certificate_description: certificates.description,
            verification_code: userCertificates.verification_code,
            issued_at: userCertificates.created_at,
            student_name: students.first_name,
        })
        .from(userCertificates)
        .innerJoin(certificates, eq(userCertificates.certificate_id, certificates.id))
        .innerJoin(courses, eq(certificates.course_id, courses.id))
        .innerJoin(students, eq(userCertificates.user_id, students.id))
        .where(
            and(
                eq(userCertificates.user_id, session.userId),
                eq(certificates.course_id, courseId)
            )
        )
        .then(res => res[0]);

    if (!row) return null;

    return {
        id: row.id,
        course_id: row.course_id,
        course_title: row.course_title,
        certificate_title: row.certificate_title,
        certificate_description: row.certificate_description,
        verification_code: row.verification_code,
        issued_at: row.issued_at,
        student_name: row.student_name || '',
    };
}
