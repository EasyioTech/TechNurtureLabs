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
    CheckCircle2,
    Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Home',    href: '/student' },
    { icon: BookOpen,        label: 'Courses', href: '/student/courses' },
    { icon: Target,          label: 'Quests',  href: '/student/challenges' },
    { icon: Trophy,          label: 'Badges',  href: '/student/achievements' },
    { icon: User,            label: 'Profile', href: '/student/profile' },
];

const doneKey = (id: string) => `tnl_timer_done_${id}`;

/** Extracts lessonId from /student/lesson/[lessonId] — null on any other route. */
function useLessonId(): string | null {
    const pathname = usePathname();
    const match    = pathname.match(/^\/student\/lesson\/([^/]+)$/);
    return match ? match[1] : null;
}

export function StudentBottomNav() {
    const pathname  = usePathname();
    const lessonId  = useLessonId();

    const [isVisible,       setIsVisible]       = useState(true);
    const [markDoneReady,   setMarkDoneReady]   = useState(false);
    const [lessonCompleted, setLessonCompleted] = useState(false);
    const [isSaving,        setIsSaving]        = useState(false);
    const lastScrollY = useRef(0);

    // ── Bootstrap mark-done state from localStorage ─────────────────────────
    useEffect(() => {
        if (!lessonId) {
            setMarkDoneReady(false);
            setLessonCompleted(false);
            return;
        }
        try {
            setMarkDoneReady(localStorage.getItem(doneKey(lessonId)) === '1');
        } catch {
            setMarkDoneReady(false);
        }
        setLessonCompleted(false);
    }, [lessonId]);

    // ── Listen for timer-done / lesson-completed events ─────────────────────
    useEffect(() => {
        const onTimerDone = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (lessonId && detail?.lessonId === lessonId) {
                setMarkDoneReady(true);
            }
        };
        const onLessonCompleted = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (lessonId && detail?.lessonId === lessonId) {
                setLessonCompleted(true);
                setMarkDoneReady(false);
            }
        };

        window.addEventListener('tnl:timer-done',       onTimerDone);
        window.addEventListener('tnl:lesson-completed', onLessonCompleted);
        return () => {
            window.removeEventListener('tnl:timer-done',       onTimerDone);
            window.removeEventListener('tnl:lesson-completed', onLessonCompleted);
        };
    }, [lessonId]);

    // ── Scroll hide/show ─────────────────────────────────────────────────────
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY < lastScrollY.current || currentScrollY < 10) {
                setIsVisible(true);
            } else if (currentScrollY > 100 && currentScrollY > lastScrollY.current) {
                setIsVisible(false);
            }
            lastScrollY.current = currentScrollY;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ── Mark done: delegate to lesson-client via custom event ────────────────
    async function handleMarkDone() {
        if (isSaving || !lessonId) return;
        setIsSaving(true);
        // lesson-client.tsx listens for this and calls completeLessonAndReward
        window.dispatchEvent(new CustomEvent('tnl:mark-done-click'));
        // Give the handler a moment; lesson-client fires tnl:lesson-completed on success
        setTimeout(() => setIsSaving(false), 3000);
    }

    // Show the Mark Done strip when:
    //  • we are on a lesson page
    //  • the timer has finished (markDoneReady)
    const showMarkDone = !!lessonId && markDoneReady;

    return (
        <nav
            className={cn(
                'fixed bottom-0 left-0 right-0 z-[100] lg:hidden bg-white border-t border-slate-200/50 shadow-[0_-12px_40px_rgba(0,0,0,0.1)] rounded-t-[32px] transition-transform duration-300 ease-in-out',
                isVisible ? 'translate-y-0' : 'translate-y-full shadow-none',
            )}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            {/* ── Mark Done strip (slides in above the nav when timer is done) ── */}
            <AnimateMarkDone show={showMarkDone}>
                <button
                    onClick={handleMarkDone}
                    disabled={isSaving}
                    className={cn(
                        'w-full flex items-center justify-center gap-2.5 py-3.5 font-black text-[11px] uppercase tracking-widest transition-all active:scale-[0.98]',
                        isSaving
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700',
                    )}
                >
                    {isSaving ? (
                        <>
                            <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                            Saving…
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={16} strokeWidth={2.5} />
                            Mark Done · Earn +XP
                        </>
                    )}
                </button>
            </AnimateMarkDone>

            {/* ── Timer-active reminder strip (timer running, not done yet) ── */}
            {!!lessonId && !markDoneReady && !lessonCompleted && (
                <div className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 border-b border-slate-100">
                    <Timer size={11} className="text-indigo-500 animate-pulse" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        Timer running — stay focused
                    </span>
                </div>
            )}

            {/* ── Normal nav items ── */}
            <div className="flex items-stretch justify-around max-w-md mx-auto px-4 pt-3 pb-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="relative flex-1 flex flex-col items-center justify-center gap-1.5 py-1 active:scale-95 transition-transform"
                        >
                            <div className={cn(
                                'relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300',
                                isActive ? 'bg-slate-950 shadow-lg shadow-slate-950/20' : 'bg-transparent',
                            )}>
                                <item.icon
                                    size={20}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={cn(
                                        'transition-colors duration-300',
                                        isActive ? 'text-white' : 'text-slate-500',
                                    )}
                                />
                            </div>
                            <span className={cn(
                                'text-[9px] font-black uppercase tracking-[0.14em] transition-colors duration-300',
                                isActive ? 'text-slate-950' : 'text-slate-500',
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

/** Simple CSS-only animate-in/out wrapper — avoids adding framer-motion to the nav bundle. */
function AnimateMarkDone({ show, children }: { show: boolean; children: React.ReactNode }) {
    const [rendered, setRendered] = useState(show);

    useEffect(() => {
        if (show) setRendered(true);
    }, [show]);

    const onTransitionEnd = () => {
        if (!show) setRendered(false);
    };

    if (!rendered) return null;

    return (
        <div
            onTransitionEnd={onTransitionEnd}
            className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out',
                show ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0',
            )}
        >
            {children}
        </div>
    );
}
