'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

import { StudentBottomNav } from './bottom-nav';
import { StudentHeader } from './header';

export function StudentLayoutShell({
    sidebar,
    children,
    profile,
    school,
    stats,
    settings
}: {
    sidebar: React.ReactNode;
    children: React.ReactNode;
    profile?: any;
    school?: any;
    stats?: any;
    settings?: any;
}) {
    const pathname = usePathname();
    const isLessonPage = pathname?.includes('/student/lesson/');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        // Initial state from localStorage
        const saved = localStorage.getItem('student-sidebar-collapsed');
        if (saved === 'true') setIsSidebarCollapsed(true);

        const handleToggle = (e: any) => {
            setIsSidebarCollapsed(e.detail);
        };
        window.addEventListener('sidebar-toggle', handleToggle);
        return () => window.removeEventListener('sidebar-toggle', handleToggle);
    }, []);

    return (
        <div className="flex min-h-screen bg-slate-50 overflow-x-hidden selection:bg-indigo-100">
            {!isLessonPage && sidebar}
            <div className={cn(
                "flex-1 flex flex-col min-w-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] pb-20 lg:pb-0",
                !isLessonPage 
                    ? (isSidebarCollapsed ? "lg:pl-24" : "lg:pl-64") 
                    : "w-full"
            )}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="flex-1 flex flex-col"
                    >
                        {!isLessonPage && (
                            <div className="lg:hidden">
                                <StudentHeader 
                                    profile={profile}
                                    school={school}
                                    stats={stats || { xp: 0, streak: 0, level: 1 }}
                                    settings={settings}
                                />
                            </div>
                        )}
                        {children}
                    </motion.div>
                </AnimatePresence>
            </div>
            {!isLessonPage && <StudentBottomNav />}
        </div>
    );
}
