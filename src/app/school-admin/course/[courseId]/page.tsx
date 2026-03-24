'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft, BookOpen, Users, Clock, Star, Trophy, Flame,
    Play, FileText, Video, ListChecks, Sparkles, BarChart3,
    Target, Award, ChevronRight, Activity, Calendar, ShieldCheck, Zap
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { fetchSchoolAdminCourseData } from '@/modules/school-admin/actions';
import { useSchoolTheme, ts, SchoolThemeProvider } from '@/modules/school-admin/theme-context';

type Course = {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    published: boolean;
    grade: number | null;
    all_grades: boolean;
};

type Lesson = {
    id: string;
    title: string;
    sequence_index: number;
    content_type: string;
    duration: number;
    xp_reward: number;
};

type StudentProgress = {
    student_id: string;
    student_name: string;
    lessons_completed: number;
    total_xp: number;
    avg_score: number;
    last_activity: string | null;
};

function CourseDetailsContent({ schoolId, courseId }: { schoolId: string; courseId: string }) {
    const { isDark } = useSchoolTheme();
    const router = useRouter();
    const [course, setCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
    const [stats, setStats] = useState({
        totalEnrolled: 0,
        avgCompletion: 0,
        avgScore: 0,
        totalXpEarned: 0
    });
    const [loading, setLoading] = useState(true);

    async function fetchCourseData() {
        if (!schoolId || !courseId) return;
        setLoading(true);

        try {
            const data = await fetchSchoolAdminCourseData(schoolId, courseId as string);

            if (data.course) setCourse(data.course as any);
            setLessons(data.lessonsData as any[]);

            const studentsData = data.studentsData;
            const progressData = data.progressData;

            if (studentsData && data.lessonsData) {
                const progressByStudent = new Map<string, { completed: number; scores: number[]; lastActivity: string | null }>();

                (progressData || []).forEach((p: any) => {
                    if (!progressByStudent.has(p.user_id)) {
                        progressByStudent.set(p.user_id, { completed: 0, scores: [], lastActivity: null });
                    }
                    const entry = progressByStudent.get(p.user_id)!;
                    if (p.completed_at != null) entry.completed++;
                    const score = p.xp_earned != null ? Number(p.xp_earned) : null;
                    if (score != null) entry.scores.push(score);
                    const updatedStr = p.updated_at instanceof Date
                        ? p.updated_at.toISOString()
                        : (p.updated_at as string | null);
                    if (!entry.lastActivity || (updatedStr && updatedStr > entry.lastActivity)) {
                        entry.lastActivity = updatedStr;
                    }
                });

                const studentProgressList: StudentProgress[] = studentsData
                    .filter(s => progressByStudent.has(s.id))
                    .map(s => {
                        const prog = progressByStudent.get(s.id)!;
                        return {
                            student_id: s.id,
                            student_name: s.full_name,
                            lessons_completed: prog.completed,
                            total_xp: s.total_xp || 0,
                            avg_score: prog.scores.length > 0
                                ? Math.round(prog.scores.reduce((a: number, b: number) => a + b, 0) / prog.scores.length)
                                : 0,
                            last_activity: prog.lastActivity
                        };
                    })
                    .sort((a, b) => (b.lessons_completed || 0) - (a.lessons_completed || 0));

                setStudentProgress(studentProgressList);

                const totalEnrolled = studentProgressList.length;
                const totalLessonsCount = (data.lessonsData as any[]).length;
                const avgCompletion = totalEnrolled > 0 && totalLessonsCount > 0
                    ? Math.round((studentProgressList.reduce((a, s) => a + s.lessons_completed, 0) / (totalEnrolled * totalLessonsCount)) * 100)
                    : 0;
                const allScores = studentProgressList.flatMap(s => s.avg_score > 0 ? [s.avg_score] : []);
                const avgScore = allScores.length > 0
                    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
                    : 0;
                const totalXpEarned = studentProgressList.reduce((a, s) => a + s.total_xp, 0);

                setStats({ totalEnrolled, avgCompletion, avgScore, totalXpEarned });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCourseData();
    }, [courseId, schoolId]);

    const getLessonIcon = (type: string) => {
        switch (type) {
            case 'video': return Video;
            case 'youtube': return Play;
            case 'mcq': return ListChecks;
            default: return FileText;
        }
    };

    if (loading) return (
        <div className={`min-h-screen flex items-center justify-center ${ts.pageBg(isDark)}`}>
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                </div>
                <p className={`text-sm font-bold animate-pulse ${ts.textMuted(isDark)}`}>Loading Curriculum...</p>
            </div>
        </div>
    );

    if (!course) return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${ts.pageBg(isDark)}`}>
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <BookOpen size={40} className={ts.textMuted(isDark)} />
            </div>
            <h2 className={`text-2xl font-black mb-2 ${ts.textPrimary(isDark)}`}>Course Not Found</h2>
            <p className={`max-w-xs mb-8 ${ts.textSecondary(isDark)}`}>The curriculum module you're looking for might have been deprecated or moved.</p>
            <Button onClick={() => router.back()} className={`rounded-2xl px-8 h-12 font-bold ${ts.btnPrimary(isDark)}`}>
                Return to Dashboard
            </Button>
        </div>
    );

    return (
        <div className={`min-h-screen min-w-full ${ts.pageBg(isDark)} pb-20 transition-colors duration-500`}>
            {/* Header */}
            <header className={`sticky top-0 z-50 ${ts.headerBg(isDark)} border-b ${ts.border(isDark)}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => router.back()} 
                            className={`rounded-2xl w-10 min-w-[40px] h-10 border ${ts.border(isDark)} hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all`}
                        >
                            <ArrowLeft size={18} />
                        </Button>
                        <div className="hidden xs:block">
                            <h1 className={`text-sm sm:text-base font-black tracking-tight ${ts.textPrimary(isDark)}`}>Course Insights</h1>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase font-black tracking-widest ${ts.textMuted(isDark)}`}>Modules</span>
                                <ChevronRight size={10} className={ts.textMuted(isDark)} />
                                <span className={`text-[10px] uppercase font-black tracking-widest text-indigo-500`}>{course.title}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <Badge className={`px-4 py-1.5 rounded-full border-0 text-[10px] font-black shadow-sm ${course.published ? ts.live(isDark) : ts.draft(isDark)}`}>
                            {course.published ? '● PUBLISHED' : '○ DRAFT'}
                        </Badge>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-8 sm:space-y-12">
                {/* Course Banner */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-[32px] sm:rounded-[48px] p-6 lg:p-12 relative overflow-hidden border ${ts.card(isDark)} group`}
                >
                    <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-indigo-500/[0.03] to-transparent select-none pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />
                    
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">
                        {/* Course Thumbnail */}
                        <div className="relative group/thumb w-full lg:w-[400px]">
                            <div className={`w-full aspect-video rounded-[32px] overflow-hidden border ${ts.border(isDark)} shadow-2xl transition-transform duration-700 group-hover/thumb:scale-[1.02]`}>
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                                        <BookOpen size={48} className="text-indigo-500" strokeWidth={1} />
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white border-4 border-white dark:border-[#11151c] shadow-xl">
                                <Award size={24} />
                            </div>
                        </div>

                        {/* Course Info */}
                        <div className="flex-1 space-y-6">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <Badge variant="outline" className={`rounded-xl px-4 py-1 border-2 border-indigo-500/20 text-indigo-500 font-black text-[10px]`}>
                                        {course.all_grades ? 'UNIVERSAL' : `GRADE ${course.grade}`}
                                    </Badge>
                                    <Badge variant="outline" className={`rounded-xl px-4 py-1 border-2 border-emerald-500/20 text-emerald-500 font-black text-[10px]`}>
                                        {lessons.length} MODALITIES
                                    </Badge>
                                </div>
                                <h2 className={`text-3xl sm:text-5xl font-black tracking-tighter ${ts.textPrimary(isDark)} leading-none`}>{course.title}</h2>
                                <p className={`text-sm sm:text-base font-medium leading-relaxed max-w-2xl ${ts.textSecondary(isDark)}`}>
                                    {course.description || 'This course curriculum has no detailed description. Please contact the content creator for more details on the learning objectives.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 xs:grid-cols-4 gap-3 sm:gap-4 pt-4">
                                <StatCardPill icon={Users} label="Enrolled" value={stats.totalEnrolled} color="indigo" />
                                <StatCardPill icon={Target} label="Completion" value={`${stats.avgCompletion}%`} color="emerald" />
                                <StatCardPill icon={BarChart3} label="Avg Score" value={`${stats.avgScore}%`} color="amber" />
                                <StatCardPill icon={Star} label="Total XP" value={stats.totalXpEarned.toLocaleString()} color="violet" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
                    {/* Curriculum Sidebar */}
                    <div className="lg:col-span-4 space-y-6 sm:space-y-8">
                        <div className="flex items-center gap-3">
                            <BookOpen className="text-indigo-500" size={28} />
                            <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>Curriculum</h3>
                        </div>

                        <div className={`rounded-[32px] border ${ts.card(isDark)} overflow-hidden`}>
                            <div className="p-2 space-y-1">
                                {lessons.length > 0 ? lessons.map((lesson, idx) => {
                                    const Icon = getLessonIcon(lesson.content_type);
                                    return (
                                        <div key={lesson.id} className={`p-4 rounded-2xl flex items-center justify-between transition-all group/item hover:bg-indigo-500/5`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${isDark ? 'bg-indigo-500/10 text-indigo-400 group-hover/item:bg-indigo-500 group-hover/item:text-white' : 'bg-indigo-50 text-indigo-600 group-hover/item:bg-indigo-600 group-hover/item:text-white'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-black ${ts.textPrimary(isDark)} truncate max-w-[160px]`}>{lesson.title}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Icon size={12} className="text-indigo-500" />
                                                        <span className={`text-[10px] font-bold ${ts.textMuted(isDark)} uppercase tracking-wider`}>
                                                            {lesson.content_type} • {lesson.duration}m
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge className={`border-0 rounded-lg text-[10px] font-black px-2 py-1 shadow-none ${ts.accentSoft(isDark)}`}>
                                                {lesson.xp_reward} XP
                                            </Badge>
                                        </div>
                                    );
                                }) : (
                                    <div className="py-12 px-6 text-center">
                                        <p className={`text-sm font-black ${ts.textMuted(isDark)}`}>No Modules Listed</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Student Progress Table */}
                    <div className="lg:col-span-8 space-y-6 sm:space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Users className="text-indigo-500" size={28} />
                                <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>Student Insights</h3>
                            </div>
                            <Button variant="ghost" className={`text-[10px] font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>
                                Export Statistics
                            </Button>
                        </div>

                        <div className={`rounded-[32px] border ${ts.card(isDark)} overflow-hidden`}>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px]">
                                    <thead>
                                        <tr className={`border-b ${ts.border(isDark)} ${isDark ? 'bg-white/[0.01]' : 'bg-slate-50/50'}`}>
                                            <th className={`p-6 text-left text-[11px] font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>Student Identity</th>
                                            <th className={`p-6 text-left text-[11px] font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>Curriculum Progress</th>
                                            <th className={`p-6 text-left text-[11px] font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>Final Mastery</th>
                                            <th className={`p-6 text-left text-[11px] font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>XP Asset</th>
                                            <th className={`p-6 text-right text-[11px] font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>Last Active</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${ts.border(isDark)}`}>
                                        {studentProgress.length > 0 ? studentProgress.map((student) => {
                                            const progressPercent = lessons.length > 0
                                                ? Math.round((student.lessons_completed / lessons.length) * 100)
                                                : 0;
                                            return (
                                                <tr 
                                                    key={student.student_id} 
                                                    onClick={() => router.push(`/school-admin/student/${student.student_id}`)}
                                                    className={`group cursor-pointer transition-colors ${ts.cardHover(isDark)}`}
                                                >
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-[11px] shadow-sm transition-transform group-hover:scale-110 ${isDark ? 'bg-white/5 border border-white/5 text-indigo-400' : 'bg-slate-100 border border-slate-200 text-indigo-600'}`}>
                                                                {student.student_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                            </div>
                                                            <span className={`text-[13px] font-black tracking-tight ${ts.textPrimary(isDark)}`}>{student.student_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`flex-1 min-w-[80px] h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                                                <motion.div 
                                                                    initial={{ width: 0 }} 
                                                                    animate={{ width: `${progressPercent}%` }} 
                                                                    className={`h-full rounded-full bg-indigo-500`} 
                                                                />
                                                            </div>
                                                            <span className={`text-[11px] font-black ${ts.textPrimary(isDark)}`}>{progressPercent}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={`text-[13px] font-black ${student.avg_score >= 80 ? 'text-emerald-500' : student.avg_score >= 60 ? 'text-indigo-500' : ts.textMuted(isDark)}`}>
                                                            {student.avg_score > 0 ? `${student.avg_score}%` : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-1.5 text-amber-500">
                                                            <Zap size={14} fill="currentColor" />
                                                            <span className="text-[13px] font-black">{student.total_xp.toLocaleString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-right">
                                                        <p className={`text-[11px] font-bold ${ts.textMuted(isDark)}`}>
                                                            {student.last_activity ? new Date(student.last_activity).toLocaleDateString() : 'N/A'}
                                                        </p>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan={5} className="p-12 text-center text-sm font-bold opacity-40">No interactive activity tracked yet</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCardPill({ icon: Icon, label, value, color }: any) {
    const { isDark } = useSchoolTheme();
    const colors: any = {
        indigo: 'text-indigo-500 bg-indigo-500/10',
        emerald: 'text-emerald-500 bg-emerald-500/10',
        amber: 'text-amber-500 bg-amber-500/10',
        violet: 'text-violet-500 bg-violet-500/10',
    };
    return (
        <div className={`p-4 sm:p-5 rounded-[24px] flex-1 min-w-[110px] transition-all duration-300 border ${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-100 shadow-sm'} hover:border-indigo-500/30`}>
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>
                <Icon size={18} fill={color === 'amber' ? 'currentColor' : 'none'} />
            </div>
            <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-none mb-2 ${ts.textMuted(isDark)}`}>{label}</p>
            <p className={`text-xl sm:text-2xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>{value}</p>
        </div>
    );
}

export default function SchoolAdminCourseView() {
    const params = useParams();
    const { user } = useAuth();
    const schoolId = (user as any)?.school_id;
    const courseId = params?.courseId as string;

    return (
        <SchoolThemeProvider>
            <CourseDetailsContent schoolId={schoolId} courseId={courseId} />
        </SchoolThemeProvider>
    );
}
