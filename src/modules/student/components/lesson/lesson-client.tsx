'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LessonHeader } from '@/modules/student/components/lesson/lesson-header';
import { LessonContent } from '@/modules/student/components/lesson/lesson-content';
import { LessonOverview } from '@/modules/student/components/lesson/lesson-overview';
import { LessonSyllabus } from '@/modules/student/components/lesson/lesson-syllabus';
import { QuizEngine } from '@/modules/student/components/quiz/quiz-engine';
import { updateTimeSpent, getCourseDetailsData, completeLessonAndReward } from '@/modules/student/actions';
import { AlertCircle, BookOpen, Layers, HelpCircle, Activity, Trophy, Sparkles, PartyPopper, ArrowRight, Star, X, CheckCircle2 as CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

interface LessonClientProps {
  initialData: {
    lesson: any;
    courseData: any;
    lessonComplete: boolean;
  },
  completeLesson: () => Promise<any>;
}

export function LessonClient({ initialData, completeLesson }: LessonClientProps) {
  const { lesson, courseData: initialCourseData, lessonComplete: initialComplete } = initialData;
  const router = useRouter();
  const [lessonComplete, setLessonComplete] = useState(initialComplete);
  const [courseData, setCourseData] = useState(initialCourseData);
  const [sidebarTab, setSidebarTab] = useState<'index' | 'brief' | 'files'>('index');
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);
  const [docPage, setDocPage] = useState(1);
  const [docTotal, setDocTotal] = useState(0);
  const [docMax, setDocMax] = useState(lessonComplete ? 9999 : 1);
  const [showCelebration, setShowCelebration] = useState(false);

  const isDocumentLesson = lesson.content_type === 'pdf' || lesson.content_type === 'ppt';

  // If already complete, ensure all pages are unlocked on load
  useEffect(() => {
    if (lessonComplete && docTotal > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDocMax(docTotal);
    }
  }, [lessonComplete, docTotal]);

  // Time tracking protocol
  useEffect(() => {
    const interval = setInterval(() => {
      if (!lessonComplete && lesson.id) {
        updateTimeSpent(lesson.id, 10);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [lessonComplete, lesson.id]);

  const handleComplete = async (isVideo?: boolean, quizPercentage?: number, isPerfect?: boolean) => {
    // If already complete and not a quiz, just show celebration if needed
    if (lessonComplete && !quizPercentage) {
        setShowCelebration(true);
        return;
    }
    
    try {
      if (isVideo === true) {
        setLessonComplete(true);
        setShowCelebration(true);
        router.refresh();
        if (lesson.course_id) {
            const updatedCourse = await getCourseDetailsData(lesson.course_id, true);
            setCourseData(updatedCourse);
        }
        return;
      }

      const res = await completeLessonAndReward(lesson.id, quizPercentage, isPerfect);
      if (res?.success) {
        setLessonComplete(true);
        setShowCelebration(true);
        router.refresh();
        if (lesson.course_id) {
            const updatedCourse = await getCourseDetailsData(lesson.course_id, true);
            setCourseData(updatedCourse);
        }
        toast.success("Progress Synchronized");
      }
    } catch (err) {
      console.error('Failed to sync completion:', err);
      toast.error("Failed to save progress");
    }
  };

  const handlePageSelect = (p: number) => {
    if (p > docTotal || p < 1) return;
    
    // Only allow moving to unlocked pages or the very next page to be unlocked
    if (p > docMax + 1) return;

    setDocPage(p);
    if (p > docMax) {
      setDocMax(p);
    }
    // Scroll content to top
    const contentNode = document.querySelector('.min-w-0.flex-1');
    if (contentNode) contentNode.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentLessonIndex = React.useMemo(() => {
    return courseData?.lessons?.findIndex((l: any) => l.id === lesson.id) ?? -1;
  }, [courseData, lesson.id]);

  const nextLesson = React.useMemo(() => {
    if (currentLessonIndex === -1) return null;
    return courseData?.lessons?.[currentLessonIndex + 1];
  }, [courseData, currentLessonIndex]);

  const isLastLesson = currentLessonIndex === (courseData?.lessons?.length ?? 0) - 1;
  const isCourseJustFinished = isLastLesson && lessonComplete;

  const sidebarTabs = [
    { id: 'index', label: isDocumentLesson ? 'Chapters' : 'Index', icon: Layers },
    { id: 'brief', label: 'Details', icon: BookOpen },
    { id: 'files', label: 'Resources', icon: HelpCircle }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-950 selection:bg-indigo-100 selection:text-indigo-900 flex flex-col font-outfit">
      <LessonHeader
        courseId={lesson.course_id}
        courseTitle={courseData?.course?.title || 'Course Content'}
        lessonTitle={lesson.title}
        xpReward={lesson.xp_reward}
        isSyllabusOpen={isSyllabusOpen}
        onToggleSyllabus={() => setIsSyllabusOpen(!isSyllabusOpen)}
      />

      <div className="flex flex-1 relative overflow-hidden h-[calc(100vh-80px)] sm:h-[calc(100vh-96px)]">
        {/* Unified Syllabus Sidebar (Overlay on mobile, sidebar on large) */}
        <AnimatePresence>
          {isSyllabusOpen && (
            <>
              {/* Backrop Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSyllabusOpen(false)}
                className="fixed inset-0 z-[100] bg-slate-950/20 backdrop-blur-sm lg:hidden"
              />
              
              {/* Sidebar Content */}
              <motion.aside 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 z-[110] w-[85vw] sm:w-[400px] bg-white border-l border-slate-100 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.05)]"
              >
                {/* Fixed Header in Sidebar */}
                <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Layers size={20} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Module Index</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {courseData?.lessons?.length || 0} Modules • {courseData?.course?.title}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsSyllabusOpen(false)}
                    className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-8">
                  {isDocumentLesson && (
                    <div className="mb-10">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Document Progress</h3>
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md">{docMax} / {docTotal}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: docTotal || 0 }, (_, i) => i + 1).map(p => {
                          const isUnlocked = p <= docMax;
                          const isCurrent = p === docPage;
                          return (
                            <button
                              key={p}
                              onClick={() => {
                                handlePageSelect(p);
                                if (window.innerWidth < 1024) setIsSyllabusOpen(false);
                              }}
                              disabled={!isUnlocked}
                              className={cn(
                                "aspect-square rounded-xl flex items-center justify-center text-[10px] font-black border transition-all",
                                isCurrent ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" :
                                isUnlocked ? "bg-white text-slate-900 border-slate-100 hover:border-indigo-200" :
                                "bg-slate-50 text-slate-200 border-transparent opacity-40 cursor-not-allowed"
                              )}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>
                      <div className="h-px bg-slate-100 my-10" />
                    </div>
                  )}

                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Course Roadmap</h3>
                    <LessonSyllabus 
                        lessons={courseData?.lessons || []} 
                        currentLessonId={lesson.id} 
                        isSidebar={true} 
                        onLessonSelect={() => {
                            if (window.innerWidth < 1024) setIsSyllabusOpen(false);
                        }}
                    />
                  </div>
                </div>

                {/* Sidebar Footer */}
                <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <Trophy size={18} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Potential Reward</p>
                            <p className="text-sm font-black text-slate-900">+{lesson.xp_reward} Mastery Points</p>
                        </div>
                    </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/10 overflow-y-auto no-scrollbar relative">
          <LessonContent
            lesson={lesson}
            isFocusMode={false}
            onComplete={(isVideo, qP, iP) => handleComplete(isVideo, qP, iP)}
            lessonComplete={lessonComplete}
            pageNumber={docPage}
            docMax={docMax}
            onDocStateChange={(total) => setDocTotal(total)}
            onPageChange={(p: number) => handlePageSelect(p)}
          />

          {/* Hide distractions during active quiz */}
          {!(lesson.content_type === 'quiz' && !lessonComplete) && (
            <div className="px-6 lg:px-12 py-10 lg:py-20 max-w-[1100px] mx-auto w-full">
              <LessonOverview 
                  lesson={lesson} 
                  lessonComplete={lessonComplete}
              />
            </div>
          )}

          <AnimatePresence>
            {showCelebration && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-[400px] w-full bg-white/95 backdrop-blur-xl border border-slate-200 p-8 sm:p-10 rounded-3xl shadow-2xl text-center"
                >
                  <div className="space-y-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckIcon size={32} className="text-slate-900" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                          {isCourseJustFinished ? 'Course Complete' : 'Lesson Complete'}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                          {isCourseJustFinished 
                            ? 'You have finished all modules in this course.'
                            : 'Your progress has been recorded successfully.'}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-5 flex items-center justify-between border border-slate-100">
                        <div className="text-left">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rewards</p>
                            <p className="text-lg font-bold text-slate-900">+{lesson.xp_reward} XP</p>
                        </div>
                        <Star className="text-amber-400 fill-amber-400" size={24} />
                    </div>

                    <div className="space-y-3">
                        {nextLesson ? (
                            <Link 
                                href={`/student/lesson/${nextLesson.id}`}
                                onClick={() => setShowCelebration(false)}
                                className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
                            >
                                Next Lesson <ArrowRight size={18} />
                            </Link>
                        ) : (
                            <Link 
                                href="/student"
                                className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
                            >
                                Dashboard <CheckIcon size={18} />
                            </Link>
                        )}
                        <button 
                            onClick={() => setShowCelebration(false)}
                            className="w-full h-10 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                        >
                            Review Lesson
                        </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}


          </AnimatePresence>

        </div>
      </div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
      `}</style>
    </div>
  );
}
