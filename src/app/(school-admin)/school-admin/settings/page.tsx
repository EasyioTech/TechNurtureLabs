'use client';

import React from 'react';
import { useSchoolContext } from '@/modules/school-admin/providers/school-data-provider';
import { SchoolSettingsTab } from '@/modules/school-admin/components/tabs/school-settings-tab';
import { StandardLoader } from '@/modules/school-admin/components/shared/standard-loader';

export default function SettingsPage() {
    const {
        schoolId, stats, classesData, globalClasses, refreshData, setIsProfileModalOpen, loading
    } = useSchoolContext();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <StandardLoader message="Loading Settings..." size="large" />
            </div>
        );
    }

    return (
        <SchoolSettingsTab
            stats={stats}
            schoolId={schoolId}
            classesData={classesData}
            globalClasses={globalClasses}
            onRefresh={refreshData}
            onOpenSchoolProfile={() => setIsProfileModalOpen(true)}
        />
    );
}
