'use client';

import React from 'react';
import { useSchoolContext } from '@/modules/school-admin/providers/school-data-provider';
import { SchoolReportsTab } from '@/modules/school-admin/components/tabs/school-reports-tab';

export default function ReportsPage() {
    const { courseMetrics } = useSchoolContext();

    return (
        <SchoolReportsTab courseMetrics={courseMetrics} />
    );
}
