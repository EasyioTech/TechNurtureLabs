'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    LayoutGrid, BookOpen, CreditCard, Users, BarChart3,
    Building2, Bell, Search, Sun, Moon, Filter, LogOut, Plus,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useAdminData } from '../hooks/use-admin-data';
import { AdminThemeProvider, useAdminTheme, t } from '../theme-context';
import { MetricTables } from './metric-tables';
import { OverviewTab } from './tabs/overview-tab';
import { CourseBuilderTab } from './tabs/course-builder-tab';
import { PaymentPlansTab } from './tabs/payment-plans-tab';
import { SchoolsTab } from './tabs/schools-tab';

const NAV_ITEMS = [
    { id: 'overview', label: 'DASHBOARD' },
    { id: 'courses', label: 'COURSES' },
    { id: 'plans', label: 'PLANS' },
    { id: 'schools', label: 'SCHOOLS' },
    { id: 'users', label: 'STUDENTS' },
    { id: 'courseMetrics', label: 'REPORTS' },
];

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
    overview: { title: 'Platform Overview', subtitle: 'Monitor platform performance and system health.' },
    courses: { title: 'Course Management', subtitle: 'Create and manage courses and learning content.' },
    plans: { title: 'Pricing Plans', subtitle: 'Manage subscription plans and pricing levels.' },
    schools: { title: 'Schools & Partners', subtitle: 'View and manage all registered school accounts.' },
    users: { title: 'Student Management', subtitle: 'Track student progress and overall engagement.' },
    courseMetrics: { title: 'Performance Reports', subtitle: 'Analyze course effectiveness and student success.' },
};

function DashboardContent() {
    const { signOut } = useAuth();
    const { isDark, toggle } = useAdminTheme();
    const [activePage, setActivePage] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const data = useAdminData();

    if (data.loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${t.pageBg(isDark)}`}>
                <div className="flex flex-col items-center gap-6">
                    <motion.div
                        className={`w-16 h-16 rounded-3xl ${isDark ? 'bg-white/[0.04]' : 'bg-neutral-100'} flex items-center justify-center border ${t.border(isDark)}`}
                        animate={{ rotate: [0, 90, 180, 270, 360] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    >
                        <LayoutGrid className={isDark ? 'text-lime-400' : 'text-[#262626]'} size={24} />
                    </motion.div>
                    <p className={`text-xs font-bold tracking-[0.2em] uppercase ${t.textMuted(isDark)} animate-pulse`}>Loading Dashboard</p>
                </div>
            </div>
        );
    }

    const page = PAGE_TITLES[activePage] || PAGE_TITLES.overview;

    return (
        <div className={`min-h-screen ${t.pageBg(isDark)} transition-colors duration-500 font-sans selection:bg-lime-400 selection:text-slate-900`}>
            {/* ── Navigation ── */}
            <header className={`sticky top-0 z-50 ${t.headerBg(isDark)} backdrop-blur-md transition-all duration-300`}>
                <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo + Tabs */}
                        <div className="flex items-center gap-10">
                            <div className="flex items-center gap-3 group cursor-pointer">
                                <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-lime-400' : 'bg-[#262626]'} flex items-center justify-center ring-4 ring-transparent group-hover:ring-lime-400/20 transition-all flex-shrink-0`}>
                                    <LayoutGrid className={isDark ? 'text-slate-900' : 'text-white'} size={18} />
                                </div>
                                <span className={`text-xl font-black tracking-tighter ${t.textPrimary(isDark)} whitespace-nowrap`}>TechNurture Labs</span>
                            </div>

                            <nav className={`hidden md:flex items-center ${isDark ? 'bg-neutral-900/50' : 'bg-neutral-100/80'} rounded-full p-1.5`}>
                                {NAV_ITEMS.map(item => {
                                    const isActive = activePage === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActivePage(item.id)}
                                            className={`relative px-5 py-2.5 rounded-full text-[11px] font-bold tracking-wider cursor-pointer transition-all duration-300
                                                ${isActive ? '' : t.navInactive(isDark)}`}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="nav-pill-active"
                                                    className={`absolute inset-0 rounded-full ${isDark ? 'bg-lime-400 text-slate-900' : 'bg-[#262626] text-white shadow-lg'}`}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                />
                                            )}
                                            <span className={`relative z-10 transition-colors duration-300 ${isActive ? (isDark ? 'text-slate-900' : 'text-white') : ''}`}>
                                                {item.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-4">
                            <div className={`hidden lg:flex items-center rounded-full px-5 py-2.5 gap-3 min-w-[280px] border transition-all duration-300 focus-within:ring-2 focus-within:ring-lime-400/30 focus-within:border-lime-400/30 ${t.border(isDark)} ${isDark ? 'bg-white/[0.04] focus-within:bg-white/[0.06]' : 'bg-white shadow-sm focus-within:shadow-md'}`}>
                                <Search size={16} className={`transition-colors ${isDark ? 'text-slate-600 group-focus-within:text-lime-400' : 'text-neutral-400'}`} />
                                <input
                                    type="text"
                                    placeholder="Search dashboard..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className={`bg-transparent text-[13px] font-black outline-none flex-1 placeholder:font-bold ${t.textPrimary(isDark)}`}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${isDark ? 'border-white/10 text-slate-600 hover:text-white' : 'border-neutral-200 text-neutral-400 hover:text-slate-900'}`}>✕</button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all relative border group ${t.border(isDark)} ${isDark ? 'hover:bg-white/[0.06] hover:border-lime-400/20' : 'hover:bg-neutral-50 hover:shadow-md'}`}>
                                    <Bell size={20} className={`transition-all group-hover:rotate-12 ${t.textSecondary(isDark)}`} />
                                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-lime-400 rounded-full ring-4 ring-white dark:ring-[#0f1219] shadow-[0_0_10px_rgba(163,230,53,0.6)]" />
                                </button>

                                <button
                                    onClick={toggle}
                                    className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all border group ${t.border(isDark)} ${isDark ? 'hover:bg-white/[0.06] text-slate-400 hover:text-lime-400 hover:border-lime-400/20' : 'hover:bg-neutral-50 text-neutral-500 hover:text-amber-500 hover:shadow-md'}`}
                                >
                                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                                </button>
                            </div>

                            <Avatar className={`w-11 h-11 cursor-pointer border-2 transition-all ${isDark ? 'border-white/10 hover:border-lime-400/50' : 'border-neutral-200/50 shadow-lg'}`} onClick={() => signOut()}>
                                <AvatarFallback className={`text-xs font-[1000] ${isDark ? 'bg-lime-400 text-slate-900' : 'bg-[#171717] text-white'}`}>SA</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Content ── */}
            <main className="max-w-[1440px] mx-auto px-6 lg:px-10 py-10">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
                    <div>
                        <motion.h1
                            key={`t-${activePage}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`text-4xl lg:text-5xl font-[900] tracking-tighter ${t.textPrimary(isDark)}`}
                        >
                            {page.title}
                        </motion.h1>
                        <motion.p
                            key={`s-${activePage}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className={`text-[12px] mt-2.5 font-black uppercase tracking-[0.22em] ${t.textMuted(isDark)}`}
                        >
                            {page.subtitle}
                        </motion.p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="lg"
                            className={`rounded-full gap-2.5 h-12 px-7 text-sm font-bold border-2 transition-all ${t.btnOutline(isDark)}`}>
                            <Filter size={16} />Filter View
                        </Button>
                        <Button size="lg"
                            className={`rounded-full gap-2.5 h-12 px-7 text-sm font-black shadow-xl transition-all
                                ${isDark ? 'shadow-lime-400/20' : 'shadow-black/5'} ${t.btnPrimary(isDark)}`}
                            onClick={() => {
                                if (activePage === 'courses') {
                                    data.setEditingCourse({ published: false });
                                    data.setShowCourseDialog(true);
                                } else if (activePage === 'plans') {
                                    data.setEditingPlan({ billing_cycle: 'monthly', features: [], is_active: true, trial_days: 0 });
                                    data.setShowPlanDialog(true);
                                } else if (activePage === 'schools') {
                                    data.setEditingSchoolItem({ name: '', email: '', is_active: true, data_processing_consent: true, minor_data_guardian_consent: true });
                                    data.setShowSchoolDialog(true);
                                }
                            }}>
                            <Plus size={20} strokeWidth={3} />
                            {activePage === 'courses' ? 'NEW COURSE' :
                                activePage === 'plans' ? 'UPDATE TIERS' :
                                    activePage === 'schools' ? 'ADD INSTITUTION' :
                                        'QUICK ACTION'}
                        </Button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activePage}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: 'circOut' }}
                    >
                        {activePage === 'overview' && <OverviewTab stats={data.stats} paymentPlans={data.paymentPlans} schoolsList={data.schoolsList} />}
                        {activePage === 'courses' && (
                            <CourseBuilderTab
                                courses={data.courses} selectedCourse={data.selectedCourse}
                                lessons={data.lessons} setLessons={data.setLessons}
                                onSelectCourse={data.selectCourse} onSaveCourse={data.saveCourse}
                                onDeleteCourse={data.deleteCourse} onSaveLesson={data.saveLesson}
                                onDeleteLesson={data.deleteLesson} onSaveLessonOrder={data.saveLessonOrder}
                                showCourseDialog={data.showCourseDialog} setShowCourseDialog={data.setShowCourseDialog}
                                editingCourse={data.editingCourse} setEditingCourse={data.setEditingCourse}
                                showLessonDialog={data.showLessonDialog} setShowLessonDialog={data.setShowLessonDialog}
                                editingLesson={data.editingLesson} setEditingLesson={data.setEditingLesson}
                                grades={data.grades}
                                courseGradeMappings={data.courseGradeMappings}
                            />
                        )}
                        {activePage === 'plans' && (
                            <PaymentPlansTab
                                paymentPlans={data.paymentPlans} onSavePlan={data.savePlan}
                                onDeletePlan={data.deletePlan} showPlanDialog={data.showPlanDialog}
                                setShowPlanDialog={data.setShowPlanDialog} editingPlan={data.editingPlan}
                                setEditingPlan={data.setEditingPlan}
                            />
                        )}
                        {activePage === 'schools' && (
                            <SchoolsTab
                                stats={data.stats}
                                schoolsList={data.schoolsList}
                                paymentPlans={data.paymentPlans}
                                onToggleStatus={data.toggleSchoolStatus}
                                onSaveSchool={data.saveSchool}
                                onAssignPlan={data.assignPlan}
                                showEditDialog={data.showSchoolDialog}
                                setShowEditDialog={data.setShowSchoolDialog}
                                editingSchool={data.editingSchoolItem as any}
                                setEditingSchool={data.setEditingSchoolItem as any}
                                searchQuery={searchQuery}
                            />
                        )}
                        {activePage === 'users' && <MetricTables userMetrics={data.userMetrics} courseMetrics={[]} page={data.userMetricsPage} setPage={data.setUserMetricsPage} />}
                        {activePage === 'courseMetrics' && <MetricTables userMetrics={[]} courseMetrics={data.courseMetrics} />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}

export function SuperAdminDashboard() {
    return (
        <AdminThemeProvider>
            <DashboardContent />
        </AdminThemeProvider>
    );
}
