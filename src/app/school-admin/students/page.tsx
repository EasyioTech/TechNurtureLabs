'use client';

import React from 'react';
import { useSchoolContext } from '@/modules/school-admin/providers/school-data-provider';
import { SchoolStudentsTab } from '@/modules/school-admin/components/tabs/school-students-tab';

export default function StudentsPage() {
    const { 
        pagedStudents, totalStudentsCount, totalStudentPages, 
        studentsPage, setStudentsPage, studentSearch, setStudentSearch, 
        toggleStudent, studentsLoading 
    } = useSchoolContext();

    return (
        <SchoolStudentsTab
            pagedStudents={pagedStudents}
            totalStudentsCount={totalStudentsCount}
            totalStudentPages={totalStudentPages}
            studentsPage={studentsPage}
            setStudentsPage={setStudentsPage}
            studentSearch={studentSearch}
            setStudentSearch={setStudentSearch}
            onToggleStudent={toggleStudent}
            studentsLoading={studentsLoading}
        />
    );
}
