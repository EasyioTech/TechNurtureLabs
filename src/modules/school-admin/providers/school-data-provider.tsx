'use client';

import React, { createContext, useContext, useState } from 'react';
import { useSchoolData as useSchoolDataHook } from '../hooks/use-school-data';

type SchoolData = ReturnType<typeof useSchoolDataHook> & {
    schoolId: string;
    isProfileModalOpen: boolean;
    setIsProfileModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const SchoolDataContext = createContext<SchoolData | null>(null);

export function SchoolDataProvider({ children, schoolId }: { children: React.ReactNode, schoolId: string }) {
    const data = useSchoolDataHook(schoolId);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    
    return (
        <SchoolDataContext.Provider value={{ 
            ...data, 
            schoolId,
            isProfileModalOpen, 
            setIsProfileModalOpen 
        }}>
            {children}
        </SchoolDataContext.Provider>
    );
}

export function useSchoolContext() {
    const ctx = useContext(SchoolDataContext);
    if (!ctx) throw new Error('useSchoolContext must be used within SchoolDataProvider');
    return ctx;
}
