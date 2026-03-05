'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Flame, Star, Crown, Bell, LogOut, Search, Menu, X,
    Settings, GraduationCap, LayoutDashboard,
    Zap, Sparkles, Compass, User, BookOpen
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';

interface StudentHeaderProps {
    profile?: { full_name: string; email: string };
    stats: { xp: number; streak: number; level: number };
    searchQuery?: string;
    setSearchQuery?: (q: string) => void;
}

export function StudentHeader({ profile, stats, searchQuery, setSearchQuery }: StudentHeaderProps) {
    const { signOut } = useAuth();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const initials = profile?.full_name
        ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';

    // Keyboard shortcut: ESC closes everything
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setSearchOpen(false); setNotifOpen(false); setMobileOpen(false); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Lock body when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    // Auto-focus search
    useEffect(() => {
        if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 80);
    }, [searchOpen]);

    const doSignOut = useCallback(() => {
        setMobileOpen(false);
        signOut();
    }, [signOut]);

    return (
        <>
            <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="max-w-7xl mx-auto flex items-center justify-between h-[60px] sm:h-[68px] px-4 sm:px-6 lg:px-8">

                    {/* ── Left: Logo ── */}
                    <Link href="/student" className="flex items-center gap-2.5 flex-shrink-0 select-none">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
                            <GraduationCap size={20} className="text-white" />
                        </div>
                        <div className="hidden min-[480px]:block leading-none">
                            <p className="text-[15px] sm:text-base font-extrabold text-slate-800 tracking-tight">TechNurture</p>
                            <p className="text-[10px] font-semibold text-indigo-500 tracking-wide">LABS</p>
                        </div>
                    </Link>

                    {/* ── Center: Quick Stats (tablet+) ── */}
                    <div className="hidden md:flex items-center gap-3 select-none">
                        <Pip emoji="🔥" value={stats.streak} label="Streak" />
                        <Pip emoji="⭐" value={stats.xp.toLocaleString()} label="XP" />
                        <Pip emoji="🏆" value={`Lv ${stats.level}`} label="Level" />
                    </div>

                    {/* ── Right: Actions ── */}
                    <div className="flex items-center gap-1.5 sm:gap-2">

                        {/* Search */}
                        <button
                            onClick={() => setSearchOpen(true)}
                            aria-label="Search"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all duration-100"
                        >
                            <Search size={18} />
                        </button>

                        {/* Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setNotifOpen(v => !v)}
                                aria-label="Notifications"
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all duration-100 relative"
                            >
                                <Bell size={18} />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                            </button>
                            <AnimatePresence>{notifOpen && <NotifPanel close={() => setNotifOpen(false)} />}</AnimatePresence>
                        </div>

                        {/* Divider */}
                        <div className="hidden sm:block w-px h-7 bg-slate-100 mx-1" />

                        {/* Avatar + name (desktop) */}
                        <Link href="/student/profile" className="hidden sm:flex items-center gap-2.5 pl-1 group">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white group-hover:ring-indigo-100 transition-all duration-150">
                                {initials}
                            </div>
                            <div className="hidden lg:block leading-none">
                                <p className="text-sm font-bold text-slate-800 truncate max-w-[120px]">{profile?.full_name?.split(' ')[0]}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Level {stats.level}</p>
                            </div>
                        </Link>

                        {/* Logout (desktop) */}
                        <button
                            onClick={doSignOut}
                            aria-label="Sign out"
                            className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-xl items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 active:scale-95 transition-all duration-100"
                        >
                            <LogOut size={16} />
                        </button>

                        {/* Hamburger (mobile) */}
                        <button
                            onClick={() => setMobileOpen(true)}
                            aria-label="Open menu"
                            className="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95 transition-all duration-100"
                        >
                            <Menu size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* ════════════ SEARCH OVERLAY ════════════ */}
            <AnimatePresence>
                {searchOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-[2px] flex items-start justify-center pt-20 sm:pt-28 px-4"
                        onClick={() => setSearchOpen(false)}
                    >
                        <motion.div
                            initial={{ y: -16, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -16, opacity: 0 }}
                            transition={{ duration: 0.12 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
                        >
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                                <Search size={18} className="text-indigo-500 flex-shrink-0" />
                                <input
                                    ref={searchInputRef}
                                    value={searchQuery || ''}
                                    onChange={e => setSearchQuery?.(e.target.value)}
                                    placeholder="Search courses, lessons..."
                                    className="flex-1 text-sm sm:text-base font-medium text-slate-800 placeholder:text-slate-300 outline-none bg-transparent"
                                />
                                <button onClick={() => setSearchOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                    <X size={16} className="text-slate-400" />
                                </button>
                            </div>
                            <div className="px-5 py-6 text-center">
                                <p className="text-sm text-slate-400">Start typing to find courses &amp; lessons</p>
                                <p className="text-xs text-slate-300 mt-1">
                                    Press <kbd className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-mono border border-slate-200">Esc</kbd> to close
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ════════════ MOBILE DRAWER ════════════ */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.12 }}
                            onClick={() => setMobileOpen(false)}
                            className="fixed inset-0 z-[300] bg-black/30 sm:hidden"
                        />
                        <motion.aside
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'tween', duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                            className="fixed top-0 right-0 bottom-0 w-[80%] max-w-[300px] bg-white z-[310] shadow-xl flex flex-col sm:hidden"
                        >
                            {/* Top */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                                        <GraduationCap size={16} />
                                    </div>
                                    <span className="font-extrabold text-slate-800 text-[15px] tracking-tight">TechNurture</span>
                                </div>
                                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg bg-slate-50 text-slate-500 active:scale-95">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Profile card */}
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white shadow">
                                    {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{profile?.full_name}</p>
                                    <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="flex items-center justify-around py-3.5 px-5 border-b border-slate-100 bg-slate-50/60">
                                <MiniStat emoji="🔥" value={stats.streak} label="Streak" />
                                <div className="w-px h-8 bg-slate-200" />
                                <MiniStat emoji="⭐" value={stats.xp.toLocaleString()} label="XP" />
                                <div className="w-px h-8 bg-slate-200" />
                                <MiniStat emoji="🏆" value={stats.level} label="Level" />
                            </div>

                            {/* Nav */}
                            <nav className="flex-1 overflow-y-auto py-3 px-3">
                                <NavItem icon={LayoutDashboard} label="Dashboard" href="/student" active={pathname === '/student'} close={() => setMobileOpen(false)} />
                                <NavItem icon={Compass} label="Explore Courses" href="/student" close={() => setMobileOpen(false)} />
                                <NavItem icon={User} label="My Profile" href="/student/profile" active={pathname === '/student/profile'} close={() => setMobileOpen(false)} />
                                <NavItem icon={Crown} label="Achievements" href="/student/profile" close={() => setMobileOpen(false)} />
                                <NavItem icon={Settings} label="Settings" href="/student/profile" close={() => setMobileOpen(false)} />
                            </nav>

                            {/* Sign out */}
                            <div className="px-5 py-4 border-t border-slate-100">
                                <button
                                    onClick={doSignOut}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-rose-500 bg-rose-50 hover:bg-rose-100 active:scale-[0.98] transition-all duration-100"
                                >
                                    <LogOut size={16} /> Sign Out
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

/* ───────── Sub-components ───────── */

/** Desktop stat pill with emoji */
function Pip({ emoji, value, label }: { emoji: string; value: string | number; label: string }) {
    return (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-100 select-none">
            <span className="text-base leading-none">{emoji}</span>
            <span className="text-sm font-bold text-slate-800 leading-none">{value}</span>
            <span className="text-[10px] font-medium text-slate-400 uppercase hidden lg:inline">{label}</span>
        </div>
    );
}

/** Mobile drawer stat */
function MiniStat({ emoji, value, label }: { emoji: string; value: string | number; label: string }) {
    return (
        <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg leading-none">{emoji}</span>
            <span className="text-sm font-bold text-slate-800">{value}</span>
            <span className="text-[9px] font-medium text-slate-400 uppercase">{label}</span>
        </div>
    );
}

/** Mobile nav item */
function NavItem({ icon: Icon, label, href, active, close }: { icon: any; label: string; href: string; active?: boolean; close: () => void }) {
    return (
        <Link
            href={href}
            onClick={close}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-100 ${active
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-600 hover:bg-slate-50 active:bg-slate-100'
                }`}
        >
            <Icon size={18} className={active ? 'text-indigo-500' : 'text-slate-400'} />
            {label}
        </Link>
    );
}

/** Notification dropdown */
function NotifPanel({ close }: { close: () => void }) {
    return (
        <>
            <div className="fixed inset-0 z-[-1]" onClick={close} />
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-10"
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
                    <p className="text-sm font-bold text-slate-800">Notifications</p>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">2 new</span>
                </div>
                <div className="py-1">
                    <NotifRow icon={Sparkles} title="New Badge!" text="You earned 'Early Bird'" time="2m" accent="text-sky-500 bg-sky-50" />
                    <NotifRow icon={Zap} title="Streak Reminder" text="Keep your 5-day streak alive" time="1h" accent="text-amber-500 bg-amber-50" />
                </div>
                <button onClick={close} className="w-full py-2.5 text-xs font-medium text-slate-400 hover:text-indigo-500 hover:bg-slate-50 border-t border-slate-50 transition-colors duration-100">
                    Mark all as read
                </button>
            </motion.div>
        </>
    );
}

function NotifRow({ icon: Icon, title, text, time, accent }: any) {
    const [textCls, bgCls] = accent.split(' ');
    return (
        <div className="flex gap-3 px-4 py-3 hover:bg-slate-50 transition-colors duration-75 cursor-pointer">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bgCls} ${textCls}`}>
                <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700 truncate">{title}</p>
                    <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0">{time}</span>
                </div>
                <p className="text-xs text-slate-400 truncate">{text}</p>
            </div>
        </div>
    );
}
