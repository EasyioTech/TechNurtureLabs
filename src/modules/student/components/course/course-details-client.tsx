'use client';

import React from 'react';
import { CourseDetailsHeader } from '@/modules/student/components/course/course-header';
import { LessonRow } from '@/modules/student/components/course/lesson-row';
import { StatBox } from '@/modules/student/components/stat-box';
import { Badge } from '@/components/ui/badge';
import { 
    BookOpen, Clock, Star, Trophy, Zap, ChevronRight, Award, 
    ArrowRight, Activity, ShieldCheck, Target, Layers, ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface CourseDetailsClientProps {
  initialData: {
    course: any;
    lessons: any[];
    enrolledCount: number;
  }
}

export function CourseDetailsClient({ initialData }: CourseDetailsClientProps) {
    const { course, lessons, enrolledCount } = initialData;

    const completedCount = lessons.filter(l => l.status === 'completed').length;
    const totalXP = lessons.reduce((acc, l) => acc + (l.xp_reward || 0), 0);
    const earnedXP = lessons.filter(l => l.status === 'completed').reduce((acc, l) => acc + (l.xp_reward || 0), 0);
    const progress = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;
    const totalDuration = lessons.reduce((acc, l) => acc + (l.duration || 10), 0);
    const nextLesson = lessons.find(l => l.status === 'available') || lessons.find(l => l.status === 'current') || lessons[0];

    return (
        <div className="min-h-screen bg-slate-50/10 pb-32 animate-in fade-in duration-700 selection:bg-indigo-100 selection:text-indigo-900">
            <CourseDetailsHeader title={course?.title || 'Learning Course'} progress={progress} />

            <main className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
                    {/* Course Overview */}
                    <div className="lg:col-span-8 space-y-12">
                        <section>
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="relative group rounded-[2.5rem] sm:rounded-[4rem] overflow-hidden bg-slate-950 aspect-square sm:aspect-video mb-8 sm:mb-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/5"
                            >
                                <img
                                    src={course?.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200'}
                                    alt={course?.title}
                                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[2000ms] ease-out"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                                
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.2)_0%,_transparent_50%)]" />

                                <div className="absolute bottom-6 left-6 right-6 sm:bottom-16 sm:left-16 sm:right-16">
                                    <motion.div 
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="flex flex-wrap items-center gap-3 mb-6 sm:mb-10"
                                    >
                                        <Badge className="bg-indigo-600 text-white border-0 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] backdrop-blur-xl shadow-2xl shadow-indigo-950/60">
                                            {course?.all_grades ? 'All Students' : `Grade ${course?.grade} Level`}
                                        </Badge>
                                        <Badge className="bg-white/5 border border-white/10 text-white/50 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] backdrop-blur-xl">
                                            {enrolledCount} Enrolled
                                        </Badge>
                                    </motion.div>
                                    
                                    <motion.h1 
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-3xl sm:text-4xl lg:text-6xl font-black text-white tracking-tighter uppercase mb-4 sm:mb-6 leading-[0.95] sm:leading-[0.9] max-w-4xl"
                                    >
                                        {course?.title}
                                    </motion.h1>
                                    
                                    <motion.p 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="text-slate-400 text-[10px] sm:text-sm lg:text-xl font-black uppercase tracking-widest max-w-2xl line-clamp-2 leading-relaxed opacity-60"
                                    >
                                        {course?.description || 'A comprehensive course designed to help you master new skills and achieve academic excellence.'}
                                    </motion.p>
                                </div>
                            </motion.div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
                                <DetailStat icon={Layers} label="Lessons" value={lessons.length} color="text-indigo-400" />
                                <DetailStat icon={Clock} label="Total Time" value={`${totalDuration}m`} color="text-sky-400" />
                                <DetailStat icon={Star} label="Total XP" value={totalXP.toLocaleString()} color="text-amber-400" />
                                <DetailStat icon={ShieldCheck} label="Verification" value="Verified" color="text-emerald-400" />
                            </div>
                        </section>

                        <section className="animate-in slide-in-from-bottom-12 duration-1000 delay-300">
                            <div className="flex items-end justify-between mb-10 pb-6 border-b border-slate-100">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tighter flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-3xl bg-slate-950 flex items-center justify-center text-white shadow-xl">
                                            <Zap size={22} />
                                        </div>
                                        Course Content
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3 ml-16">Follow your learning path</p>
                                </div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">
                                    {lessons.length} Lessons Available
                                </p>
                            </div>

                            <div className="space-y-6">
                                {lessons.map((lesson, index) => (
                                    <LessonRow 
                                        key={lesson.id} 
                                        lesson={lesson} 
                                        index={index} 
                                    />
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Learning Sidebar */}
                    <div className="lg:col-span-4 lg:sticky lg:top-40 h-fit space-y-8">
                        <section className="bg-white border border-slate-100 rounded-[4rem] p-8 lg:p-10 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-indigo-600 pointer-events-none group-hover:scale-125 transition-transform duration-1000">
                                <Activity size={160} />
                            </div>

                            <div className="flex items-center justify-between mb-10">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Study Record</h4>
                                <div className={`w-3 h-3 rounded-full ${progress === 100 ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : progress > 0 ? 'bg-indigo-600 animate-pulse shadow-[0_0_20px_rgba(79,70,229,0.5)]' : 'bg-slate-200'}`} />
                            </div>

                            <div className="space-y-8 mb-10">
                                <div>
                                    <div className="flex items-end justify-between mb-4">
                                        <span className="text-[11px] font-black text-slate-950 uppercase tracking-[0.3em]">Course Progress</span>
                                        <span className="text-3xl font-black text-indigo-600 tracking-tighter leading-none">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="h-8 bg-slate-50 rounded-[1.25rem] overflow-hidden p-1.5 border-2 border-slate-50 shadow-inner">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className="h-full bg-indigo-600 rounded-full shadow-[0_0_40px_rgba(79,70,229,0.5)]"
                                            transition={{ duration: 2, ease: "circOut" }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center mt-6">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                            {completedCount} / {lessons.length} Lessons Finished
                                        </p>
                                    </div>
                                </div>

                                <div className="p-8 rounded-[3rem] bg-slate-50 border border-slate-100 group/earned hover:border-indigo-100 transition-all duration-500 shadow-sm">
                                    <div className="flex items-center gap-5 mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-amber-500 shadow-xl group-hover/earned:scale-110 group-hover/earned:rotate-6 transition-all duration-500">
                                            <Star size={28} fill="currentColor" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">XP Earned</p>
                                            <p className="text-2xl font-black text-slate-950 tracking-tighter">{earnedXP.toLocaleString()} XP</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Available XP</span>
                                        <span className="text-xs font-black text-indigo-600">+{ (totalXP - earnedXP).toLocaleString() }</span>
                                    </div>
                                </div>
                            </div>

                            {nextLesson ? (
                                <Link href={`/student/lesson/${nextLesson.id}`} className="block group/btn">
                                    <button className="w-full bg-slate-950 text-white h-16 rounded-[3rem] font-black uppercase tracking-[0.3em] text-[11px] hover:bg-indigo-600 hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] active:scale-95 transition-all duration-500 flex items-center justify-center gap-4">
                                        {completedCount > 0 ? (progress === 100 ? 'Revise Module' : 'Resume Learning') : 'Start Lesson'}
                                        <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform duration-500" />
                                    </button>
                                </Link>
                            ) : null}

                            {progress === 100 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 p-6 rounded-[2.5rem] bg-emerald-50 border border-emerald-100 flex items-center gap-4"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                                        <Trophy size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1">Course Mastery</p>
                                        <p className="text-xs font-bold text-emerald-600/70 uppercase">Uplink Verified</p>
                                    </div>
                                </motion.div>
                            )}
                        </section>

                        <section className="bg-slate-950 rounded-[3rem] sm:rounded-[4.5rem] p-8 sm:p-10 text-white relative overflow-hidden shadow-[0_40px_80px_-20px_rgba(15,23,42,0.6)] border border-white/5 group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-all duration-1000" />
                            <h4 className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mb-6 sm:mb-8">Course Badges</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <BadgeIcon unlocked={progress >= 25} icon={Target} tooltip="Enrolled and Started" />
                                <BadgeIcon unlocked={progress >= 50} icon={Zap} tooltip="Mid-way Achievement" />
                                <BadgeIcon unlocked={progress === 100} icon={Award} tooltip="Course Mastery Badge" />
                            </div>
                            <div className="mt-8 flex items-center gap-4 opacity-40">
                                <div className="w-6 h-0.5 bg-indigo-500" />
                                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em]">
                                    {progress === 100 ? 'All Course Badges Earned' : 'Progress toward Badges'}
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}

function DetailStat({ icon: Icon, label, value, color }: any) {
    return (
        <div className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-6 transition-all hover:bg-slate-50 group duration-500 hover:-translate-y-1">
            <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-white group-hover:scale-110 transition-all duration-500 overflow-hidden shadow-sm`}>
                <Icon size={24} className={`${color} transition-colors duration-500`} />
            </div>
            <div>
                <p className="text-2xl lg:text-3xl font-black text-slate-950 leading-none mb-2 tracking-tighter">{value}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{label}</p>
            </div>
        </div>
    );
}

function BadgeIcon({ unlocked, icon: Icon, tooltip }: { unlocked: boolean, icon: any, tooltip: string }) {
    return (
        <div className={cn(
            "aspect-square rounded-2xl sm:rounded-[2rem] border-2 flex items-center justify-center transition-all duration-700 cursor-help group/reward active:scale-95 relative",
            unlocked 
                ? "bg-indigo-600/20 border-indigo-500/40 shadow-[0_0_30px_rgba(79,70,229,0.15)]" 
                : "bg-white/5 border-white/5 hover:bg-white/10"
        )}>
            <Icon size={24} className={cn(
                "transition-all duration-700",
                unlocked ? "text-indigo-400 scale-110 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]" : "text-white opacity-10 group-hover/reward:opacity-30"
            )} />
            
            {/* Tooltip on hover */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover/reward:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {tooltip}
            </div>
        </div>
    );
}
