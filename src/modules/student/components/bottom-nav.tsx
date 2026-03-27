'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    Target,
    Trophy,
    User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Home',    href: '/student' },
    { icon: BookOpen,        label: 'Courses', href: '/student/courses' },
    { icon: Target,          label: 'Quests',  href: '/student/challenges' },
    { icon: Trophy,          label: 'Badges',  href: '/student/achievements' },
    { icon: User,            label: 'Profile', href: '/student/profile' },
];

export function StudentBottomNav() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            // Show only if scrolling up OR at the top
            if (currentScrollY < lastScrollY.current || currentScrollY < 10) {
                setIsVisible(true);
            } 
            // Hide if scrolling down AND not at the top
            else if (currentScrollY > 100 && currentScrollY > lastScrollY.current) {
                setIsVisible(false);
            }
            
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed bottom-0 left-0 right-0 z-[100] lg:hidden bg-white border-t border-slate-200/50 shadow-[0_-12px_40px_rgba(0,0,0,0.1)] rounded-t-[32px] transition-transform duration-300 ease-in-out",
                isVisible ? "translate-y-0" : "translate-y-full shadow-none"
            )}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex items-stretch justify-around max-w-md mx-auto px-4 pt-3 pb-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="relative flex-1 flex flex-col items-center justify-center gap-1.5 py-1 active:scale-95 transition-transform"
                        >
                            {/* Circular Icon Container */}
                            <div className={cn(
                                "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
                                isActive ? "bg-slate-950 shadow-lg shadow-slate-950/20" : "bg-transparent"
                            )}>
                                <item.icon
                                    size={20}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={cn(
                                        'transition-colors duration-300',
                                        isActive ? 'text-white' : 'text-slate-500'
                                    )}
                                />
                            </div>

                            {/* Label - Dark Slate High Recognition */}
                            <span
                                className={cn(
                                    'text-[9px] font-black uppercase tracking-[0.14em] transition-colors duration-300',
                                    isActive ? 'text-slate-950' : 'text-slate-500'
                                )}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
