'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Layers, CheckCircle2, Lock, Play, MonitorPlay, FileText, Trophy, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const CONTENT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    video: { label: 'Video Lesson', icon: Play, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    ppt: { label: 'Presentation', icon: MonitorPlay, color: 'text-sky-600 bg-sky-50 border-sky-100' },
    pdf: { label: 'Document', icon: FileText, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    assignment: { label: 'Assignment', icon: Trophy, color: 'text-rose-600 bg-rose-50 border-rose-100' },
    quiz: { label: 'Quiz', icon: HelpCircle, color: 'text-amber-600 bg-amber-50 border-amber-100' },
};

interface LessonSyllabusProps {
  lessons: any[];
  currentLessonId: string;
  isSidebar?: boolean;
  onLessonSelect?: () => void;
}

export function LessonSyllabus({ lessons, currentLessonId, isSidebar, onLessonSelect }: LessonSyllabusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn("mx-auto space-y-3", !isSidebar && "max-w-4xl space-y-6")}
    >
       {!isSidebar && (
           <div className="flex items-center justify-between mb-12 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                        <Layers size={24} />
                    </div>
                    <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">Course Roadmap</h3>
                </div>
                <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">
                    {lessons.length} Lessons
                </span>
            </div>
       )}
       
       <div className={cn("grid gap-3", !isSidebar ? "grid-cols-1 md:grid-cols-2 gap-4" : "grid-cols-1")}>
          {lessons.map((l: any, idx: number) => {
            const isActive = l.id === currentLessonId;
            const isCompleted = l.status === 'completed';
            const isLocked = l.status === 'locked';
            const TypeIcon = (CONTENT_CONFIG[l.content_type] || CONTENT_CONFIG.video).icon;

            return (
              <Link 
                key={l.id} 
                href={isLocked ? '#' : `/student/lesson/${l.id}`}
                onClick={() => !isLocked && onLessonSelect?.()}
                className={cn(
                  "flex items-center transition-all border group relative overflow-hidden",
                  isSidebar ? "gap-4 p-3 rounded-2xl" : "gap-6 p-6 rounded-[2.5rem]",
                  isActive 
                    ? "bg-slate-50 border-indigo-600 ring-2 ring-indigo-500/5 shadow-inner" 
                    : isLocked 
                      ? "opacity-40 border-slate-50 grayscale-[0.8] cursor-not-allowed"
                      : "bg-white border-slate-100/60 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-200/40 shadow-sm"
                )}
              >
                 <div className={cn(
                   "rounded-xl flex items-center justify-center shrink-0 border-2 transition-all duration-500",
                   isSidebar ? "w-10 h-10 border" : "w-14 h-14 border-2",
                   isActive ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-50 border-slate-100 text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100"
                 )}>
                   {isCompleted ? (
                       <CheckCircle2 size={isSidebar ? 18 : 28} />
                    ) : (
                        <TypeIcon size={isSidebar ? 18 : 28} />
                    )}
                 </div>
                 <div className="min-w-0 flex-1">
                    <div className={cn("flex items-center gap-2", isSidebar ? "mb-0.5" : "mb-2")}>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Step {idx + 1}</span>
                       {isLocked && <Lock size={10} className="text-slate-300" />}
                    </div>
                    <p className={cn(
                      "font-black uppercase tracking-tight truncate transition-all",
                      isSidebar ? "text-[11px]" : "text-[14px]",
                      isActive ? "text-indigo-600" : "text-slate-900"
                    )}>
                      {l.title}
                    </p>
                 </div>
              </Link>
            );
          })}
       </div>
    </motion.div>
  );
}
