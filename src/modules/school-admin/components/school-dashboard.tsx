'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SchoolThemeProvider, useSchoolTheme, ts } from '../theme-context';
import { useSchoolData } from '../hooks/use-school-data';
import { getSchoolProfile } from '../actions';
import { getPlatformSettings } from '@/components/landing/actions';
import { SchoolOverviewTab } from './tabs/school-overview-tab';
import { SchoolStudentsTab } from './tabs/school-students-tab';
import { SchoolCoursesTab } from './tabs/school-courses-tab';
import { SchoolReportsTab } from './tabs/school-reports-tab';
import { SchoolSettingsTab } from './tabs/school-settings-tab';
import { SchoolVerificationTab } from './tabs/school-verification-tab';
import { SchoolProfileModal } from './school-profile-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    LayoutDashboard, Users, BookOpen, BarChart2,
    Sun, Moon, LogOut, Building2, RefreshCw,
    MapPin, Phone, Mail, Menu, X, GraduationCap, Sparkles, Settings, ShieldCheck
} from 'lucide-react';

const NAV = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'verification', label: 'Verification', icon: ShieldCheck },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
];

type SchoolProfile = {
    id: string; name: string; email: string; slug: string; phone: string | null;
    city: string | null; state: string | null; address: string | null;
    logo_url: string | null; is_active: boolean;
} | null;

function DashboardInner({ schoolId, adminName, onSignOut }: {
    schoolId: string; adminName?: string; onSignOut?: () => void;
}) {
    const { isDark, toggle } = useSchoolTheme();
    const [activePage, setActivePage] = useState('overview');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [platformSettings, setPlatformSettings] = useState<any>(null);
    const data = useSchoolData(schoolId);

    useEffect(() => {
        if (!schoolId) return;
        getSchoolProfile(schoolId).then(p => {
            if (p) setSchoolProfile(p as any as SchoolProfile);
        });
    }, [schoolId]);

    useEffect(() => {
        getPlatformSettings().then(setPlatformSettings);
    }, []);

    const schoolName = schoolProfile?.name || adminName || 'My School';
    const location = [schoolProfile?.city, schoolProfile?.state].filter(Boolean).join(', ');

    const handleProfileUpdate = () => {
        getSchoolProfile(schoolId).then(p => {
            if (p) setSchoolProfile(p as any as SchoolProfile);
        });
    };

    if (data.loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${ts.pageBg(isDark)}`}>
                <div className="text-center space-y-5">
                    <div className="relative mx-auto w-20 h-20">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                            <GraduationCap size={36} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                        </div>
                        <div className="absolute inset-0 rounded-3xl border-2 border-indigo-500/30 animate-pulse" />
                    </div>
                    <div>
                        <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{schoolName}</p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Loading dashboard data…</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0c0f1a] dark' : 'bg-slate-50'}`}>

            {/* ─── Header ─── */}
            <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDark ? 'bg-[#0c0f1a]/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
                    <div className="flex items-center justify-between h-16 sm:h-24">
                        <div className="flex items-center gap-4 sm:gap-8">
                            {/* School Identity */}
                            <div className="flex items-center gap-4 flex-shrink-0 min-w-0">
                                {(schoolProfile?.logo_url || platformSettings?.logo_url) ? (
                                    <div className="flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        <img
                                            src={schoolProfile?.logo_url || platformSettings?.logo_url}
                                            alt={schoolName}
                                            className="object-contain"
                                            style={{ height: `${platformSettings?.logo_height || 40}px`, width: 'auto', maxHeight: '48px' }}
                                            onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                (e.currentTarget.parentElement?.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-600 shadow-indigo-600/20'}`}>
                                        <GraduationCap size={22} className={isDark ? 'text-indigo-400' : 'text-white'} strokeWidth={2.5} />
                                    </div>
                                )}
                                <div className="min-w-0 hidden sm:block">
                                    <p className={`text-[15px] font-black tracking-tight leading-none truncate ${ts.textPrimary(isDark)}`}>
                                        {schoolName}
                                    </p>
                                    <p className={`text-[10px] mt-1 font-bold tracking-wider uppercase opacity-60 ${ts.textSecondary(isDark)}`}>
                                        Dashboard
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Nav */}
                        <nav className="hidden lg:flex items-center gap-1 mx-4">
                            {NAV.map(item => {
                                const isActive = activePage === item.id;
                                return (
                                    <button key={item.id}
                                        onClick={() => setActivePage(item.id)}
                                        className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[13px] font-black transition-all duration-300 relative ${isActive
                                            ? ts.navActive(isDark)
                                            : ts.navInactive(isDark)
                                            }`}>
                                        <item.icon size={16} strokeWidth={isActive ? 3 : 2} />
                                        {item.label}
                                        {item.id === 'verification' && data.stats.pendingStudents > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-[#0c0f1a] animate-bounce">
                                                {data.stats.pendingStudents}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Right side */}
                        <div className="flex items-center gap-3 ml-auto">
                            <div className="flex items-center gap-2">
                                <button onClick={toggle} title="Toggle theme"
                                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isDark ? 'text-slate-500 hover:text-yellow-400 hover:bg-yellow-400/10' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}>
                                    {isDark ? <Sun size={17} /> : <Moon size={17} />}
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                {onSignOut && (
                                    <button 
                                        onClick={onSignOut} 
                                        title="Sign out"
                                        className={`flex items-center gap-2 h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isDark ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                                    >
                                        <LogOut size={14} strokeWidth={3} />
                                        <span className="hidden sm:inline">Sign Out</span>
                                    </button>
                                )}
                            </div>

                            {/* Mobile menu toggle */}
                            <button className="lg:hidden w-10 h-10 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/10"
                                onClick={() => setMobileMenuOpen(v => !v)}>
                                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Nav Drawer */}
                    <AnimatePresence>
                        {mobileMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="lg:hidden overflow-hidden pb-6">
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    {NAV.map(item => {
                                        const isActive = activePage === item.id;
                                        return (
                                            <button key={item.id}
                                                onClick={() => { setActivePage(item.id); setMobileMenuOpen(false); }}
                                                className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[13px] font-black transition-all ${isActive
                                                    ? ts.navActive(isDark)
                                                    : ts.navInactive(isDark)
                                                    }`}>
                                                <item.icon size={16} />
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* ── Institution Identity Banner ── */}
            <div className={`relative overflow-hidden border-b ${isDark ? 'bg-[#0f1219] border-white/[0.05]' : 'bg-white border-slate-200/60'}`}>
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
                
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10 lg:py-14 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8">
                        <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-4 sm:gap-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0">
                                {(schoolProfile?.logo_url || platformSettings?.logo_url) ? (
                                    <div className="relative w-full h-full">
                                        <img 
                                            src={schoolProfile?.logo_url || platformSettings?.logo_url} 
                                            alt={schoolName} 
                                            className="w-full h-full object-contain" 
                                            onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                                            }}
                                        />
                                        <div className="hidden w-full h-full rounded-2xl flex items-center justify-center shadow-2xl bg-indigo-50 dark:bg-indigo-500/10 border dark:border-indigo-500/20 shadow-indigo-100 dark:shadow-indigo-500/5">
                                            <GraduationCap size={32} className="text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`w-full h-full rounded-2xl flex items-center justify-center shadow-2xl ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20 shadow-indigo-500/5' : 'bg-indigo-50 shadow-indigo-100'}`}>
                                        <GraduationCap size={32} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-2">
                                    <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>
                                        {schoolName}
                                    </h1>
                                    {schoolProfile?.is_active && (
                                        <Badge className={`px-2.5 py-0.5 rounded-full border-0 text-[9px] font-black tracking-wider ${ts.live(isDark)}`}>
                                            <Sparkles size={10} className="mr-1" /> ACTIVE
                                        </Badge>
                                    )}
                                </div>
                                <div className={`flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-[12px] font-medium ${ts.textSecondary(isDark)}`}>
                                    {location && (
                                        <span className="flex items-center gap-1.5">
                                            <MapPin size={12} className="text-indigo-500" />
                                            {location}
                                        </span>
                                    )}
                                    {schoolProfile?.email && (
                                        <span className="flex items-center gap-1.5">
                                            <Mail size={12} className="text-indigo-500" />
                                            <span className="hidden xs:inline">{schoolProfile.email}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-row items-center justify-center sm:justify-end gap-3 w-full md:w-auto mt-2 md:mt-0">
                            <Badge className={`px-3 py-1.5 rounded-xl border-0 text-[10px] font-black tracking-wide ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                                ID: {schoolProfile?.slug?.toUpperCase() || 'N/A'}
                            </Badge>
                            <Button
                                onClick={() => setIsProfileModalOpen(true)}
                                className={`rounded-xl h-10 px-5 font-black text-[12px] ${ts.btnPrimary(isDark)}`}>
                                Edit Profile
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <SchoolProfileModal
                schoolId={schoolId}
                profile={schoolProfile}
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onUpdate={handleProfileUpdate}
            />

            {/* ─── Page content ─── */}
            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
                <AnimatePresence mode="wait">
                    <motion.div key={activePage}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>

                        {activePage === 'overview' && (
                            <SchoolOverviewTab stats={data.stats} leaderboard={data.leaderboard} courseMetrics={data.courseMetrics} />
                        )}
                        {activePage === 'students' && (
                            <SchoolStudentsTab
                                pagedStudents={data.pagedStudents}
                                totalStudentsCount={data.totalStudentsCount}
                                totalStudentPages={data.totalStudentPages}
                                studentsPage={data.studentsPage}
                                setStudentsPage={data.setStudentsPage}
                                studentSearch={data.studentSearch}
                                setStudentSearch={data.setStudentSearch}
                                onToggleStudent={data.toggleStudent}
                                studentsLoading={data.studentsLoading}
                            />
                        )}
                        {activePage === 'verification' && (
                            <SchoolVerificationTab 
                                pendingStudents={data.pendingStudents}
                                onVerify={data.verifyStudent}
                                loading={data.pendingLoading}
                            />
                        )}
                        {activePage === 'courses' && <SchoolCoursesTab courseMetrics={data.courseMetrics} schoolClasses={data.classesData} />}
                        {activePage === 'reports' && <SchoolReportsTab courseMetrics={data.courseMetrics} />}
                        {activePage === 'settings' && <SchoolSettingsTab stats={data.stats} schoolId={schoolId} classesData={data.classesData} globalClasses={data.globalClasses} onRefresh={data.refreshData} onOpenSchoolProfile={() => setIsProfileModalOpen(true)} />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}

export function SchoolDashboard({ schoolId, schoolName, onSignOut }: {
    schoolId: string; schoolName?: string; onSignOut?: () => void;
}) {
    return (
        <SchoolThemeProvider>
            <DashboardInner schoolId={schoolId} adminName={schoolName} onSignOut={onSignOut} />
        </SchoolThemeProvider>
    );
}
