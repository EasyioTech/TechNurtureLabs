'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    LayoutGrid, BookOpen, CreditCard, Users, BarChart3,
    Building2, Bell, Search, Sun, Moon, Filter, LogOut, Plus, Palette, Check,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useAdminData } from '../hooks/use-admin-data';
import { AdminThemeProvider, useAdminTheme, t, COLOR_SCHEMES, type ColorScheme } from '../theme-context';
import { MetricTables } from './metric-tables';
import { OverviewTab } from './tabs/overview-tab';
import { CourseBuilderTab } from './tabs/course-builder-tab';
import { PaymentPlansTab } from './tabs/payment-plans-tab';
import { SchoolsTab } from './tabs/schools-tab';
import { UserDialog } from './user-dialog';

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
    const { isDark, toggle, colorScheme, setColorScheme, accent } = useAdminTheme();
    const [showColorPicker, setShowColorPicker] = useState(false);
    const colorPickerRef = useRef<HTMLDivElement>(null);

    /* Close color picker on outside click */
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
                setShowColorPicker(false);
            }
        }
        if (showColorPicker) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showColorPicker]);
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
                        <LayoutGrid className={isDark ? accent.text : 'text-[#262626]'} size={24} />
                    </motion.div>
                    <p className={`text-xs font-bold tracking-[0.2em] uppercase ${t.textMuted(isDark)} animate-pulse`}>Loading Dashboard</p>
                </div>
            </div>
        );
    }

    const page = PAGE_TITLES[activePage] || PAGE_TITLES.overview;

    return (
        <div className={`min-h-screen ${t.pageBg(isDark)} transition-colors duration-500 font-sans`}>
            {/* ── Navigation ── */}
            <header className={`sticky top-0 z-50 ${t.headerBg(isDark)} backdrop-blur-md transition-all duration-300`}>
                <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo + Tabs */}
                        <div className="flex items-center gap-10">
                            <div className="flex items-center gap-3 group cursor-pointer">
                                <div className={`w-10 h-10 rounded-full ${accent.bg} flex items-center justify-center ring-4 ring-transparent transition-all flex-shrink-0`}>
                                    <LayoutGrid className='text-slate-900' size={18} />
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
                                                    className={`absolute inset-0 rounded-full ${accent.bg} text-slate-900 ${isDark ? '' : 'shadow-lg'}`}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                />
                                            )}
                                            <span className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-slate-900' : ''}`}>
                                                {item.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-4">
                            <div className={`hidden lg:flex items-center rounded-full px-5 py-2.5 gap-3 min-w-[280px] border transition-all duration-300 focus-within:ring-2 focus-within:ring-${accent.name}-400/30 focus-within:border-${accent.name}-400/30 ${t.border(isDark)} ${isDark ? 'bg-white/[0.04] focus-within:bg-white/[0.06]' : 'bg-white shadow-sm focus-within:shadow-md'}`}>
                                <Search size={16} className={`transition-colors ${isDark ? `text-slate-600` : 'text-neutral-400'}`} />
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
                                <button className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all relative border group ${t.border(isDark)} ${isDark ? `hover:bg-white/[0.06] hover:border-white/10` : 'hover:bg-neutral-50 hover:shadow-md'}`}>
                                    <Bell size={20} className={`transition-all group-hover:rotate-12 ${t.textSecondary(isDark)}`} />
                                    <span className={`absolute top-2.5 right-2.5 w-2 h-2 ${accent.bg} rounded-full ring-4 ${isDark ? 'ring-[#09090b]' : 'ring-white'}`} style={{ boxShadow: `0 0 10px ${isDark ? accent.swatchDark : accent.swatchLight}80` }} />
                                </button>

                                <button
                                    onClick={toggle}
                                    className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all border group ${t.border(isDark)} ${isDark ? `hover:bg-white/[0.06] text-slate-400 ${accent.text.replace('text-', 'hover:text-')} hover:border-white/10` : 'hover:bg-neutral-50 text-neutral-500 hover:text-amber-500 hover:shadow-md'}`}
                                >
                                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                                </button>

                                {/* ── Color Scheme Picker ── */}
                                <div className="relative" ref={colorPickerRef}>
                                    <button
                                        onClick={() => setShowColorPicker(v => !v)}
                                        className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all border group ${t.border(isDark)} ${isDark ? 'hover:bg-white/[0.06] hover:border-white/10' : 'hover:bg-neutral-50 hover:shadow-md'}`}
                                        title="Change accent color"
                                    >
                                        <Palette size={20} className={`transition-all ${showColorPicker ? (isDark ? accent.text : 'text-neutral-800') : t.textSecondary(isDark)} group-hover:rotate-12`} />
                                    </button>

                                    <AnimatePresence>
                                        {showColorPicker && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: 8 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                className={`absolute right-0 top-14 z-[100] min-w-[200px] rounded-2xl border p-3 backdrop-blur-xl shadow-2xl ${isDark ? 'bg-[#121214]/95 border-white/[0.08] shadow-black/40' : 'bg-white/95 border-neutral-200/60 shadow-black/10'}`}
                                            >
                                                <p className={`text-[10px] font-black tracking-[0.2em] uppercase mb-3 px-1 ${t.textMuted(isDark)}`}>ACCENT COLOR</p>
                                                <div className="grid grid-cols-1 gap-1">
                                                    {(Object.keys(COLOR_SCHEMES) as ColorScheme[]).map((key) => {
                                                        const scheme = COLOR_SCHEMES[key];
                                                        const isActive = colorScheme === key;
                                                        return (
                                                            <button
                                                                key={key}
                                                                onClick={() => { setColorScheme(key); setShowColorPicker(false); }}
                                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group/item
                                                                    ${isActive
                                                                        ? isDark ? 'bg-white/[0.08]' : 'bg-neutral-100'
                                                                        : isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-neutral-50'
                                                                    }`}
                                                            >
                                                                <div className="relative flex-shrink-0">
                                                                    <div
                                                                        className={`w-7 h-7 rounded-full transition-all ${isActive ? 'scale-110 ring-2 ring-offset-2' : 'group-hover/item:scale-105'}`}
                                                                        style={{
                                                                            background: isDark ? scheme.swatchDark : scheme.swatchLight,
                                                                            ['--tw-ring-color' as string]: isDark ? scheme.swatchDark : scheme.swatchLight,
                                                                            ['--tw-ring-offset-color' as string]: isDark ? '#121214' : '#ffffff',
                                                                        }}
                                                                    />
                                                                    {isActive && (
                                                                        <motion.div
                                                                            initial={{ scale: 0 }}
                                                                            animate={{ scale: 1 }}
                                                                            className="absolute inset-0 flex items-center justify-center"
                                                                        >
                                                                            <Check size={14} className="text-white drop-shadow-md" strokeWidth={3} />
                                                                        </motion.div>
                                                                    )}
                                                                </div>
                                                                <span className={`text-xs font-bold ${isActive ? t.textPrimary(isDark) : t.textSecondary(isDark)} transition-colors`}>
                                                                    {scheme.label}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <Avatar className={`w-11 h-11 cursor-pointer border-2 transition-all ${isDark ? `border-white/10 hover:border-opacity-50` : 'border-neutral-200/50 shadow-lg'}`} style={isDark ? { ['--hover-border' as string]: accent.swatchDark } : {}} onClick={() => signOut()}>
                                <AvatarFallback className={`text-xs font-[1000] ${isDark ? `${accent.bg} text-slate-900` : 'bg-[#171717] text-white'}`}>SA</AvatarFallback>
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
                                ${isDark ? '' : 'shadow-black/5'} ${t.btnPrimary(isDark, accent)}`}
                            style={isDark ? { boxShadow: `0 10px 25px -5px ${accent.swatchDark}33` } : {}}
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
                                } else if (activePage === 'users') {
                                    data.setEditingUserItem({ first_name: '', last_name: '', email: '', role: 'student', password: '' });
                                    data.setShowUserDialog(true);
                                }
                            }}>
                            <Plus size={20} strokeWidth={3} />
                            {activePage === 'courses' ? 'NEW COURSE' :
                                activePage === 'plans' ? 'UPDATE TIERS' :
                                    activePage === 'schools' ? 'ADD INSTITUTION' :
                                        activePage === 'users' ? 'NEW STUDENT' :
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
                                grades={data.grades}
                            />
                        )}
                        {activePage === 'users' && <MetricTables userMetrics={data.userMetrics} courseMetrics={[]} page={data.userMetricsPage} setPage={data.setUserMetricsPage} />}
                        {activePage === 'courseMetrics' && <MetricTables userMetrics={[]} courseMetrics={data.courseMetrics} />}
                    </motion.div>
                </AnimatePresence>

                <UserDialog
                    open={data.showUserDialog}
                    onOpenChange={data.setShowUserDialog}
                    editingUser={data.editingUserItem}
                    setEditingUser={data.setEditingUserItem}
                    onSave={data.saveStudent}
                    schools={data.schoolsList}
                    grades={data.grades}
                />
            </main>
        </div>
    );
}

export function SuperAdminDashboard() {
    return (
        <DashboardContent />
    );
}
