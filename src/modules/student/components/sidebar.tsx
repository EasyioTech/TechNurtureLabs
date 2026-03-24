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
    ChevronRight,
    GraduationCap,
    Flame,
    Zap,
    Compass,
    Search,
    Bell,
    LogOut,
    ChevronLeft,
    Menu
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/student' },
    { icon: BookOpen, label: 'My Library', href: '/student/courses' },
    { icon: Target, label: 'Challenges', href: '/student/challenges' },
    { icon: Trophy, label: 'Achievements', href: '/student/achievements' },
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

    // Initial check for screen size or preference (could use localStorage)
    useEffect(() => {
        const saved = localStorage.getItem('student-sidebar-collapsed');
        if (saved === 'true') setIsCollapsed(true);
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('student-sidebar-collapsed', String(newState));
        // Dispatch custom event for layout adjustment
        window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: newState }));
    };

    const logoUrl = school?.logo_url || settings?.logo_url;
    const displayName = school?.name || settings?.platform_name || 'TechNurture';
    const initials = profile?.full_name
        ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';

    return (
        <aside 
            className={cn(
                "hidden lg:flex flex-col h-screen bg-white border-r border-slate-100 fixed top-0 left-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                isCollapsed ? "w-24" : "w-64"
            )}
        >
            {/* Logo Section */}
            <div className={cn("p-6 flex items-center transition-all duration-500", isCollapsed ? "justify-center" : "justify-between")}>
                <Link href="/student" className="flex items-center gap-3 select-none overflow-hidden">
                    <motion.div 
                        layout
                        className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0"
                    >
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={displayName}
                                className="w-6 h-6 object-contain"
                            />
                        ) : (
                            <GraduationCap size={22} className="text-white" />
                        )}
                    </motion.div>
                    {!isCollapsed && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="min-w-0"
                        >
                            <p className="text-base font-black text-slate-800 tracking-tight leading-none truncate">{displayName}</p>
                            <p className="text-[10px] font-bold text-indigo-500 tracking-[0.2em] mt-1 uppercase">Student Portal</p>
                        </motion.div>
                    )}
                </Link>
            </div>

            {/* Collapse Toggle Button (Hover Trigger) */}
            <button 
                onClick={toggleCollapse}
                className={cn(
                    "absolute -right-3 top-12 w-6 h-6 rounded-full bg-white border border-slate-100 shadow-md flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all z-[60]",
                    isCollapsed && "rotate-180"
                )}
            >
                <ChevronLeft size={12} strokeWidth={3} />
            </button>

            {/* Search Bar - Hidden when collapsed */}
            <div className={cn("px-4 mb-4 transition-all duration-500", isCollapsed ? "opacity-0 h-0 overflow-hidden mb-0" : "opacity-100")}>
                <div className="relative group">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                        type="text"
                        placeholder="Quick search..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all"
                    />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto no-scrollbar">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.label} href={item.href}>
                            <motion.div
                                layout
                                className={cn(
                                    "flex items-center rounded-2xl text-sm font-bold transition-all duration-300 relative group/nav",
                                    isCollapsed ? "justify-center w-12 h-12 mx-auto" : "justify-between px-4 py-3.5",
                                    isActive
                                        ? 'bg-slate-950 text-white shadow-xl shadow-slate-950/20'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon 
                                        size={20} 
                                        className={cn(
                                            "transition-colors duration-300", 
                                            isActive ? 'text-white' : 'text-slate-400 group-hover/nav:text-indigo-600'
                                        )} 
                                    />
                                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                                </div>
                                {!isCollapsed && isActive && (
                                    <motion.div layoutId="active-nav-indicator">
                                        <ChevronRight size={14} className="opacity-50" />
                                    </motion.div>
                                )}
                                
                                {isCollapsed && (
                                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/nav:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[70] shadow-xl">
                                        {item.label}
                                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-slate-900" />
                                    </div>
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 space-y-4">
                {/* Profile Card */}
                {profile && (
                    <div className="relative">
                        <div className={cn(
                            "flex items-center rounded-3xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-all cursor-pointer group/profile",
                            isCollapsed ? "p-1.5 justify-center" : "p-3 gap-3"
                        )}>
                            <Link href="/student/profile" className={cn("flex items-center flex-1 min-w-0", isCollapsed ? "justify-center" : "gap-3")}>
                                <div className="relative shrink-0">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover/profile:scale-105 transition-transform">
                                        {initials}
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 border-2 border-white rounded-full" />
                                </div>
                                {!isCollapsed && (
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-slate-800 truncate leading-none mb-1">{profile.full_name?.split(' ')[0]}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stats?.level ? `Level ${stats.level}` : 'Student'}</p>
                                    </div>
                                )}
                            </Link>
                            {!isCollapsed && (
                                <button 
                                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:bg-white transition-all shadow-sm"
                                >
                                    <Settings size={14} className={profileMenuOpen ? 'text-indigo-600 rotate-90' : 'transition-transform duration-300'} />
                                </button>
                            )}
                        </div>

                        <AnimatePresence>
                            {(profileMenuOpen || (isCollapsed && profileMenuOpen)) && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className={cn(
                                            "absolute bottom-full mb-4 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 p-2",
                                            isCollapsed ? "left-full ml-4 w-48" : "left-0 w-56"
                                        )}
                                    >
                                        <Link href="/student/profile" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:text-indigo-600 rounded-xl hover:bg-slate-50 transition-colors text-[10px] font-black uppercase tracking-widest">
                                            <User size={16} /> My Profile
                                        </Link>
                                        <Link href="/student/settings" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:text-indigo-600 rounded-xl hover:bg-slate-50 transition-colors text-[10px] font-black uppercase tracking-widest">
                                            <Settings size={16} /> Preferences
                                        </Link>
                                        <div className="h-px bg-slate-50 my-1" />
                                        <button
                                            onClick={() => {
                                                setProfileMenuOpen(false);
                                                signOut();
                                            }}
                                            className="flex items-center gap-3 w-full px-4 py-3 text-rose-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors text-[10px] font-black uppercase tracking-widest"
                                        >
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Streak Card - Minified when collapsed */}
                <div className={cn(
                    "bg-slate-50 rounded-3xl border border-slate-100 transition-all duration-500",
                    isCollapsed ? "p-2 mb-2" : "p-4"
                )}>
                    <div className={cn("flex items-center gap-2 transition-all", isCollapsed ? "flex-col mb-0" : "mb-3")}>
                        <div className={cn(
                            "rounded-xl bg-amber-100 flex items-center justify-center shrink-0 transition-all",
                            isCollapsed ? "w-10 h-10" : "w-8 h-8"
                        )}>
                            <Flame size={isCollapsed ? 20 : 16} className="text-amber-600" />
                        </div>
                        <div className={cn("flex flex-col tracking-tighter", isCollapsed ? "items-center text-center" : "")}>
                            <span className="text-[9px] font-black text-slate-900 uppercase leading-none">{stats?.streak || 0}D</span>
                            {!isCollapsed && <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{stats?.xp?.toLocaleString() || 0} XP</span>}
                        </div>
                    </div>
                   
                    {!isCollapsed && (
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(((stats?.streak || 0) / 7) * 100, 100)}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-amber-500 rounded-full" 
                            />
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
