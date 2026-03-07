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
    Compass
} from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/student' },
    { icon: BookOpen, label: 'My Courses', href: '/student/courses' },
    { icon: Compass, label: 'Explore', href: '/student/explore' },
    { icon: Target, label: 'Challenges', href: '/student/challenges' },
    { icon: Trophy, label: 'Achievements', href: '/student/achievements' },
    { icon: User, label: 'Profile', href: '/student/profile' },
];

export function StudentSidebar({
    school,
    stats,
    courses
}: {
    school?: { name: string; logo_url?: string | null };
    stats?: { xp: number; streak: number; level: number };
    courses?: any[];
}) {
    const pathname = usePathname();

    return (
        <aside className="hidden lg:flex flex-col w-64 h-screen bg-white border-r border-slate-100 sticky top-0">
            <div className="p-6">
                <Link href="/student" className="flex items-center gap-3 select-none">
                    {school?.logo_url ? (
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg border border-slate-100 p-1">
                            <img src={school.logo_url} alt={school.name} className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <GraduationCap size={22} className="text-white" />
                        </div>
                    )}
                    <div>
                        <p className="text-base font-black text-slate-800 tracking-tight leading-none">{school?.name || 'TechNurture'}</p>
                        <p className="text-[10px] font-bold text-indigo-500 tracking-[0.2em] mt-1 uppercase">Student Portal</p>
                    </div>
                </Link>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
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
                                    <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
                                    {item.label}
                                </div>
                                {isActive && <ChevronRight size={14} className="opacity-50" />}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto">
                <div className="bg-slate-50 rounded-3xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <Flame size={16} className="text-amber-600" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Streak</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900">{stats?.streak || 0}</span>
                        <span className="text-xs font-bold text-slate-500">Days</span>
                    </div>
                    <div className="mt-3 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(((stats?.streak || 0) / 7) * 100, 100)}%` }} />
                    </div>
                    <p className="mt-2 text-[9px] font-bold text-slate-400 uppercase">
                        {stats?.streak && stats.streak >= 7 ? 'Full week streak!' : `${7 - ((stats?.streak || 0) % 7)} days to next milestone`}
                    </p>
                </div>
            </div>

            <div className="p-4 border-t border-slate-50">
                <button className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-rose-500 rounded-2xl hover:bg-rose-50 transition-colors text-sm font-bold">
                    <Zap size={20} />
                    Upgrade Pass
                </button>
            </div>
        </aside>
    );
}
