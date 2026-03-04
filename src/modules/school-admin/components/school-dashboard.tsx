'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SchoolThemeProvider, useSchoolTheme, ts } from '../theme-context';
import { useSchoolData } from '../hooks/use-school-data';
import { SchoolOverviewTab } from './tabs/school-overview-tab';
import { SchoolStudentsTab } from './tabs/school-students-tab';
import { SchoolCoursesTab } from './tabs/school-courses-tab';
import { SchoolReportsTab } from './tabs/school-reports-tab';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Users, BookOpen, BarChart2, Sun, Moon, LogOut, Building2, RefreshCw } from 'lucide-react';

const NAV = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
];

function DashboardInner({ schoolId, schoolName, onSignOut }: { schoolId: string; schoolName?: string; onSignOut?: () => void }) {
    const { isDark, toggle } = useSchoolTheme();
    const [activePage, setActivePage] = useState('overview');
    const data = useSchoolData(schoolId);

    if (data.loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${ts.pageBg(isDark)}`}>
                <div className="text-center space-y-4">
                    <div className={`w-14 h-14 rounded-3xl mx-auto flex items-center justify-center ${isDark ? 'bg-lime-400/10' : 'bg-slate-100'} animate-pulse`}>
                        <Building2 size={24} className={isDark ? 'text-lime-400' : 'text-slate-500'} />
                    </div>
                    <p className={`text-[13px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Loading school data…</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-500 ${ts.pageBg(isDark)}`}>
            {/* Header */}
            <header className={`sticky top-0 z-50 ${ts.headerBg(isDark)}`}>
                <div className="max-w-[1400px] mx-auto px-6 py-3.5 flex items-center gap-6">
                    {/* Logo / Identity */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${isDark ? 'bg-lime-400 text-slate-900' : 'bg-slate-900 text-white'}`}>
                            <Building2 size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className={`text-[13px] font-[1000] tracking-tight leading-none ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>
                                {schoolName || 'School Admin'}
                            </p>
                            <p className={`text-[9px] font-black uppercase tracking-[0.15em] leading-none mt-0.5 ${isDark ? 'text-lime-400' : 'text-slate-500'}`}>Dashboard</p>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="hidden md:flex items-center gap-1 flex-1">
                        {NAV.map(item => {
                            const isActive = activePage === item.id;
                            return (
                                <button key={item.id} onClick={() => setActivePage(item.id)}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-[11px] font-black uppercase tracking-tight transition-all
                                        ${isActive
                                            ? isDark ? 'bg-lime-400 text-slate-900 shadow-lg shadow-lime-400/20' : 'bg-[#1a1a1a] text-white shadow-lg shadow-slate-900/20'
                                            : ts.navInactive(isDark)}`}>
                                    <item.icon size={13} strokeWidth={2.5} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Right controls */}
                    <div className="flex items-center gap-2 ml-auto">
                        {/* Stats summary pills */}
                        <div className="hidden lg:flex items-center gap-2">
                            <Badge className={`text-[9px] font-black px-2.5 py-1 rounded-full gap-1 ${isDark ? 'bg-lime-400/10 text-lime-400' : 'bg-slate-100 text-slate-700'}`}>
                                <Users size={9} />{data.stats.totalStudents} Students
                            </Badge>
                            <Badge className={`text-[9px] font-black px-2.5 py-1 rounded-full gap-1 ${isDark ? 'bg-sky-400/10 text-sky-400' : 'bg-sky-50 text-sky-700'}`}>
                                <BookOpen size={9} />{data.stats.enrolledCourses} Courses
                            </Badge>
                        </div>

                        <Button variant="ghost" size="icon" onClick={data.refreshData}
                            className={`w-9 h-9 rounded-full ${isDark ? 'hover:bg-white/10 text-slate-500 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'}`}>
                            <RefreshCw size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={toggle}
                            className={`w-9 h-9 rounded-full ${isDark ? 'hover:bg-white/10 text-slate-500 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'}`}>
                            {isDark ? <Sun size={15} /> : <Moon size={15} />}
                        </Button>
                        {onSignOut && (
                            <Button variant="ghost" size="icon" onClick={onSignOut}
                                className={`w-9 h-9 rounded-full ${isDark ? 'hover:bg-rose-500/10 text-slate-500 hover:text-rose-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-600'}`}>
                                <LogOut size={15} />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Mobile Nav */}
                <div className={`md:hidden flex gap-1 px-4 pb-3 overflow-x-auto`}>
                    {NAV.map(item => {
                        const isActive = activePage === item.id;
                        return (
                            <button key={item.id} onClick={() => setActivePage(item.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight whitespace-nowrap transition-all
                                    ${isActive ? (isDark ? 'bg-lime-400 text-slate-900' : 'bg-slate-900 text-white') : ts.navInactive(isDark)}`}>
                                <item.icon size={11} />{item.label}
                            </button>
                        );
                    })}
                </div>
            </header>

            {/* Page content */}
            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
                <AnimatePresence mode="wait">
                    <motion.div key={activePage}
                        initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}>

                        {activePage === 'overview' && (
                            <SchoolOverviewTab stats={data.stats} leaderboard={data.leaderboard} courseMetrics={data.courseMetrics} />
                        )}
                        {activePage === 'students' && (
                            <SchoolStudentsTab
                                students={data.students}
                                filteredStudents={data.filteredStudents}
                                pagedStudents={data.pagedStudents}
                                totalStudentPages={data.totalStudentPages}
                                studentsPage={data.studentsPage}
                                setStudentsPage={data.setStudentsPage}
                                studentSearch={data.studentSearch}
                                setStudentSearch={data.setStudentSearch}
                                onToggleStudent={data.toggleStudent}
                            />
                        )}
                        {activePage === 'courses' && <SchoolCoursesTab courseMetrics={data.courseMetrics} />}
                        {activePage === 'reports' && <SchoolReportsTab courseMetrics={data.courseMetrics} />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}

export function SchoolDashboard({ schoolId, schoolName, onSignOut }: { schoolId: string; schoolName?: string; onSignOut?: () => void }) {
    return (
        <SchoolThemeProvider>
            <DashboardInner schoolId={schoolId} schoolName={schoolName} onSignOut={onSignOut} />
        </SchoolThemeProvider>
    );
}
