'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { SchoolCourseMetric } from '../../types';
import { useSchoolTheme, ts } from '../../theme-context';
import { BookOpen, Users, CheckCircle2, Zap } from 'lucide-react';

interface CoursesTabProps { courseMetrics: SchoolCourseMetric[]; }

export function SchoolCoursesTab({ courseMetrics }: CoursesTabProps) {
    const { isDark } = useSchoolTheme();

    if (courseMetrics.length === 0) {
        return (
            <div className={`rounded-[24px] border py-20 text-center ${ts.card(isDark)}`}>
                <BookOpen size={32} className={`mx-auto mb-3 ${ts.textMuted(isDark)}`} />
                <p className={`font-black ${ts.textPrimary(isDark)}`}>No Courses Yet</p>
                <p className={`text-[12px] mt-1 ${ts.textMuted(isDark)}`}>Students haven't enrolled in any courses yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {courseMetrics.map((c, i) => (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className={`rounded-[24px] border overflow-hidden shadow-lg shadow-black/5 flex flex-col ${ts.card(isDark)}`}>
                        {/* Thumbnail */}
                        <div className={`h-32 flex items-center justify-center ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'} relative`}>
                            {c.thumbnail_url
                                ? <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                                : <BookOpen size={36} className={ts.textMuted(isDark)} />
                            }
                            <div className="absolute top-3 left-3">
                                <Badge className={`text-[9px] font-black ${c.is_published ? ts.live(isDark) : ts.draft(isDark)}`}>
                                    {c.is_published ? 'LIVE' : 'DRAFT'}
                                </Badge>
                            </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col gap-3">
                            <div>
                                <h4 className={`font-black text-[14px] tracking-tight line-clamp-2 ${ts.textPrimary(isDark)}`}>{c.title}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className={`text-[10px] font-bold flex items-center gap-1 ${ts.textMuted(isDark)}`}><BookOpen size={10} />{c.lesson_count} lessons</span>
                                    <span className={`text-[10px] font-bold flex items-center gap-1 ${ts.textMuted(isDark)}`}><Users size={10} />{c.enrolled_count} enrolled</span>
                                </div>
                            </div>

                            {/* Completion bar */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>Completion</p>
                                    <p className={`text-[12px] font-black ${isDark ? 'text-lime-400' : 'text-slate-900'}`}>{c.completion_rate}%</p>
                                </div>
                                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${c.completion_rate}%` }} transition={{ delay: 0.3 + i * 0.07, duration: 0.8 }}
                                        className={`h-full rounded-full ${isDark ? 'bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.3)]' : 'bg-slate-900'}`} />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-1 mt-auto">
                                <Badge className={`text-[10px] font-black flex items-center gap-1 ${isDark ? 'bg-violet-400/10 text-violet-400' : 'bg-violet-50 text-violet-700'}`}>
                                    <Zap size={9} fill="currentColor" />{c.avg_xp} avg XP
                                </Badge>
                                <Badge className={`text-[10px] font-black ${isDark ? 'bg-sky-400/10 text-sky-400' : 'bg-sky-50 text-sky-700'}`}>
                                    {c.total_time_mins}m total time
                                </Badge>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
