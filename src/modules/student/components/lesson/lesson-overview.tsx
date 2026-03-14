'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Clock, Star, ShieldCheck, Zap, Lock, ChevronRight, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Lesson } from '@/modules/student/types';

interface LessonOverviewProps {
  lesson: Lesson;
  lessonComplete: boolean;
  nextLesson?: any;
}

export function LessonOverview({ lesson, lessonComplete, nextLesson }: LessonOverviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 sm:space-y-16"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16">
        {/* Left Content - Lesson Details */}
        <div className="lg:col-span-2 space-y-8 sm:space-y-12">
          {/* Header Section */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
               <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100/50 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                 {lesson.content_type} Module
               </Badge>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] uppercase">
              {lesson.title}
            </h2>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Description Section */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Learning Objectives</h4>
            <p className="text-lg sm:text-2xl font-bold text-slate-500 leading-relaxed uppercase">
               {lesson.description || `Enhance your proficiency in ${lesson.title} by mastering the core principles and methodologies examined in this module.`}
            </p>
          </div>

          {/* Stats Integrated Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
                   <Clock size={18} />
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Investment</p>
                <p className="text-sm font-black text-slate-900">{lesson.duration || 0} Minutes</p>
             </div>

             <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-100/50">
                   <Star size={18} fill="currentColor" />
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Mastery Points</p>
                <p className="text-sm font-black text-slate-900">+{lesson.xp_reward} XP</p>
             </div>

             <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mb-4 border",
                    lessonComplete ? "bg-emerald-50 text-emerald-600 border-emerald-100/50" : "bg-slate-50 text-slate-400 border-slate-100"
                )}>
                   <ShieldCheck size={18} />
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Progress Status</p>
                <p className={cn("text-sm font-black", lessonComplete ? "text-emerald-600" : "text-slate-900")}>
                    {lessonComplete ? 'VERIFIED' : 'PENDING'}
                </p>
             </div>

             <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100/50">
                   <Zap size={18} fill="currentColor" />
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Medium</p>
                <p className="text-sm font-black text-slate-900 uppercase">{lesson.content_type}</p>
             </div>
          </div>
        </div>

        {/* Right Content - Progression */}
        <div className="space-y-6 sm:space-y-8">
           {/* Progression Card */}
           <div className="p-8 sm:p-10 bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-900/10 relative overflow-hidden group border border-slate-800">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl transition-transform group-hover:scale-125" />
              
              <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Student Progression</p>
                      <div className="px-2 py-1 rounded bg-slate-800 text-[8px] font-black text-slate-400 uppercase">Module {lesson.sequence_index + 1}</div>
                  </div>
                  
                  <h4 className="text-2xl font-black text-white uppercase mb-10 tracking-tight leading-none">
                      {lessonComplete ? (nextLesson ? 'Next Concept' : 'Milestone achieved') : 'Current Target'}
                  </h4>
                  
                  <div className="mt-auto">
                    {lessonComplete && nextLesson ? (
                      <Link href={`/student/lesson/${nextLesson.id}`} className="block">
                        <button className="w-full h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-between px-6 font-black uppercase tracking-widest text-[9px] hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95">
                          <span>Advance to next lesson</span>
                          <ChevronRight size={16} />
                        </button>
                      </Link>
                    ) : lessonComplete ? (
                      <div className="w-full h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[9px] text-emerald-500 backdrop-blur-sm">
                         Module Finished
                      </div>
                    ) : (
                      <div className="w-full h-16 bg-slate-800/10 border border-slate-700 rounded-2xl flex items-center justify-center text-[9px] font-black text-slate-500 uppercase tracking-widest gap-2">
                         <Lock size={12} /> Target Pinned
                      </div>
                    )}
                  </div>
              </div>
           </div>

           {/* Quiz Engagement Placeholder (If not complete) */}
           {lesson.quiz_data && !lessonComplete && (
              <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] relative overflow-hidden group shadow-sm">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/50 shadow-sm">
                       <HelpCircle size={20} />
                    </div>
                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-[0.2em]">Verification Requirement</span>
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    A comprehension assessment remains locked until the primary module content is consumed.
                  </p>
              </div>
           )}
        </div>
      </div>
    </motion.div>
  );
}
