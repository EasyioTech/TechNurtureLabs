'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    Trophy,
    Target,
    User,
    Settings,
    GraduationCap,
    Flame,
    Zap,
    ChevronLeft,
    LogOut as LogOutIcon,
    Palette,
    Microscope,
    Beaker,
    Award
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { AnimatePresence, motion } from 'framer-motion';
import { GlobalLogo } from '@/modules/shared/components/global-logo';
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { icon: Microscope, label: 'Dashboard', href: '/student' },
    { icon: Beaker, label: 'My Library', href: '/student/courses' },
    { icon: Target, label: 'Challenges', href: '/student/challenges' },
    { icon: Trophy, label: 'Achievements', href: '/student/achievements' },
    { icon: Award, label: 'Certificates', href: '/student/certificates' },
    { icon: User, label: 'Profile', href: '/student/profile' },
    { icon: Settings, label: 'Settings', href: '/student/settings' },
];

export function StudentSidebar({
    school,
    stats,
    courses,
    settings,
    profile
}: {
    school?: { name: string; logo_url?: string | null };
    stats?: { xp: number; streak: number; level: number };
    courses?: any[];
    settings?: any;
    profile?: { full_name: string; email: string };
}) {
    const { signOut } = useAuth();
    const pathname = usePathname();
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('student-sidebar-collapsed');
        if (saved === 'true') setIsCollapsed(true);
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('student-sidebar-collapsed', String(newState));
        window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: newState }));
    };

    const logoUrl = school?.logo_url || settings?.logo_url;
    const displayName = school?.name || settings?.platform_name || 'TechNurture';
    const initials = profile?.full_name
        ?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';

    // Global Logo Settings Override for Sidebar Context
    const sidebarLogoSettings = {
        ...settings,
        logo_url: logoUrl,
        platform_name: displayName,
        logo_layout: isCollapsed ? 'icon_only' : (settings?.logo_layout || 'landscape'),
    };

    return (
        <aside
            className={cn(
                "hidden lg:flex flex-col h-screen bg-white border-r border-slate-200/60 fixed top-0 left-0 z-50 transition-[width] duration-300 ease-out overflow-hidden",
                isCollapsed ? "w-24" : "w-64"
            )}
        >
            {/* Logo Section */}
            <div className={cn("p-6 flex items-center relative", isCollapsed ? "justify-center" : "justify-between")}>
                <Link href="/student" className="flex items-center gap-4 select-none group">
                    <GlobalLogo 
                        settings={sidebarLogoSettings}
                        size="md"
                        forceHeight={isCollapsed ? 32 : 36}
                    />

                    {!isCollapsed && (
                        <div className="flex flex-col justify-center -ml-1">
                             <div className="flex items-center gap-1.5 mt-0.5">
                                <Zap size={10} className="text-indigo-500 fill-indigo-500" />
                                <p className="text-[9px] font-bold text-slate-400 tracking-[0.1em] uppercase">Student Portal</p>
                            </div>
                        </div>
                    )}
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto no-scrollbar relative z-10">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.label} href={item.href}>
                            {/*
                              * Replaced motion.div layout with plain div.
                              * layout prop forces Framer to measure every nav item on
                              * every sidebar width change (6 items × layout read = 12
                              * getBoundingClientRect calls per collapse/expand).
                              * transition-colors handles the active/hover color shift cheaply.
                              */}
                            <div
                                className={cn(
                                    "flex items-center rounded-2xl text-sm font-semibold transition-colors duration-150 relative group/nav cursor-pointer py-3.5",
                                    isCollapsed ? "justify-center w-14 h-14 mx-auto" : "px-5",
                                    isActive
                                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/80'
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <item.icon
                                        size={20}
                                        className={cn(
                                            "transition-colors duration-150",
                                            isActive ? 'text-white' : 'text-slate-400 group-hover/nav:text-indigo-600'
                                        )}
                                    />
                                    {!isCollapsed && <span className="truncate tracking-tight">{item.label}</span>}
                                </div>

                                {isCollapsed && item.label !== 'Settings' && (
                                    <div className="absolute left-full ml-6 px-4 py-2 bg-slate-900 text-white text-[11px] font-bold tracking-wide rounded-xl opacity-0 group-hover/nav:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-[70] shadow-2xl">
                                        {item.label}
                                        <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-slate-900 rotate-45" />
                                    </div>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-5 mt-auto relative z-10 border-t border-slate-50">
                {/* Streak Card */}
                <div className={cn(
                    "mb-4 rounded-3xl bg-slate-50 p-4 border border-slate-100 overflow-hidden",
                    isCollapsed ? "w-14 h-14 p-0 flex items-center justify-center mx-auto" : ""
                )}>
                    <div className={cn("flex items-center", isCollapsed ? "flex-col" : "gap-3 mb-2")}>
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <Flame size={18} className="text-amber-600 fill-amber-600" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Streak</p>
                                <p className="text-base font-black text-slate-800 leading-none">{stats?.streak || 0} Days</p>
                            </div>
                        )}
                        {isCollapsed && <span className="text-[10px] font-black text-amber-600 mt-1">{stats?.streak || 0}D</span>}
                    </div>
                </div>

                {/* Profile Card */}
                <div className={cn(
                    "relative group/profile-card",
                    isCollapsed ? "w-14 h-14 mx-auto" : ""
                )}>
                    <div className={cn(
                        "flex items-center bg-white border border-slate-100 rounded-2xl p-2 hover:border-slate-300 transition-colors duration-150",
                        isCollapsed ? "justify-center h-14" : "gap-3 shadow-sm hover:shadow-md"
                    )}>
                        <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xs font-bold transition-transform duration-150 group-hover/profile-card:scale-105">
                                {initials}
                            </div>
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                        </div>

                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{profile?.full_name?.split(' ')[0]}</p>
                                <p className="text-[10px] font-bold text-slate-400">Level {stats?.level || 1}</p>
                            </div>
                        )}

                        {!isCollapsed && (
                            <button
                                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors duration-150"
                            >
                                <Settings size={14} className={cn("transition-transform duration-300", profileMenuOpen && "rotate-180")} />
                            </button>
                        )}
                    </div>

                    {/* Profile popup — AnimatePresence kept here: it's a small, infrequent overlay */}
                    <AnimatePresence>
                        {profileMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute bottom-full mb-4 left-0 right-0 bg-white shadow-2xl rounded-2xl border border-slate-100 p-2 z-50 overflow-hidden"
                                >
                                    <Link href="/student/profile" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:text-indigo-600 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold">
                                        <User size={14} /> My Profile
                                    </Link>
                                    <Link href="/student/settings" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:text-indigo-600 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold">
                                        <Palette size={14} /> Preferences
                                    </Link>
                                    <div className="h-px bg-slate-100 my-1 mx-2" />
                                    <button
                                        onClick={() => { setProfileMenuOpen(false); signOut(); }}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-rose-500 hover:text-rose-600 rounded-xl hover:bg-rose-50/50 transition-colors text-xs font-bold"
                                    >
                                        <LogOutIcon size={14} /> Logout
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Float Toggle Button */}
            <button
                onClick={toggleCollapse}
                className={cn(
                    "absolute -right-3 top-24 w-7 h-7 rounded-full bg-white border border-slate-200/60 shadow-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:scale-110 active:scale-95 transition-[transform,color] duration-150 z-[60] group",
                    isCollapsed && "rotate-180"
                )}
            >
                <ChevronLeft size={14} strokeWidth={3} className="group-hover:-translate-x-0.5 transition-transform duration-150" />
            </button>
        </aside>
    );
}
