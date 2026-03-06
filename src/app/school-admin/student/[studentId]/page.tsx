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
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
        </div>
    );

    if (!data?.student) return (
        <div className={`min-h-screen flex flex-col items-center justify-center ${ts.pageBg(isDark)}`}>
            <p className={ts.textPrimary(isDark)}>Student not found</p>
            <Button variant="ghost" className="mt-4" onClick={() => router.back()}>Go Back</Button>
        </div>
    );

    const { student, courses, records } = data;

    return (
        <div className={`min-h-screen min-w-full ${ts.pageBg(isDark)} transition-colors duration-300`}>
            {/* Header */}
            <header className={`sticky top-0 z-50 ${ts.headerBg(isDark)} border-b ${ts.border(isDark)}`}>
                <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className={`rounded-xl ${ts.btnOutline(isDark)} border-0`}>
                            <ArrowLeft size={20} />
                        </Button>
                        <div>
                            <h1 className={`text-lg font-black tracking-tight ${ts.textPrimary(isDark)}`}>Student Profile</h1>
                            <p className={`text-[10px] uppercase font-black tracking-widest ${ts.textMuted(isDark)}`}>Analytics / {student.full_name}</p>
                        </div>
                    </div>
                    <Badge className={`px-3 py-1 rounded-full border-0 text-[10px] font-black ${student.is_active ? ts.live(isDark) : ts.danger(isDark)}`}>
                        {student.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                    </Badge>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
                {/* Profile Banner */}
                <div className={`rounded-[40px] p-8 sm:p-12 relative overflow-hidden border ${ts.card(isDark)}`}>
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-500 opacity-[0.03] select-none pointer-events-none" />

                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10 relative z-10">
                        <div className={`w-32 h-32 rounded-[40px] flex items-center justify-center text-4xl font-black shadow-2xl ${isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-600 text-white shadow-indigo-600/20'}`}>
                            {student.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <h2 className={`text-4xl font-black tracking-tighter ${ts.textPrimary(isDark)}`}>{student.full_name}</h2>
                                <div className="flex flex-wrap items-center gap-6 mt-2">
                                    <div className="flex items-center gap-2">
                                        <Mail size={16} className="text-indigo-500" />
                                        <span className={`text-[13px] font-bold ${ts.textSecondary(isDark)}`}>{student.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <GraduationCap size={16} className="text-indigo-500" />
                                        <span className={`text-[13px] font-bold ${ts.textSecondary(isDark)}`}>{student.grade_name || 'No Grade Assigned'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-indigo-500" />
                                        <span className={`text-[13px] font-bold ${ts.textSecondary(isDark)}`}>Joined {new Date(student.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-4">
                            <StatPill icon={Zap} label="Total XP" value={student.total_xp.toLocaleString()} color="amber" />
                            <StatPill icon={Trophy} label="Level" value={student.level} color="indigo" />
                            <StatPill icon={Flame} label="Streak" value={`${student.current_streak}d`} color="orange" />
                            <StatPill icon={Target} label="Rank" value={`#${student.rank || '—'}`} color="emerald" />
                        </div>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card metric label="Lessons Done" value={student.lessons_completed} icon={BookOpen} color="blue" />
                    <Card metric label="Quizzes Taken" value={data.quizCount || 0} icon={Target} color="emerald" />
                    <Card metric label="Avg. Score" value={`${data.avgScore || 0}%`} icon={Star} color="amber" />
                </div>

                {/* Course Progress List */}
                <div className="space-y-6">
                    <h3 className={`text-xl font-black tracking-tight flex items-center gap-3 ${ts.textPrimary(isDark)}`}>
                        <BarChart2 className="text-indigo-500" size={24} />
                        Enrolled Courses & Progress
                    </h3>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {courses.length > 0 ? courses.map((c: any) => (
                            <div key={c.id} className={`rounded-[32px] p-6 border flex items-center gap-6 group hover:-translate-y-1 transition-all ${ts.card(isDark)}`}>
                                <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-white/5">
                                    {c.thumbnail_url ? (
                                        <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-indigo-500">
                                            <BookOpen size={24} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-[15px] font-black truncate group-hover:text-indigo-500 transition-colors ${ts.textPrimary(isDark)}`}>{c.title}</h4>
                                    <div className="flex items-center justify-between mt-3 mb-1.5">
                                        <span className={`text-[11px] font-black ${ts.textMuted(isDark)}`}>{c.progress_pct}% Completed</span>
                                        <span className={`text-[11px] font-black ${ts.textPrimary(isDark)}`}>{c.completed_at ? 'DONE' : 'IN PROGRESS'}</span>
                                    </div>
                                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${c.progress_pct}%` }} className="h-full bg-indigo-500 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-2 py-12 text-center">
                                <p className={ts.textMuted(isDark)}>Not enrolled in any courses yet.</p>
                            </div>
                        )}
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
        <div className={`p-4 rounded-3xl min-w-[120px] ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-slate-100 shadow-sm'}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
                <Icon size={16} fill={color === 'amber' ? 'currentColor' : 'none'} />
            </div>
            <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 ${ts.textMuted(isDark)}`}>{label}</p>
            <p className={`text-[18px] font-black tracking-tight ${ts.textPrimary(isDark)}`}>{value}</p>
        </div>
    );
}

function Card({ label, value, icon: Icon, color, metric }: any) {
    const { isDark } = useSchoolTheme();
    const colors: any = {
        blue: 'text-blue-500 bg-blue-500/10',
        emerald: 'text-emerald-500 bg-emerald-500/10',
        amber: 'text-amber-500 bg-amber-500/10',
    };
    return (
        <div className={`p-8 rounded-[36px] border flex items-center gap-6 ${ts.card(isDark)}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors[color]}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className={`text-[11px] font-black uppercase tracking-widest mb-1.5 ${ts.textMuted(isDark)}`}>{label}</p>
                <p className={`text-3xl font-black tracking-tighter ${ts.textPrimary(isDark)}`}>{value}</p>
            </div>
        </div>
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
