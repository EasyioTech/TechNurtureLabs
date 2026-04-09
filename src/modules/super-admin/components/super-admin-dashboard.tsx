'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    LayoutGrid, BookOpen, CreditCard, Users, BarChart3,
    Building2, Bell, Search, Sun, Moon, Filter, LogOut, Plus, Palette, Check, Settings,
    Menu, X, Save, Library, Activity, Zap, GraduationCap, ChevronDown, Database
} from 'lucide-react';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/providers/auth-provider';
import { useAdminData } from '../hooks/use-admin-data';
import { AdminThemeProvider, useAdminTheme, t, COLOR_SCHEMES, type ColorScheme } from '../theme-context';
import { MetricTables } from './metric-tables';
import { OverviewTab } from './tabs/overview-tab';
import { CourseBuilderTab } from './tabs/course-builder-tab';
import { PaymentPlansTab } from './tabs/payment-plans-tab';
import { SchoolsTab } from './tabs/schools-tab';
import { SettingsTab, SettingsTabRef } from './tabs/settings-tab';
import { PromoCodesTab } from './tabs/promo-codes-tab';
import { SystemHealthTab } from './tabs/system-health-tab';
import { LibraryTab } from './tabs/library-tab';
import { CertificationsTab } from './tabs/certifications-tab';
import { BackupsTab } from './tabs/backups-tab';
import { GlobalLogo } from '@/modules/shared/components/global-logo';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

const NAV_ITEMS = [
    { id: 'overview', label: 'DASHBOARD', icon: LayoutGrid },
    { id: 'courses', label: 'COURSES', icon: BookOpen },
    { id: 'certifications', label: 'CERTS', icon: GraduationCap },
    { id: 'plans', label: 'PLANS', icon: CreditCard },
    { id: 'promo', label: 'PROMOS', icon: CreditCard },
    { id: 'schools', label: 'SCHOOLS', icon: Building2 },
    { id: 'library', label: 'LIBRARY', icon: Library },
    { id: 'users', label: 'STUDENTS', icon: Users },
    { id: 'settings', label: 'SETTINGS', icon: Settings, iconOnly: true },
];

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
    overview: { title: 'Platform Overview', subtitle: 'Monitor platform performance and system health.' },
    courses: { title: 'Course Management', subtitle: 'Create and manage courses and learning content.' },
    certifications: { title: 'Certifications', subtitle: 'Configure certificates and issue them to students who complete courses.' },
    plans: { title: 'Pricing Plans', subtitle: 'Manage subscription plans and pricing levels.' },
    promo: { title: 'Promo Codes', subtitle: 'Manage platform-wide discount codes.' },
    schools: { title: 'Schools & Partners', subtitle: 'View and manage all registered school accounts.' },
    users: { title: 'Student Management', subtitle: 'Track student progress and overall engagement.' },
    library: { title: 'Content Library', subtitle: 'Browse and reuse content across the platform.' },
    backups: { title: 'System Backups', subtitle: 'Manage school data backups, restoration, and retention policies.' },
    settings: { title: 'Platform Settings', subtitle: 'Manage global platform configuration and infrastructure health.' },
};

function DashboardContent() {
    const { signOut } = useAuth();
    const { isDark, toggle, colorScheme, setColorScheme, accent } = useAdminTheme();
    const [showColorPicker, setShowColorPicker] = useState(false);
    const colorPickerRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<SettingsTabRef | null>(null);

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

    const searchParams = useSearchParams();
    const router = useRouter();
    const [activePage, setActivePage] = useState(searchParams.get('tab') || 'overview');
    const [searchQuery, setSearchQuery] = useState('');

    // Sync activePage with URL
    useEffect(() => {
        const currentTab = searchParams.get('tab');
        if (activePage !== currentTab) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('tab', activePage);
            router.replace(`?${params.toString()}`, { scroll: false });
        }
    }, [activePage, router, searchParams]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Push a history entry when the mobile menu opens so the device back button
    // closes the drawer instead of navigating away from the dashboard.
    useEffect(() => {
        if (mobileMenuOpen) {
            history.pushState({ mobileMenu: true }, '');
        }
    }, [mobileMenuOpen]);

    useEffect(() => {
        const onPopState = (e: PopStateEvent) => {
            if (mobileMenuOpen) {
                e.preventDefault?.();
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, [mobileMenuOpen]);

    const data = useAdminData();

    // Tracks which tabs have had their initial data load — prevents redundant
    // fetches when the user navigates back to an already-loaded tab.
    const initializedTabs = useRef<Set<string>>(new Set());

    // Effect 1: tabs that need live data on every page-change or search update
    // Also auto-sync metrics when Overview tab loads
    const lastSearch = useRef(searchQuery);
    useEffect(() => {
        if (activePage === 'overview') {
            data.syncMetrics();
            data.loadSchools(0, searchQuery);
        } else if (activePage === 'users') {
            data.loadStudents(data.userMetricsPage, searchQuery);
        } else if (activePage === 'schools') {
            // Reset and reload if search changed
            if (searchQuery !== lastSearch.current) {
                lastSearch.current = searchQuery;
                data.loadSchools(0, searchQuery);
            } else if (data.schoolsList.length === 0) {
                data.loadSchools(0, searchQuery);
            }
        } else if (activePage === 'library') {
            data.loadGlobalLessons(data.globalLessonsPage, searchQuery);
            data.loadGlobalQuizzes(data.globalQuizzesPage, searchQuery);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePage, data.userMetricsPage, searchQuery]);

    // Effect 2: tabs that only need a single initial load (pagination handled inside the tab)
    useEffect(() => {
        if (activePage === 'courses' && !initializedTabs.current.has('courses')) {
            initializedTabs.current.add('courses');
            data.loadCourses(0);
        }
        if (activePage === 'certifications' && !initializedTabs.current.has('certifications')) {
            initializedTabs.current.add('certifications');
            data.loadCertCourses();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePage]);

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
        <div className={`min-h-screen ${t.pageBg(isDark)} transition-colors duration-500 font-sans pb-20`}>
            {/* ── Navigation ── */}
            <header className={`sticky top-0 z-50 ${t.headerBg(isDark)} backdrop-blur-md transition-all duration-300 border-b ${t.border(isDark)}`}>
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
                    <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
                        {/* Left: Logo */}
                        <div className="flex items-center gap-3 group cursor-pointer flex-shrink-0 z-10" onClick={() => setActivePage('overview')}>
                            <GlobalLogo 
                                settings={data.platformSettings} 
                                size="auto"
                                isDark={isDark}
                            />
                        </div>

                        {/* Center: Desktop Nav - Hidden on mobile, visible from medium screens */}
                        <div className="hidden lg:flex flex-1 items-center justify-center min-w-0">
                            <nav className={`flex items-center ${isDark ? 'bg-neutral-900/60' : 'bg-neutral-100/80'} rounded-full p-1 border ${t.border(isDark)} shadow-inner overflow-auto no-scrollbar max-w-full`}>
                                <div className="flex items-center overflow-x-auto no-scrollbar scroll-smooth px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                    {NAV_ITEMS.map(item => {
                                         const isActive = activePage === item.id;
                                         return (
                                             <button
                                                 key={item.id}
                                                 id={`nav-item-${item.id}`}
                                                 onClick={() => {
                                                     setActivePage(item.id);
                                                     document.getElementById(`nav-item-${item.id}`)?.scrollIntoView({
                                                         behavior: 'smooth',
                                                         block: 'nearest',
                                                         inline: 'center'
                                                     });
                                                 }}
                                                 className={`relative px-4 py-2.5 sm:px-5 rounded-full text-[11px] font-black uppercase tracking-widest cursor-pointer transition-all duration-300 whitespace-nowrap flex-shrink-0
                                                     ${isActive ? '' : t.navInactive(isDark)} hover:opacity-80`}
                                             >
                                                 {isActive && (
                                                     <motion.div
                                                         layoutId="nav-pill-active"
                                                         className={`absolute inset-0 rounded-full ${accent.bg} text-slate-900 shadow-xl shadow-black/10`}
                                                         transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                                     />
                                                 )}
                                                 <span className={`relative z-10 transition-colors duration-300 flex items-center justify-center gap-2 ${isActive ? 'text-slate-900' : ''}`}>
                                                     {item.iconOnly ? (
                                                         <item.icon size={16} strokeWidth={3} />
                                                     ) : (
                                                         <>
                                                             {isActive && <item.icon size={14} strokeWidth={3} className="hidden xl:block" />}
                                                             {item.label}
                                                         </>
                                                     )}
                                                 </span>
                                             </button>
                                         );
                                     })}
                                 </div>
                            </nav>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 justify-end z-10">
                            
                            {/* Theme & Accent Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button 
                                        title="Theme Settings"
                                        className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all border outline-none ${t.border(isDark)} ${isDark ? 'hover:bg-white/[0.06] hover:border-white/10 bg-white/[0.02] text-amber-400' : 'hover:bg-neutral-50 hover:shadow-md bg-neutral-100/50 text-amber-600'}`}
                                    >
                                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className={`w-56 p-2 rounded-2xl border shadow-2xl ${t.card(isDark)} ${t.border(isDark)}`}>
                                    <DropdownMenuLabel className={`text-[10px] uppercase tracking-widest font-black mb-1 opacity-50 ${t.textPrimary(isDark)}`}>
                                        Appearance
                                    </DropdownMenuLabel>
                                    
                                    <DropdownMenuItem 
                                        onClick={toggle}
                                        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-neutral-100'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-400/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                                            {isDark ? <Sun size={16} /> : <Moon size={16} />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-bold ${t.textPrimary(isDark)}`}>
                                                {isDark ? 'Light Mode' : 'Dark Mode'}
                                            </span>
                                            <span className={`text-[10px] ${t.textMuted(isDark)}`}>
                                                Switch to {isDark ? 'light' : 'dark'} mode
                                            </span>
                                        </div>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className={`my-2 opacity-50 ${isDark ? 'bg-white/10' : 'bg-neutral-200'}`} />

                                    <DropdownMenuLabel className={`text-[10px] uppercase tracking-widest font-black mb-1 opacity-50 ${t.textPrimary(isDark)}`}>
                                        Accent Color
                                    </DropdownMenuLabel>

                                    <div className="grid grid-cols-2 gap-1 px-1">
                                        {(Object.keys(COLOR_SCHEMES) as ColorScheme[]).map((key) => {
                                            const palette = COLOR_SCHEMES[key];
                                            const isActive = colorScheme === key;
                                            return (
                                                <DropdownMenuItem
                                                    key={key}
                                                    onClick={() => setColorScheme(key)}
                                                    className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-all ${isActive ? (isDark ? 'bg-white/10' : 'bg-neutral-100') : 'hover:opacity-80'}`}
                                                >
                                                    <div 
                                                        className="w-4 h-4 rounded-full border border-black/10 flex items-center justify-center shrink-0"
                                                        style={{ backgroundColor: isDark ? palette.swatchDark : palette.swatchLight }}
                                                    >
                                                        {isActive && <Check size={10} className="text-white drop-shadow-sm" strokeWidth={4} />}
                                                    </div>
                                                    <span className={`text-[11px] font-medium ${t.textPrimary(isDark)}`}>
                                                        {palette.label}
                                                    </span>
                                                </DropdownMenuItem>
                                            );
                                        })}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Backups Shortcut */}
                            <button
                                onClick={() => setActivePage('backups')}
                                title="Data Backups"
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border shadow-lg ${t.border(isDark)} ${activePage === 'backups' ? accent.bg + ' text-slate-900 border-transparent shadow-' + accent.name + '-500/20' : (isDark ? 'bg-white/[0.05] hover:bg-white/[0.1] text-indigo-400' : 'bg-white hover:bg-neutral-50 text-indigo-600')}`}
                            >
                                <Database size={18} strokeWidth={3} />
                            </button>

                            {/* Sign Out Button */}
                            <button 
                                onClick={() => signOut()}
                                title="Sign Out"
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border shadow-lg ${t.border(isDark)} ${isDark ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20' : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 shadow-rose-900/5'}`}
                            >
                                <LogOut size={16} strokeWidth={3} />
                            </button>

                            <button
                                className={`md:hidden w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all border shadow-lg ${t.border(isDark)} ${isDark ? 'bg-white/[0.05] hover:bg-white/[0.1] text-white' : 'bg-white hover:bg-neutral-50 text-slate-900'}`}
                                onClick={() => setMobileMenuOpen(v => !v)}
                                aria-label="Toggle Mobile Menu"
                            >
                                {mobileMenuOpen ? <X size={20} strokeWidth={3} /> : <Menu size={20} strokeWidth={3} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Nav Drawer */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden overflow-hidden bg-inherit border-t border-white/[0.05]"
                        >
                            <div className="max-w-[1440px] mx-auto px-4 py-4 grid grid-cols-2 min-[480px]:grid-cols-3 gap-2">
                                {NAV_ITEMS.map(item => {
                                    const isActive = activePage === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => { setActivePage(item.id); setMobileMenuOpen(false); }}
                                            className={`flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-[1.5rem] text-[10px] font-black tracking-widest transition-all border
                                                    ${isActive
                                                    ? `${accent.bg} text-slate-900 border-transparent shadow-lg shadow-${accent.name}-500/20`
                                                    : `${isDark ? 'bg-white/[0.03] border-white/[0.05]' : 'bg-neutral-50 border-neutral-200'} ${t.navInactive(isDark)}`}`}
                                        >
                                            <item.icon size={20} strokeWidth={isActive ? 3 : 2} />
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Spacer for sticky header */}
            <div className="h-4 sm:h-8" />

            {/* ── Content ── */}
            <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 sm:mb-12">
                    <div className="max-w-2xl">
                        <motion.h1
                            key={`t-${activePage}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`text-2xl sm:text-3xl lg:text-4xl font-[1000] tracking-tighter uppercase ${t.textPrimary(isDark)}`}
                        >
                            {page.title}
                        </motion.h1>
                        <motion.p
                            key={`s-${activePage}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className={`text-[10px] sm:text-[12px] mt-3 font-black uppercase tracking-[0.22em] ${t.textMuted(isDark)} leading-relaxed`}
                        >
                            {page.subtitle}
                        </motion.p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {activePage === 'plans' && (
                            <Button size="sm"
                                className={`rounded-full gap-2 sm:gap-2.5 h-10 sm:h-12 px-4 sm:px-7 text-[10px] sm:text-sm font-black shadow-xl transition-all
                                    ${isDark ? '' : 'shadow-black/5'} ${t.btnPrimary(isDark, accent)}`}
                                style={isDark ? t.glowStyle(isDark, accent) : {}}
                                onClick={() => {
                                    data.setEditingPlan({ billing_cycle: 'monthly', features: [], is_active: true, trial_days: 0 });
                                    data.setShowPlanDialog(true);
                                }}>
                                <Plus size={20} strokeWidth={3} />UPDATE TIERS
                            </Button>
                        )}
                        {activePage === 'promo' && (
                            <Button size="sm"
                                className={`rounded-full gap-2 sm:gap-2.5 h-10 sm:h-12 px-4 sm:px-7 text-[10px] sm:text-sm font-black shadow-xl transition-all
                                    ${isDark ? '' : 'shadow-black/5'} ${t.btnPrimary(isDark, accent)}`}
                                style={isDark ? t.glowStyle(isDark, accent) : {}}
                                onClick={() => {
                                    data.setEditingPromoCode({ discount_type: 'percentage', is_active: true, max_uses: null, current_uses: 0 });
                                    data.setShowPromoCodeDialog(true);
                                }}>
                                <Plus size={20} strokeWidth={3} />ADD CODE
                            </Button>
                        )}
                        {activePage === 'settings' && (
                            <Button size="sm"
                                className={`rounded-full gap-2 sm:gap-2.5 h-10 sm:h-12 px-4 sm:px-7 text-[10px] sm:text-sm font-black shadow-xl transition-all
                                    ${isDark ? '' : 'shadow-black/5'} ${t.btnPrimary(isDark, accent)}`}
                                style={isDark ? t.glowStyle(isDark, accent) : {}}
                                onClick={() => settingsRef.current?.handleSave()}>
                                <Save size={20} strokeWidth={3} />SAVE SETTINGS
                            </Button>
                        )}
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
                        {activePage === 'overview' && <OverviewTab stats={data.stats} paymentPlans={data.paymentPlans} schoolsList={data.schoolsList} platformMetrics={data.platformMetrics} loginHeatmap={data.loginHeatmap} onSync={data.syncMetrics} />}
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
                                classes={data.classes}
                                courseClassMappings={data.courseClassMappings}
                            />
                        )}
                        {activePage === 'certifications' && (
                            <CertificationsTab
                                courses={data.certCourses}
                                loading={data.certLoading}
                                onRefresh={data.loadCertCourses}
                                onSaveCert={data.saveCert}
                                onDeleteCert={data.deleteCert}
                                onFetchStudents={data.getCompletedStudents}
                                onIssueCert={data.issueCert}
                                onRevokeCert={data.revokeCert}
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
                        {activePage === 'promo' && (
                            <PromoCodesTab
                                promoCodes={data.promoCodes} onSavePromoCode={data.savePromoCode}
                                onDeletePromoCode={data.deletePromoCode} showDialog={data.showPromoCodeDialog}
                                setShowDialog={data.setShowPromoCodeDialog} editingCode={data.editingPromoCode}
                                setEditingCode={data.setEditingPromoCode}
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
                                editingSchool={data.editingSchoolItem}
                                setEditingSchool={data.setEditingSchoolItem}
                                searchQuery={searchQuery}
                                classes={data.classes}
                                onSync={data.syncMetrics}
                                page={data.schoolsPage}
                                setPage={data.setSchoolsPage}
                                totalPages={data.totalSchoolsPages}
                                hasMore={data.hasMoreSchools}
                                loadingMore={data.schoolsLoading}
                                onLoadMore={() => data.loadSchools(data.schoolsPage + 1, searchQuery, true)}
                            />
                        )}
                        {activePage === 'users' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className={`rounded-2xl border p-5 flex items-center gap-4 transition-all duration-300 shadow-sm shadow-black/5 ${t.card(isDark)}`}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${isDark ? 'bg-sky-400/10 text-sky-400 border-sky-400/20' : 'bg-sky-50 text-sky-600 border-sky-100'}`}><Users size={20} /></div>
                                        <div>
                                            <p className={`text-2xl font-black tracking-tighter ${t.textPrimary(isDark)}`}>{(data.stats.totalStudents || 0).toLocaleString()}</p>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Total Students</p>
                                        </div>
                                    </div>
                                    <div className={`rounded-2xl border p-5 flex items-center gap-4 transition-all duration-300 shadow-sm shadow-black/5 ${t.card(isDark)}`}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${isDark ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}><Activity size={20} /></div>
                                        <div>
                                            <p className={`text-2xl font-black tracking-tighter ${t.textPrimary(isDark)}`}>{(data.stats.activeStudents || 0).toLocaleString()}</p>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Active (30d)</p>
                                        </div>
                                    </div>
                                    <div className={`rounded-2xl border p-5 flex items-center gap-4 transition-all duration-300 shadow-sm shadow-black/5 ${t.card(isDark)}`}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${isDark ? 'bg-violet-400/10 text-violet-400 border-violet-400/20' : 'bg-violet-50 text-violet-600 border-violet-100'}`}><Zap size={20} /></div>
                                        <div>
                                            <p className={`text-2xl font-black tracking-tighter ${t.textPrimary(isDark)}`}>{(data.stats.totalXp || 0).toLocaleString()}</p>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Total XP Earned</p>
                                        </div>
                                    </div>
                                    <div className={`rounded-2xl border p-5 flex items-center gap-4 transition-all duration-300 shadow-sm shadow-black/5 ${t.card(isDark)}`}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${isDark ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' : 'bg-amber-50 text-amber-600 border-amber-100'}`}><GraduationCap size={20} /></div>
                                        <div>
                                            <p className={`text-2xl font-black tracking-tighter ${t.textPrimary(isDark)}`}>{(data.stats.avgCompletion || 0)}%</p>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Avg Completion</p>
                                        </div>
                                    </div>
                                </div>
                                <MetricTables 
                                    userMetrics={data.userMetrics} 
                                    page={data.userMetricsPage} 
                                    setPage={data.setUserMetricsPage} 
                                    totalPages={data.totalStudentPages}
                                />
                            </div>
                        )}
                        
                        { activePage === 'library' && (
                            <LibraryTab 
                                lessons={data.globalLessons} 
                                quizzes={data.globalQuizzes} 
                                loading={data.globalLoading}
                                courses={data.courses}
                                onCloneLesson={data.cloneLesson}
                                onCloneQuiz={data.cloneQuiz}
                                lessonsPage={data.globalLessonsPage}
                                onLessonsPageChange={data.loadGlobalLessons}
                                totalLessonsPages={data.totalGlobalLessonsPages}
                                quizzesPage={data.globalQuizzesPage}
                                onQuizzesPageChange={data.loadGlobalQuizzes}
                                totalQuizzesPages={data.totalGlobalQuizzesPages}
                            />
                        )}
                        { activePage === 'backups' && (
                            <BackupsTab 
                                schoolsList={data.schoolsList}
                            />
                        )}
                        { activePage === 'settings' && <SettingsTab ref={settingsRef} schoolsList={data.schoolsList} onTabChange={setActivePage} />}
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
