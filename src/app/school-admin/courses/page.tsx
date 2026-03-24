'use client';

import React from 'react';
import { useSchoolContext } from '@/modules/school-admin/providers/school-data-provider';
import { SchoolCoursesTab } from '@/modules/school-admin/components/tabs/school-courses-tab';

export default function CoursesPage() {
    const { courseMetrics, classesData } = useSchoolContext();

    return (
        <SchoolCoursesTab 
            courseMetrics={courseMetrics} 
            schoolClasses={classesData} 
        />
    );
}
