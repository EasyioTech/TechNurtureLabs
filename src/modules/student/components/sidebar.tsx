'use client';

import React from 'react';
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
    Bell
} from 'lucide-react';
import { motion } from 'framer-motion';

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
    const pathname = usePathname();

    const logoUrl = school?.logo_url || settings?.logo_url;
    const displayName = school?.name || settings?.platform_name || 'TechNurture';
    const initials = profile?.full_name
        ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';

    return (
        <aside className="hidden lg:flex flex-col w-64 h-screen bg-white border-r border-slate-100 fixed top-0 left-0 z-50">
            {/* Logo Section */}
            <div className="p-6">
                <Link href="/student" className="flex items-center gap-3 select-none">
                    {logoUrl ? (
                        <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                            <img src={logoUrl} alt={displayName} className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <GraduationCap size={22} className="text-white" />
                        </div>
                    )}
                    {(!school || settings?.show_platform_name !== false) && (
                        <div className="min-w-0">
                            <p className="text-base font-black text-slate-800 tracking-tight leading-none truncate">{displayName}</p>
                            <p className="text-[10px] font-bold text-indigo-500 tracking-[0.2em] mt-1 uppercase">Student Portal</p>
                        </div>
                    )}
                </Link>
            </div>

            {/* Search Bar */}
            <div className="px-6 mb-4">
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
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.label} href={item.href}>
                            <motion.div
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${isActive
                                    ? 'bg-slate-950 text-white shadow-xl shadow-slate-950/20'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                                    {item.label}
                                </div>
                                {isActive && <ChevronRight size={14} className="opacity-50" />}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 space-y-4">
                {/* Profile Card */}
                {profile && (
                    <Link href="/student/profile">
                        <div className="flex items-center gap-3 p-3 rounded-3xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-all cursor-pointer group">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:scale-105 transition-transform">
                                    {initials}
                                </div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 border-2 border-white rounded-full" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-800 truncate leading-none mb-1">{profile.full_name?.split(' ')[0]}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stats?.level ? `Level ${stats.level}` : 'Student'}</p>
                            </div>
                            <Bell size={14} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                        </div>
                    </Link>
                )}

                {/* Streak Card */}
                <div className="bg-slate-50 rounded-3xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Flame size={16} className="text-amber-600" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-900 uppercase leading-none">{stats?.streak || 0} Day Streak</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{stats?.xp?.toLocaleString() || 0} Total XP</span>
                        </div>
                    </div>
                   
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(((stats?.streak || 0) / 7) * 100, 100)}%` }} />
                    </div>
                </div>
            </div>
        </aside>
    );
}
