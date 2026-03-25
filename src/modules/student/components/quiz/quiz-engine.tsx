'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle2, ShieldAlert, Timer, Trophy,
    Star, ArrowLeft, ArrowRight, Lock, RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { QuizData, Question } from '@/modules/student/types';
import { submitQuizAttempt } from '@/modules/student/actions';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────
type Phase = 'idle' | 'active' | 'done' | 'locked' | 'already_complete';

// ─── Helpers ─────────────────────────────────────────────────
function fisherYatesShuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ─── QuizResults ──────────────────────────────────────────────
export function QuizResults({
    score, total, percentage, xp, xpEarned, feedbackData, onRestart, violations,
}: {
    score: number;
    total: number;
    percentage: number;
    xp: number;
    xpEarned?: number;
    feedbackData?: any[];
    onRestart?: () => void;
    violations?: number;
}) {
    const passed = percentage >= 60;
    // Use actual server-awarded XP if available, otherwise fall back to fixed lesson XP
    const earned = xpEarned !== undefined ? xpEarned : (passed ? xp : 0);
    const autoSubmitted = violations !== undefined && violations >= 3;

    return (
        <div className="max-w-3xl mx-auto space-y-6 sm:space-y-12 px-4">
            {/* Security violation alert */}
            {violations !== undefined && violations > 0 && (
                <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-2xl sm:rounded-3xl flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                        <ShieldAlert size={18} className="text-rose-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest mb-1">
                            {autoSubmitted
                                ? 'Assessment auto-submitted due to security violations'
                                : `${violations} security violation${violations > 1 ? 's' : ''} detected`}
                        </p>
                        <p className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">
                            {autoSubmitted
                                ? 'Tab switching was detected 3 times. Your attempt has been recorded.'
                                : 'Tab switching during an assessment is prohibited and has been logged.'}
                        </p>
                    </div>
                </div>
            )}

            <div className={cn(
                'p-8 sm:p-20 rounded-[2.5rem] sm:rounded-[4rem] border-2 text-center relative overflow-hidden',
                passed ? 'bg-emerald-50 border-emerald-100 shadow-2xl' : 'bg-white border-slate-100 shadow-2xl'
            )}>
                <div className="relative z-10">
                    <div className={cn(
                        'w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 sm:mb-10 border-4 shadow-xl',
                        passed ? 'bg-emerald-500 text-white border-white' : 'bg-slate-100 text-slate-400 border-white'
                    )}>
                        <Trophy size={32} />
                    </div>

                    <h2 className="text-2xl sm:text-5xl font-black uppercase tracking-tight mb-4 text-slate-900">
                        {passed ? 'Assessment Mastered' : 'Keep Practising'}
                    </h2>
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 sm:mb-12">
                        Score: {score} / {total} Points · Accuracy {percentage}%
                    </p>

                    <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-xl mx-auto mb-8 sm:mb-12">
                        <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">XP Earned</p>
                            <p className="text-xl sm:text-2xl font-black text-indigo-600">+{earned}</p>
                        </div>
                        <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Accuracy</p>
                            <p className="text-xl sm:text-2xl font-black text-indigo-600">{percentage}%</p>
                        </div>
                    </div>

                    {passed ? (
                        <p className="text-[10px] sm:text-[11px] font-black text-emerald-600 uppercase tracking-widest flex items-center justify-center gap-2">
                            <CheckCircle2 size={14} /> Completion Verified &amp; Recorded
                        </p>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Pass threshold is 60%. Review the material and try again.
                            </p>
                            {onRestart && (
                                <button
                                    onClick={onRestart}
                                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 h-12 sm:h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-[11px] hover:bg-indigo-600 transition-all shadow-xl"
                                >
                                    <RotateCcw size={14} /> Try Again
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="text-center">
                <Link href="/student">
                    <button className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-indigo-500 transition-all flex items-center gap-3 mx-auto">
                        <ArrowLeft size={16} /> Return to Dashboard
                    </button>
                </Link>
            </div>
        </div>
    );
}

// ─── Main Quiz Engine ─────────────────────────────────────────
export function QuizEngine({
    quizData,
    lessonXp,
    lessonComplete,
    onComplete,
}: {
    quizData: QuizData;
    lessonXp: number;
    lessonComplete: boolean;
    onComplete: (score?: number, perfect?: boolean) => void;
}) {
    // ── All hooks unconditionally at the top ──────────────────

    const [phase, setPhase] = useState<Phase>(() => {
        if (quizData?.quiz?.is_locked) return 'locked';
        if (lessonComplete) return 'already_complete';
        return 'idle';
    });

    // Shuffle questions ONCE on mount — prevents memorising order across attempts
    const [questions] = useState<Question[]>(() =>
        fisherYatesShuffle(quizData?.questions ?? [])
    );

    const [currentIdx, setCurrentIdx] = useState(0);
    const [responses, setResponses] = useState<Record<string, string>>({});
    const [chosen, setChosen] = useState<string | null>(null);  // selected option for current Q
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [strikes, setStrikes] = useState(0);
    const [warning, setWarning] = useState<string | null>(null);

    // Refs — don't cause re-renders
    const submittedRef = useRef(false);
    // advanceRef always points to latest advance fn — safe to call from setTimeout/setInterval
    const advanceRef = useRef<(r?: Record<string, string>) => void>(() => {});
    // responsesRef tracks latest responses without stale closures (used in violation handler)
    const responsesRef = useRef<Record<string, string>>({});
    // doSubmitRef allows violation handler to call server submit without stale closure
    const doSubmitRef = useRef<(r: Record<string, string>) => void>(() => {});

    const isActive = phase === 'active';
    const q = questions[currentIdx];
    const totalQ = questions.length;

    // ── Effect 1: Prevent refresh / tab-close / back during quiz ──
    useEffect(() => {
        if (!isActive) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'You are in the middle of an assessment. Your progress will be lost.';
        };

        // Push a duplicate state so the first back-press hits our handler
        history.pushState(null, '', window.location.href);
        const handlePopState = () => {
            history.pushState(null, '', window.location.href);
            setWarning('Navigation is disabled during the assessment. Complete or submit to leave.');
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isActive]);

    // ── Effect 2: Tab-switch detection ────────────────────────
    useEffect(() => {
        if (!isActive) return;

        const noContextMenu = (e: MouseEvent) => e.preventDefault();
        const onVisChange = () => {
            if (!document.hidden) return;
            setStrikes(s => {
                const next = s + 1;
                if (next >= 3) {
                    // Submit to server with whatever responses exist — records the attempt and consumes an attempt slot
                    doSubmitRef.current(responsesRef.current);
                } else {
                    setWarning(
                        `Security violation: Tab switch detected (${next}/3). ` +
                        `Your quiz will be auto-submitted with score 0 at 3 violations.`
                    );
                }
                return next;
            });
        };

        window.addEventListener('contextmenu', noContextMenu);
        document.addEventListener('visibilitychange', onVisChange);
        return () => {
            window.removeEventListener('contextmenu', noContextMenu);
            document.removeEventListener('visibilitychange', onVisChange);
        };
    }, [isActive, onComplete, totalQ]);

    // ── Effect 3: Per-question countdown timer ────────────────
    useEffect(() => {
        if (!isActive || !q?.time_limit_secs) return;
        setTimeLeft(q.time_limit_secs);
        const id = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(id);
                    // Fire advance after the state flush (can't setState inside setState updater)
                    setTimeout(() => advanceRef.current(), 0);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [isActive, currentIdx]); // reset timer per question index

    // ── Callbacks ────────────────────────────────────────────

    const doSubmit = useCallback(async (finalResponses: Record<string, string>) => {
        if (submittedRef.current) return;
        submittedRef.current = true;
        setIsSubmitting(true);
        try {
            const res = await submitQuizAttempt(quizData.quiz.id, finalResponses);
            if (res.success) {
                setResults(res);
                setPhase('done');
                onComplete(res.percentage, res.score === res.total);
            } else {
                toast.error('Submission failed. Please try again.');
                submittedRef.current = false;
                setIsSubmitting(false);
            }
        } catch (e: any) {
            toast.error(e?.message || 'An error occurred during submission.');
            submittedRef.current = false;
            setIsSubmitting(false);
        }
    }, [quizData.quiz.id, onComplete]);

    const advance = useCallback((finalResponses?: Record<string, string>) => {
        const r = finalResponses ?? responses;
        if (currentIdx < totalQ - 1) {
            setCurrentIdx(i => i + 1);
            setChosen(null);
        } else {
            doSubmit(r);
        }
    }, [currentIdx, totalQ, responses, doSubmit]);

    // Keep advanceRef in sync so timer/setTimeout always uses latest
    useEffect(() => { advanceRef.current = advance; }, [advance]);
    // Keep doSubmitRef in sync so violation handler always calls latest version
    useEffect(() => { doSubmitRef.current = doSubmit; }, [doSubmit]);

    const handleSelect = useCallback((optionId: string) => {
        if (chosen !== null || !q || isSubmitting) return;
        setChosen(optionId);
        const updated = { ...responses, [q.id]: optionId };
        setResponses(updated);
        responsesRef.current = updated; // Keep ref in sync for violation handler
        // Snapshot updated before timeout — use advanceRef to avoid stale closure
        const snap = updated;
        setTimeout(() => advanceRef.current(snap), 900);
    }, [chosen, q, responses, isSubmitting]);

    const startQuiz = useCallback(() => {
        submittedRef.current = false;
        responsesRef.current = {};
        setCurrentIdx(0);
        setResponses({});
        setChosen(null);
        setStrikes(0);
        setWarning(null);
        setResults(null);
        setIsSubmitting(false);
        setPhase('active');
    }, []);

    // ── Render ───────────────────────────────────────────────

    // Locked
    if (phase === 'locked') {
        return (
            <div className="max-w-4xl mx-auto py-20 px-4">
                <div className="bg-white border border-slate-100 p-16 md:p-24 rounded-[3.5rem] text-center shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center border border-amber-100 mb-8 text-amber-500">
                            <Lock size={32} />
                        </div>
                        <h3 className="text-3xl font-black uppercase tracking-tight mb-4 text-slate-900">Assessment Locked</h3>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest max-w-md mx-auto leading-loose">
                            {quizData.quiz.lock_reason || 'Complete all preceding modules to unlock this assessment.'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Already completed (came back to a finished lesson)
    if (phase === 'already_complete') {
        return (
            <div className="max-w-4xl mx-auto py-20 px-4 text-center">
                <div className="bg-emerald-50 border border-emerald-100 p-16 rounded-[3.5rem] shadow-xl">
                    <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">Assessment Completed</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">
                        You have already passed this assessment.
                    </p>
                    <Link href="/student">
                        <button className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-indigo-500 transition-all">
                            <ArrowLeft size={14} /> Return to Dashboard
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    // Results screen
    if (phase === 'done') {
        const pct = results?.percentage ?? 0;
        return (
            <QuizResults
                score={results?.score ?? 0}
                total={results?.total ?? totalQ}
                percentage={pct}
                xp={lessonXp}
                xpEarned={results?.xp_earned}
                feedbackData={results?.feedback}
                onRestart={pct < 60 ? startQuiz : undefined}
                violations={strikes}
            />
        );
    }

    // Start / intro screen
    if (phase === 'idle') {
        return (
            <div className="max-w-4xl mx-auto py-6 sm:py-20 px-4">
                <div className="bg-white border border-slate-100 p-8 sm:p-20 rounded-[2.5rem] sm:rounded-[4rem] text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 rounded-2xl sm:rounded-[2rem] flex items-center justify-center mx-auto mb-8 sm:mb-10 text-indigo-600 shadow-xl shadow-indigo-100">
                            <Trophy size={28} />
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-4 text-slate-900 leading-tight">
                            Ready for Assessment?
                        </h2>
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 sm:mb-12 leading-relaxed max-w-sm mx-auto">
                            Answer all questions to earn your XP reward. Questions are shown one at a time in random order.
                        </p>

                        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-12">
                            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100">
                                <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Questions</p>
                                <p className="text-lg sm:text-xl font-black text-slate-900">{totalQ}</p>
                            </div>
                            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100">
                                <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pass Mark</p>
                                <p className="text-lg sm:text-xl font-black text-slate-900">60%</p>
                            </div>
                            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100">
                                <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">XP Reward</p>
                                <p className="text-lg sm:text-xl font-black text-indigo-600">+{lessonXp}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={startQuiz}
                                className="w-full h-14 sm:h-20 bg-slate-950 text-white rounded-2xl sm:rounded-[2rem] font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-200 active:scale-95 group"
                            >
                                Launch Assessment
                                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                            </button>
                            <div className="flex items-center justify-center gap-2 opacity-40">
                                <ShieldAlert size={12} />
                                <p className="text-[8px] font-black uppercase tracking-widest">
                                    Integrity monitoring active · Tab switching will auto-submit
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Active quiz ───────────────────────────────────────────
    if (!q) {
        // No questions edge case
        return (
            <div className="text-center py-20 text-slate-400 font-black uppercase tracking-widest text-xs">
                No questions available for this assessment.
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-8 px-4 sm:px-0">
            {/* Security warning banner */}
            <AnimatePresence>
                {warning && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-rose-500 text-white p-3 sm:p-4 rounded-2xl flex items-center justify-between shadow-xl"
                    >
                        <div className="flex items-center gap-3">
                            <ShieldAlert size={14} />
                            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-snug">{warning}</p>
                        </div>
                        <button onClick={() => setWarning(null)} className="ml-3 opacity-70 hover:opacity-100 transition-opacity text-sm">✕</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {/* Progress */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Progress</p>
                        <span className="text-[10px] font-black text-slate-900">{currentIdx + 1} / {totalQ}</span>
                    </div>
                    <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-600 transition-all duration-700"
                            style={{ width: `${((currentIdx + 1) / totalQ) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Timer */}
                {timeLeft > 0 && (
                    <div className={cn(
                        'p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border shadow-sm flex flex-col justify-center',
                        timeLeft < 10 ? 'border-rose-100 bg-rose-50' : 'bg-white border-slate-100'
                    )}>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Left</p>
                        <div className={cn(
                            'flex items-center gap-2 text-sm sm:text-lg font-black',
                            timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-slate-900'
                        )}>
                            <Timer size={14} /> {timeLeft}s
                        </div>
                    </div>
                )}

                {/* Security status */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center col-span-2 sm:col-span-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Security</p>
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            strikes === 0 ? 'bg-emerald-500' : strikes === 1 ? 'bg-amber-500' : 'bg-rose-500 animate-ping'
                        )} />
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-900">
                            {strikes === 0 ? 'Protected' : `${strikes}/3 Violations`}
                        </span>
                    </div>
                </div>

                {/* XP reward (desktop) */}
                <div className="hidden lg:flex bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex-col justify-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Module Reward</p>
                    <div className="flex items-center gap-2 text-lg font-black text-amber-600">
                        <Star size={16} fill="currentColor" /> +{lessonXp} XP
                    </div>
                </div>
            </div>

            {/* Question card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIdx}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.2 }}
                >
                    <Card className="bg-white border border-slate-100 rounded-[2rem] sm:rounded-[3rem] shadow-xl overflow-hidden">
                        <CardContent className="p-6 sm:p-10 lg:p-16">
                            <div className="flex items-center gap-2 mb-8 sm:mb-12">
                                <Badge className="bg-indigo-600 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black tracking-widest uppercase border-0">
                                    Question {currentIdx + 1}
                                </Badge>
                                <Badge className="bg-amber-50 text-amber-600 px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black tracking-widest uppercase border-amber-100">
                                    +{q.points || 1} pts
                                </Badge>
                            </div>

                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight mb-8 sm:mb-16 leading-tight">
                                {q.text}
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
                                {q.options.map((option, i) => {
                                    const isChosen = chosen === option.id;
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => handleSelect(option.id)}
                                            disabled={chosen !== null || isSubmitting}
                                            className={cn(
                                                'w-full group relative p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl text-left border-2 transition-all duration-300 flex items-center gap-4 sm:gap-6',
                                                isChosen
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900'
                                                    : 'bg-slate-50/50 border-transparent hover:border-indigo-200 hover:bg-white text-slate-700 disabled:cursor-not-allowed'
                                            )}
                                        >
                                            <span className={cn(
                                                'w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-[10px] sm:text-xs font-black shrink-0 transition-all',
                                                isChosen ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white group-hover:bg-indigo-600'
                                            )}>
                                                {String.fromCharCode(65 + i)}
                                            </span>
                                            <span className="text-[12px] sm:text-sm lg:text-base font-black uppercase tracking-tight">
                                                {option.option_text}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {isSubmitting && (
                                <div className="mt-8 flex items-center justify-center gap-4 text-slate-400">
                                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Grading Assessment…</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
