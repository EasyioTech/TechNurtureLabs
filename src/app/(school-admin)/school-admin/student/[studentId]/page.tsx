'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getSchoolStudentDetails } from '@/modules/school-admin/actions';
import { useSchoolTheme, ts, SchoolThemeProvider } from '@/modules/school-admin/theme-context';
import {
    ArrowLeft, User, Mail, GraduationCap, Zap, BookOpen, Clock,
    Target, Trophy, Flame, ChevronRight, Activity, Calendar,
    BarChart2, Star, ShieldCheck, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { handleThumbnailError } from '@/lib/media-client';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

function StudentDetailsContent({ studentId }: { studentId: string }) {
    const { isDark } = useSchoolTheme();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSchoolStudentDetails(studentId).then(res => {
            setData(res);
            setLoading(false);
        });
    }, [studentId]);

    if (loading) return (
        <div className={`min-h-screen flex items-center justify-center ${ts.pageBg(isDark)}`}>
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                </div>
                <p className={`text-sm font-bold animate-pulse ${ts.textMuted(isDark)}`}>Loading Profile...</p>
            </div>
        </div>
    );

    if (!data?.student) return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${ts.pageBg(isDark)}`}>
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <User size={40} className={ts.textMuted(isDark)} />
            </div>
            <h2 className={`text-2xl font-black mb-2 ${ts.textPrimary(isDark)}`}>Student Not Found</h2>
            <p className={`max-w-xs mb-8 ${ts.textSecondary(isDark)}`}>The student record you're looking for might have been removed or moved.</p>
            <Button onClick={() => router.back()} className={`rounded-2xl px-8 h-12 font-bold ${ts.btnPrimary(isDark)}`}>
                Return to Dashboard
            </Button>
        </div>
    );

    const { student, courses, recentAttempts } = data;

    return (
        <div className={`min-h-screen min-w-full ${ts.pageBg(isDark)} transition-colors duration-500 pb-20`}>
            {/* Nav Header */}
            <header className={`sticky top-0 z-50 ${ts.headerBg(isDark)} border-b ${ts.border(isDark)}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-5">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => router.back()} 
                            className={`rounded-2xl w-10 h-10 sm:w-12 sm:h-12 border ${ts.border(isDark)} hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all`}
                        >
                            <ArrowLeft size={20} />
                        </Button>
                        <div className="hidden xs:block">
                            <h1 className={`text-sm sm:text-base font-black tracking-tight ${ts.textPrimary(isDark)}`}>Student Profile</h1>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase font-black tracking-widest ${ts.textMuted(isDark)}`}>Analytics</span>
                                <ChevronRight size={10} className={ts.textMuted(isDark)} />
                                <span className={`text-[10px] uppercase font-black tracking-widest text-indigo-500`}>{student.full_name}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <Badge className={`px-4 py-1.5 rounded-full border-0 text-[10px] font-black shadow-sm ${student.is_active ? ts.live(isDark) : ts.danger(isDark)}`}>
                            {student.is_active ? '● ACTIVE' : '○ DEACTIVATED'}
                        </Badge>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-8 sm:space-y-12">
                {/* Profile Banner */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-[32px] sm:rounded-[48px] p-6 sm:p-12 relative overflow-hidden border ${ts.card(isDark)} group`}
                >
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/[0.03] to-transparent select-none pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />
                    
                    <div className="flex flex-col xl:flex-row items-center xl:items-center gap-8 sm:gap-12 relative z-10">
                        {/* Avatar */}
                        <div className="relative group/avatar">
                            <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-[32px] sm:rounded-[40px] flex items-center justify-center text-4xl sm:text-5xl font-black shadow-2xl transition-transform duration-500 group-hover/avatar:scale-105 ${isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-600 text-white shadow-indigo-600/20'}`}>
                                {student.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white border-4 border-white dark:border-[#11151c] shadow-xl">
                                <ShieldCheck size={20} />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center xl:text-left space-y-6">
                            <div className="space-y-2">
                                <h2 className={`text-3xl sm:text-5xl font-black tracking-tighter ${ts.textPrimary(isDark)}`}>{student.full_name}</h2>
                                <div className="flex flex-wrap items-center justify-center xl:justify-start gap-4 sm:gap-8 mt-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                            <Mail size={16} className="text-indigo-500" />
                                        </div>
                                        <span className={`text-sm font-bold ${ts.textSecondary(isDark)}`}>{student.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                            <GraduationCap size={16} className="text-indigo-500" />
                                        </div>
                                        <span className={`text-sm font-bold ${ts.textSecondary(isDark)}`}>{student.class_name || 'No Class Assigned'}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                            <Calendar size={16} className="text-indigo-500" />
                                        </div>
                                        <span className={`text-sm font-bold ${ts.textSecondary(isDark)}`}>Joined {new Date(student.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center xl:justify-start gap-3">
                                {student.bio && <p className={`max-w-2xl text-sm leading-relaxed ${ts.textMuted(isDark)} italic`}>"{student.bio}"</p>}
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 xs:grid-cols-4 xl:grid-cols-2 gap-3 sm:gap-4 w-full xl:w-auto">
                            <StatPill icon={Zap} label="Total XP" value={student.total_xp.toLocaleString()} color="amber" />
                            <StatPill icon={Trophy} label="Level" value={student.level} color="indigo" />
                            <StatPill icon={Flame} label="Streak" value={`${student.current_streak}d`} color="orange" />
                            <StatPill icon={Target} label="Global Rank" value={`#${student.rank || '—'}`} color="emerald" />
                        </div>
                    </div>
                </motion.div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    <Card metric label="Lessons Completed" value={student.lessons_completed || 0} icon={BookOpen} color="blue" delay={0.1} />
                    <Card metric label="Quizzes Passed" value={data.quizCount || 0} icon={ShieldCheck} color="emerald" delay={0.2} />
                    <Card metric label="Avg. Mastery Score" value={`${data.avgScore || 0}%`} icon={Star} color="amber" delay={0.3} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Course Progress List */}
                    <div className="lg:col-span-8 space-y-6 sm:space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className={`text-xl sm:text-2xl font-black tracking-tight flex items-center gap-3 ${ts.textPrimary(isDark)}`}>
                                <BarChart2 className="text-indigo-500" size={28} />
                                Enrolled Courses
                            </h3>
                            <Badge variant="outline" className={`rounded-xl px-4 py-1 border-2 border-indigo-500/20 text-indigo-500 font-black text-[10px]`}>
                                {courses.length} TOTAL
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {courses.length > 0 ? courses.map((c: any, idx: number) => (
                                <motion.div 
                                    key={c.id} 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * idx }}
                                    className={`rounded-[32px] p-5 sm:p-6 border flex flex-col xs:flex-row items-start xs:items-center gap-5 sm:gap-6 group hover:-translate-y-1 transition-all duration-300 ${ts.card(isDark)}`}
                                >
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-white/5 border border-white/10">
                                        {c.thumbnail_url ? (
                                            <img src={c.thumbnail_url} alt={c.title} decoding="async" onError={handleThumbnailError} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-indigo-500 bg-indigo-500/5">
                                                <BookOpen size={28} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 w-full">
                                        <h4 className={`text-base font-black truncate group-hover:text-indigo-500 transition-colors ${ts.textPrimary(isDark)}`}>{c.title}</h4>
                                        <div className="flex items-center justify-between mt-4 mb-2">
                                            <span className={`text-[11px] font-black uppercase tracking-tighter ${ts.textMuted(isDark)}`}>{c.progress_pct}% COMPLETED</span>
                                            <span className={`text-[11px] font-black ${c.completed_at ? 'text-emerald-500' : 'text-indigo-500'}`}>
                                                {c.completed_at ? 'CERTIFIED' : 'ACTIVE'}
                                            </span>
                                        </div>
                                        <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                            <motion.div 
                                                initial={{ width: 0 }} 
                                                animate={{ width: `${c.progress_pct}%` }} 
                                                className={`h-full rounded-full ${c.completed_at ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className={`col-span-2 py-16 rounded-[40px] border-2 border-dashed ${ts.border(isDark)} flex flex-col items-center justify-center text-center opacity-60`}>
                                    <BookOpen size={48} className="text-slate-400 mb-4" />
                                    <p className={`font-black text-lg ${ts.textMuted(isDark)}`}>Not Enrolled in Any Courses</p>
                                    <p className={`text-xs mt-1 ${ts.textMuted(isDark)}`}>Student has not started any learning modules yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Side Panel: Recent Activity */}
                    <div className="lg:col-span-4 space-y-6 sm:space-y-8">
                        <div className="flex items-center gap-3">
                            <Activity className="text-indigo-500" size={28} />
                            <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>Recent Quizzes</h3>
                        </div>

                        <div className={`rounded-[32px] border ${ts.card(isDark)} overflow-hidden`}>
                            <div className="p-2 space-y-1">
                                {recentAttempts && recentAttempts.length > 0 ? recentAttempts.map((at: any, idx: number) => (
                                    <div key={at.id} className={`p-4 rounded-2xl flex items-center justify-between transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${at.passed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                {at.score_pct}%
                                            </div>
                                            <div>
                                                <p className={`text-xs font-black ${ts.textPrimary(isDark)} truncate max-w-[120px]`}>Attempt #{at.attempt_number}</p>
                                                <p className={`text-[10px] font-bold ${ts.textMuted(isDark)}`}>{new Date(at.completed_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <Badge className={`border-0 rounded-lg text-[10px] uppercase font-black px-2 py-1 shadow-none ${at.passed ? ts.live(isDark) : ts.danger(isDark)}`}>
                                            {at.passed ? 'PASSED' : 'FAILED'}
                                        </Badge>
                                    </div>
                                )) : (
                                    <div className="py-12 px-6 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                                            <Target className="text-slate-400" size={20} />
                                        </div>
                                        <p className={`text-sm font-black ${ts.textMuted(isDark)}`}>No Recent Activity</p>
                                        <p className={`text-[10px] mt-2 font-bold leading-relaxed px-4 ${ts.textMuted(isDark)}`}>Wait for the student to complete their first quiz to see scores here.</p>
                                    </div>
                                )}
                            </div>
                            
                            {recentAttempts && recentAttempts.length > 0 && (
                                <div className={`p-4 border-t ${ts.border(isDark)} text-center`}>
                                    <Button variant="ghost" className={`w-full text-[10px] font-black uppercase tracking-widest ${ts.textMuted(isDark)} hover:text-indigo-500`}>
                                        View Full History
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatPill({ icon: Icon, label, value, color }: any) {
    const { isDark } = useSchoolTheme();
    const colors: any = {
        amber: 'text-amber-500 bg-amber-500/10',
        indigo: 'text-indigo-500 bg-indigo-500/10',
        orange: 'text-orange-500 bg-orange-500/10',
        emerald: 'text-emerald-500 bg-emerald-500/10',
    };
    return (
        <div className={`p-4 sm:p-5 rounded-[24px] flex-1 min-w-[110px] transition-all duration-300 ${isDark ? 'bg-white/[0.03] border border-white/5' : 'bg-white border border-slate-100 shadow-sm'} hover:border-indigo-500/30`}>
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>
                <Icon size={18} fill={color === 'amber' ? 'currentColor' : 'none'} />
            </div>
            <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-none mb-2 ${ts.textMuted(isDark)}`}>{label}</p>
            <p className={`text-xl sm:text-2xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>{value}</p>
        </div>
    );
}

function Card({ label, value, icon: Icon, color, metric, delay = 0 }: any) {
    const { isDark } = useSchoolTheme();
    const colors: any = {
        blue: 'text-blue-500 bg-blue-500/10',
        emerald: 'text-emerald-500 bg-emerald-500/10',
        amber: 'text-amber-500 bg-amber-500/10',
    };
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={`p-6 sm:p-8 rounded-[36px] border flex items-center gap-6 group hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-500/20 transition-all duration-300 ${ts.card(isDark)}`}
        >
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${colors[color]}`}>
                <Icon size={32} />
            </div>
            <div>
                <p className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest mb-1.5 ${ts.textMuted(isDark)}`}>{label}</p>
                <p className={`text-3xl sm:text-4xl font-black tracking-tighter ${ts.textPrimary(isDark)}`}>{value}</p>
            </div>
        </motion.div>
    );
}

export default function StudentPage({ params }: { params: Promise<{ studentId: string }> }) {
    const { studentId } = use(params);
    return (
        <SchoolThemeProvider>
            <StudentDetailsContent studentId={studentId} />
        </SchoolThemeProvider>
    );
}
