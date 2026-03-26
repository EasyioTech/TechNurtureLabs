'use client';

import React, { useState, useEffect, memo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Users, BookOpen, BarChart2,
    Settings, ShieldCheck, GraduationCap, Menu, X,
    LogOut, Sun, Moon, Bell, Search,
    ChevronRight, ChevronLeft
} from 'lucide-react';
import { useSchoolTheme, ts } from '../theme-context';
import { useSchoolContext } from '../providers/school-data-provider';
import { getSchoolProfile } from '../actions';
import { getPlatformSettings } from '@/components/landing/actions';
import { Badge } from '@/components/ui/badge';
import { SchoolProfileModal } from './school-profile-modal';
import { useAuth } from '@/components/providers/auth-provider';

const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/school-admin' },
    { id: 'students', label: 'Students', icon: Users, href: '/school-admin/students' },
    { id: 'verification', label: 'Verification', icon: ShieldCheck, href: '/school-admin/verification' },
    { id: 'courses', label: 'Courses', icon: BookOpen, href: '/school-admin/courses' },
    { id: 'reports', label: 'Reports', icon: BarChart2, href: '/school-admin/reports' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/school-admin/settings' },
];

// ─── NavLink is defined OUTSIDE the layout component so React never sees a new
// component type on re-render, which would cause unnecessary unmount/remount.
interface NavLinkProps {
    item: typeof NAV_ITEMS[0];
    isMobile?: boolean;
    isSidebarOpen: boolean;
    isActive: boolean;
    isDark: boolean;
    pendingCount: number;
}

const NavLink = memo(function NavLink({ item, isMobile = false, isSidebarOpen, isActive, isDark, pendingCount }: NavLinkProps) {
    const Icon = item.icon;
    const showLabel = isSidebarOpen || isMobile;

    return (
        <Link
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`group flex items-center transition-all duration-300 relative rounded-2xl h-12 mb-1 ${
                showLabel ? 'px-4 gap-3 w-full' : 'px-0 justify-center w-12 mx-auto'
            } ${
                isActive
                    ? ts.navActive(isDark)
                    : ts.navInactive(isDark)
            }`}
        >
            <div className={`flex items-center justify-center transition-colors flex-shrink-0 ${isActive ? 'text-indigo-500' : 'group-hover:text-indigo-400'}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            {showLabel && (
                <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="whitespace-nowrap font-black tracking-tight text-[13px] uppercase"
                >
                    {item.label}
                </motion.span>
            )}

            {item.id === 'verification' && pendingCount > 0 && (
                <span className={`absolute ${showLabel ? 'right-4' : 'right-0 top-0'} w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-[#0f1115] shadow-sm animate-pulse`} />
            )}

            {isActive && !showLabel && (
                <motion.div layoutId="activeNavCollapsed" className="absolute -left-3 w-1.5 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(79,70,229,0.4)]" />
            )}

            {isActive && showLabel && (
                <motion.div layoutId="activeNavExpanded" className="absolute left-[-4px] w-1.5 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(79,70,229,0.4)]" />
            )}
        </Link>
    );
});

interface DashboardLayoutProps {
    children: React.ReactNode;
    schoolId: string;
    schoolName?: string;
}

export function SchoolDashboardLayout({ children, schoolId, schoolName: initialSchoolName }: DashboardLayoutProps) {
    const { isDark, toggle } = useSchoolTheme();
    const { signOut, profile } = useAuth();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [schoolProfile, setSchoolProfile] = useState<any>(null);
    const [platformSettings, setPlatformSettings] = useState<any>(null);
    const data = useSchoolContext();
    const { isProfileModalOpen, setIsProfileModalOpen } = data;

    useEffect(() => {
        if (!schoolId) return;
        getSchoolProfile(schoolId).then(p => setSchoolProfile(p));
        getPlatformSettings().then(s => setPlatformSettings(s));
    }, [schoolId]);

    const schoolName = schoolProfile?.name || initialSchoolName || 'Institution';

    // Auto-close mobile menu on path change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    return (
        <div className={`min-h-screen flex ${ts.pageBg(isDark)} ${isDark ? 'text-slate-200' : 'text-slate-900'} antialiased selection:bg-indigo-500/10`}>

            {/* ─── Sidebar (Desktop) ─── */}
            <aside
                role="navigation"
                aria-label="Main navigation"
                className={`fixed left-0 top-0 h-full border-r transition-all duration-500 z-50 group/sidebar flex-col hidden md:flex ${isDark ? 'bg-[#0f1115] border-white/[0.03]' : 'bg-white border-slate-200/60'} ${isSidebarOpen ? 'w-[280px]' : 'w-[88px]'}`}
            >
                {/* Sidebar Header */}
                <div className={`h-20 flex items-center mb-4 transition-all duration-500 ${isSidebarOpen ? 'px-6' : 'px-0 justify-center'}`}>
                    <Link href="/school-admin" className="flex items-center gap-3 group">
                        <div className={`w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform duration-300 overflow-hidden flex-shrink-0`}>
                            {platformSettings?.logo_url
                                ? <img src={platformSettings.logo_url} className="w-full h-full object-cover" alt="Logo" />
                                : <GraduationCap size={22} strokeWidth={2.5} />
                            }
                        </div>
                        {isSidebarOpen && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
                                <span className={`font-black tracking-tighter leading-none text-xl ${ts.textPrimary(isDark)}`}>TechNurture</span>
                                <span className="text-[9px] uppercase tracking-[0.2em] font-black text-indigo-500 mt-1">LMS PORTAL</span>
                            </motion.div>
                        )}
                    </Link>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.id}
                            item={item}
                            isSidebarOpen={isSidebarOpen}
                            isActive={pathname === item.href}
                            isDark={isDark}
                            pendingCount={data.stats.pendingStudents}
                        />
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className={`p-4 mt-auto border-t transition-all duration-500 ${ts.border(isDark)} bg-slate-50/50 dark:bg-white/[0.01]`}>
                    <div className={`relative flex items-center transition-all duration-500 rounded-2xl ${isSidebarOpen ? 'gap-3 p-3' : 'justify-center py-4 w-12 mx-auto'} ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-[11px] font-black shadow-lg shadow-indigo-500/10 flex-shrink-0">
                            {profile?.first_name?.[0]?.toUpperCase()}{profile?.last_name?.[0]?.toUpperCase()}
                        </div>
                        {isSidebarOpen && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 flex-1">
                                <p className={`text-[13px] font-black truncate tracking-tight ${ts.textPrimary(isDark)}`}>{profile?.first_name} {profile?.last_name}</p>
                                <p className={`text-[9px] font-black truncate opacity-40 uppercase tracking-widest ${ts.textPrimary(isDark)}`}>Administrator</p>
                            </motion.div>
                        )}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                            className={`hidden md:flex absolute -right-3 top-[-10px] w-6 h-6 rounded-lg border items-center justify-center transition-all opacity-0 group-hover/sidebar:opacity-100 ${isDark ? 'bg-[#161921] border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'} hover:scale-110 shadow-xl shadow-black/10 z-10`}
                        >
                            {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                        </button>
                    </div>
                    {isSidebarOpen && (
                        <button
                            onClick={signOut}
                            className={`w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-black transition-all ${isDark ? 'text-rose-500 hover:bg-rose-500/10' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'}`}
                        >
                            <LogOut size={16} />
                            SIGN OUT
                        </button>
                    )}
                </div>
            </aside>

            {/* ─── Mobile Sidebar ─── */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] md:hidden"
                            aria-hidden="true"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            role="navigation"
                            aria-label="Mobile navigation"
                            className={`fixed top-0 left-0 bottom-0 w-[min(300px,85vw)] z-[70] shadow-2xl md:hidden flex flex-col ${ts.pageBg(isDark)}`}
                            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                        >
                            {/* Mobile header */}
                            <div className={`h-20 flex items-center justify-between px-6 border-b flex-shrink-0 ${ts.border(isDark)}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                        <GraduationCap size={22} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`font-black tracking-tight leading-none ${ts.textPrimary(isDark)}`}>TechNurture</span>
                                        <span className="text-[10px] uppercase font-bold text-indigo-500 mt-0.5">Portal</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    aria-label="Close menu"
                                    className={`p-2 rounded-xl ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-500'}`}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Mobile nav — grows to fill available space */}
                            <nav className="flex-1 p-4 space-y-1.5 mt-4 overflow-y-auto custom-scrollbar min-h-0">
                                {NAV_ITEMS.map(item => (
                                    <NavLink
                                        key={item.id}
                                        item={item}
                                        isMobile
                                        isSidebarOpen={false}
                                        isActive={pathname === item.href}
                                        isDark={isDark}
                                        pendingCount={data.stats.pendingStudents}
                                    />
                                ))}
                            </nav>

                            {/* Mobile footer — flex-shrink-0 keeps it pinned at bottom */}
                            <div className={`flex-shrink-0 p-6 border-t ${ts.border(isDark)} ${isDark ? 'bg-[#0f1115]' : 'bg-white'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-[12px] font-black shadow-lg shadow-indigo-500/10">
                                        {profile?.first_name?.[0]?.toUpperCase()}{profile?.last_name?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[13px] font-black truncate tracking-tight ${ts.textPrimary(isDark)}`}>{profile?.first_name} {profile?.last_name}</p>
                                        <p className="text-[10px] font-bold text-slate-500">School Admin</p>
                                    </div>
                                    <button onClick={signOut} aria-label="Sign out" className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ─── Main Content ─── */}
            <main className={`flex-1 transition-all duration-500 min-w-0 ${isSidebarOpen ? 'md:pl-[280px]' : 'md:pl-[88px]'}`}>
                {/* Header */}
                <header className={`sticky top-0 z-40 transition-all duration-500 ${ts.headerBg(isDark)} ${ts.border(isDark)} border-b`}>
                    <div className="h-20 px-4 md:px-8 flex items-center justify-between gap-4 max-w-[1600px] mx-auto">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                aria-label="Open navigation menu"
                                aria-expanded={isMobileMenuOpen}
                                className={`p-2.5 rounded-xl md:hidden ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-600'}`}
                            >
                                <Menu size={20} />
                            </button>
                            <div className="hidden sm:flex flex-col">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 leading-none">DASHBOARD</span>
                                </div>
                                <h1 className={`text-2xl font-black tracking-tight leading-none ${ts.textPrimary(isDark)}`}>
                                    {NAV_ITEMS.find(item => pathname === item.href)?.label || 'Overview'}
                                    <Badge variant="outline" className={`ml-3 text-[10px] py-0 px-2 rounded-md font-black border-indigo-500/20 text-indigo-500 h-5`}>
                                        SCHOOL ADMIN
                                    </Badge>
                                </h1>
                            </div>
                        </div>

                        {/* Middle Search */}
                        <div className="hidden lg:flex items-center flex-1 max-w-md relative group px-2">
                            <Search className="absolute left-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search global..."
                                readOnly
                                className={`w-full h-11 pl-12 pr-4 rounded-xl text-[13px] font-medium border transition-all cursor-not-allowed opacity-60 ${isDark ? 'bg-white/[0.03] border-white/[0.05]' : 'bg-slate-50 border-slate-200/60'} focus:outline-none placeholder:text-slate-500`}
                            />
                        </div>

                        {/* Top Right Actions */}
                        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
                            <div className="flex items-center gap-1 sm:gap-2">
                                <button
                                    onClick={toggle}
                                    aria-label="Toggle theme"
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100'}`}
                                >
                                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                                </button>
                                <button
                                    aria-label="Notifications"
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center relative transition-all ${isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <Bell size={18} />
                                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-[#0f1115]" />
                                </button>
                            </div>

                            <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden sm:block" />

                            <div className="flex items-center gap-3 group px-1">
                                <div className="text-right hidden md:block">
                                    <p className={`text-[12px] font-black tracking-tight ${ts.textPrimary(isDark)}`}>{profile?.first_name} {profile?.last_name}</p>
                                    <p className="text-[9px] font-black uppercase text-rose-500 tracking-wider leading-none mt-0.5">SCHOOL ADMIN</p>
                                </div>
                                <button
                                    onClick={() => setIsProfileModalOpen(true)}
                                    aria-label="Open school profile"
                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-[12px] font-black shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform"
                                >
                                    {profile?.first_name?.[0]?.toUpperCase()}{profile?.last_name?.[0]?.toUpperCase()}
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-4 md:p-8 lg:p-10 max-w-[1700px] mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            <SchoolProfileModal
                schoolId={schoolId}
                profile={schoolProfile}
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onUpdate={() => {
                    getSchoolProfile(schoolId).then(p => setSchoolProfile(p));
                }}
            />
        </div>
    );
}
