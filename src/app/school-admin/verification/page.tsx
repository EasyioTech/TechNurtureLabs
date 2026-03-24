'use client';

import React from 'react';
import { useSchoolContext } from '@/modules/school-admin/providers/school-data-provider';
import { SchoolVerificationTab } from '@/modules/school-admin/components/tabs/school-verification-tab';

export default function VerificationPage() {
    const { pendingStudents, verifyStudent, pendingLoading } = useSchoolContext();

    return (
        <SchoolVerificationTab 
            pendingStudents={pendingStudents}
            onVerify={verifyStudent}
            loading={pendingLoading}
        />
    );
}
