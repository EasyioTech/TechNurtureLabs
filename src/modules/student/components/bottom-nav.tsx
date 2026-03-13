'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    LayoutDashboard, 
    BookOpen, 
    Target, 
    Trophy, 
    User 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Dash', href: '/student' },
    { icon: BookOpen, label: 'Library', href: '/student/courses' },
    { icon: Target, label: 'Quest', href: '/student/challenges' },
    { icon: Trophy, label: 'Badges', href: '/student/achievements' },
    { icon: User, label: 'Profile', href: '/student/profile' },
];

export function StudentBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-t border-slate-100 px-2 lg:hidden">
            <div className="flex items-center justify-around h-20 max-w-md mx-auto">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.label} href={item.href} className="flex-1">
                            <div className="flex flex-col items-center justify-center relative">
                                <motion.div
                                    animate={isActive ? { y: -4 } : { y: 0 }}
                                    className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                                        isActive 
                                            ? "bg-slate-950 text-white shadow-lg shadow-slate-900/20" 
                                            : "text-slate-400 hover:text-slate-600 active:scale-90"
                                    )}
                                >
                                    <item.icon size={22} />
                                </motion.div>
                                <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest mt-1.5 transition-colors",
                                    isActive ? "text-slate-900" : "text-slate-400"
                                )}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <motion.div 
                                        layoutId="bottomNavDot"
                                        className="absolute -top-1 w-1 h-1 rounded-full bg-indigo-600"
                                    />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
            {/* Safe area spacer for notched phones */}
            <div className="h-[env(safe-area-inset-bottom)] pb-2 bg-white/80" />
        </nav>
    );
}
