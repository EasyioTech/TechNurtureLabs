'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
    fetchCoursesWithCertificates,
    saveCertificateConfig,
    deleteCertificateConfig,
    fetchCompletedStudents,
    issueCertificate,
    revokeCertificate,
} from '../actions/sub-actions/certificate-actions';
import type { CourseWithCert, CompletedStudent } from '../actions/sub-actions/certificate-actions';

function isUnauthorized(err: unknown) {
    return (err as any)?.message === 'UNAUTHORIZED';
}
function handleUnauthorized() {
    window.location.href = '/admin-portal/login';
}

export function useAdminCertifications() {
    const [certCourses, setCertCourses] = useState<CourseWithCert[]>([]);
    const [certLoading, setCertLoading] = useState(false);
    const [certInitialized, setCertInitialized] = useState(false);

    const loadCertCourses = useCallback(async () => {
        setCertLoading(true);
        try {
            const data = await fetchCoursesWithCertificates();
            setCertCourses(data);
            setCertInitialized(true);
        } catch (err) {
            if (isUnauthorized(err)) { handleUnauthorized(); return; }
            toast.error('Failed to load courses for certifications');
        } finally {
            setCertLoading(false);
        }
    }, []);

    const saveCert = useCallback(async (data: any) => {
        try {
            await saveCertificateConfig(data);
            toast.success(data.id ? 'Certificate updated' : 'Certificate configured');
        } catch (err: any) {
            if (isUnauthorized(err)) { handleUnauthorized(); return; }
            toast.error(err?.message || 'Failed to save certificate');
            throw err;
        }
    }, []);

    const deleteCert = useCallback(async (id: string) => {
        try {
            await deleteCertificateConfig(id);
            toast.success('Certificate removed');
        } catch (err) {
            if (isUnauthorized(err)) { handleUnauthorized(); return; }
            toast.error('Failed to delete certificate');
            throw err;
        }
    }, []);

    const getCompletedStudents = useCallback(async (courseId: string): Promise<CompletedStudent[]> => {
        try {
            return await fetchCompletedStudents(courseId);
        } catch (err) {
            if (isUnauthorized(err)) { handleUnauthorized(); }
            toast.error('Failed to fetch students');
            return [];
        }
    }, []);

    const issueCert = useCallback(async (payload: {
        certificate_id: string;
        user_id: string;
        enrollment_id: string;
    }) => {
        try {
            const result = await issueCertificate(payload);
            toast.success('Certificate issued successfully!');
            return result;
        } catch (err: any) {
            if (isUnauthorized(err)) { handleUnauthorized(); return; }
            toast.error(err?.message || 'Failed to issue certificate');
            throw err;
        }
    }, []);

    const revokeCert = useCallback(async (userCertId: string) => {
        try {
            await revokeCertificate(userCertId);
            toast.success('Certificate revoked');
        } catch (err) {
            if (isUnauthorized(err)) { handleUnauthorized(); return; }
            toast.error('Failed to revoke certificate');
            throw err;
        }
    }, []);

    return {
        certCourses,
        certLoading,
        certInitialized,
        loadCertCourses,
        saveCert,
        deleteCert,
        getCompletedStudents,
        issueCert,
        revokeCert,
    };
}
