'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LessonHeader }    from '@/modules/student/components/lesson/lesson-header';
import { LessonContent }   from '@/modules/student/components/lesson/lesson-content';
import { LessonOverview }  from '@/modules/student/components/lesson/lesson-overview';
import { LessonSyllabus }  from '@/modules/student/components/lesson/lesson-syllabus';
import { LessonTimerDisplay }     from '@/modules/student/components/lesson/lesson-timer-display';
import { LessonInstructionModal } from '@/modules/student/components/lesson/lesson-instruction-modal';
import { useLessonTimer }  from '@/modules/student/hooks/use-lesson-timer';
import { updateTimeSpent, getCourseDetailsData, completeLessonAndReward } from '@/modules/student/actions';
import {
  BookOpen, Trophy, Star, X, CheckCircle2 as CheckIcon,
  ArrowRight, ChevronRight, Home, Timer,
} from 'lucide-react';
import { LevelUpOverlay } from '@/modules/student/components/gamification/level-up-overlay';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

interface LessonClientProps {
  initialData: {
    lesson:         any;
    courseData:     any;
    lessonComplete: boolean;
  };
  completeLesson: () => Promise<any>;
}

export function LessonClient({ initialData, completeLesson }: LessonClientProps) {
  const { lesson, courseData: initialCourseData, lessonComplete: initialComplete } = initialData;
  const router = useRouter();

  const [lessonComplete,  setLessonComplete]  = useState(initialComplete);
  const [courseData,      setCourseData]      = useState(initialCourseData);
  const [isSyllabusOpen,  setIsSyllabusOpen]  = useState(false);

  useEffect(() => {
    // We no longer manipulate browser history for simple UI toggles.
    // This allows the browser back button to work naturally.
  }, [isSyllabusOpen]);
  const [docPage,         setDocPage]         = useState(1);
  const [docTotal,        setDocTotal]        = useState(0);
  const [docMax,          setDocMax]          = useState(lessonComplete ? 9999 : 1);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isSaving,        setIsSaving]        = useState(false);

  const isDocumentLesson = lesson.content_type === 'pdf' || lesson.content_type === 'ppt';

  // ── Timer ─────────────────────────────────────────────────────────────────
  const [leveledUpInfo, setLeveledUpInfo] = useState<{ show: boolean; level: number }>({ show: false, level: 1 });
  // Only active when lesson has a duration and is not already complete
  const durationMinutes: number = lesson.duration_minutes ?? 0;
  const timerEnabled            = durationMinutes > 0 && !lessonComplete;

  const { timeLeft, isComplete: timerDone, isPaused, pauseReason, hasStarted, start } =
    useLessonTimer({
      lessonId:          lesson.id,
      durationMinutes:   timerEnabled ? durationMinutes : 0,
      isAlreadyComplete: lessonComplete,
    });

  // Anti-Inspect Security: The button is only RENDERED if the timer is done.
  // Standard canMarkDone logic
  const canMarkProgress = !timerEnabled || timerDone || lessonComplete;

  // ── Accidental-navigation guard ────────────────────────────────────────────
  useEffect(() => {
    if (!timerEnabled || !hasStarted || timerDone || lessonComplete) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [timerEnabled, hasStarted, timerDone, lessonComplete]);

  // ── Listen for Mark Done triggered from the mobile bottom-nav ─────────────
  useEffect(() => {
    const handler = () => {
      if (canMarkProgress && !lessonComplete) handleComplete(false);
    };
    window.addEventListener('tnl:mark-done-click', handler);
    return () => window.removeEventListener('tnl:mark-done-click', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canMarkProgress, lessonComplete]);

  // ── Broadcast lesson-completed so bottom-nav hides the Mark Done strip ────
  useEffect(() => {
    if (lessonComplete) {
      window.dispatchEvent(new CustomEvent('tnl:lesson-completed', { detail: { lessonId: lesson.id } }));
    }
  }, [lessonComplete, lesson.id]);

  useEffect(() => {
    if (lessonComplete && docTotal > 0) setDocMax(docTotal);
  }, [lessonComplete, docTotal]);

  // ── Passive time tracking (server-side, every 10 s) ───────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (!lessonComplete && lesson.id && !document.hidden) {
        updateTimeSpent(lesson.id, 10);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [lessonComplete, lesson.id]);

  // ── Completion handler ────────────────────────────────────────────────────
  const handleComplete = useCallback(async (
    isVideo?: boolean,
    quizPercentage?: number,
    isPerfect?: boolean,
  ) => {
    if (lessonComplete && !quizPercentage) { setShowCelebration(true); return; }
    
    // Final security check before calling server action
    if (!canMarkProgress && !isVideo) {
      toast.error('Please finish the required lesson time first');
      return;
    }

    try {
      setIsSaving(true);
      setShowCelebration(true);

      const res = await completeLessonAndReward(lesson.id, quizPercentage, isPerfect);

      if (res?.success) {
        setLessonComplete(true);
        if (res?.leveledUp) {
          setLeveledUpInfo({ show: true, level: res.newLevel || 1 });
        }
        router.refresh();
        if (lesson.course_id) {
          const updatedCourse = await getCourseDetailsData(lesson.course_id, true);
          setCourseData(updatedCourse);
        }
      } else if (!isVideo) {
        toast.error(res?.error || 'Failed to save progress');
        setShowCelebration(false);
      } else {
        setLessonComplete(true);
      }
    } catch {
      if (!isVideo) {
        toast.error('Failed to save progress');
        setShowCelebration(false);
      } else {
        setLessonComplete(true);
      }
    } finally {
      setIsSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonComplete, lesson.id, lesson.course_id, canMarkProgress]);

  const handlePageSelect = (p: number) => {
    if (p > docTotal || p < 1) return;
    setDocPage(p);
    if (p > docMax) setDocMax(p);
  };

  const currentLessonIndex = React.useMemo(
    () => courseData?.lessons?.findIndex((l: any) => l.id === lesson.id) ?? -1,
    [courseData, lesson.id],
  );

  const nextLesson = React.useMemo(
    () => courseData?.lessons?.[currentLessonIndex + 1] ?? null,
    [courseData, currentLessonIndex],
  );

  const totalLessons       = courseData?.lessons?.length ?? 0;
  const isLastLesson       = currentLessonIndex === totalLessons - 1;
  const isCourseJustFinished = isLastLesson && lessonComplete;
  const completedCount     = courseData?.lessons?.filter((l: any) => l.status === 'completed').length ?? 0;
  const courseProgress     = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-white text-slate-950 flex flex-col">

      {/* ── Instruction modal (shown once per session when timer is set) ── */}
      {timerEnabled && (
        <LessonInstructionModal
          lessonId={lesson.id}
          durationMinutes={durationMinutes}
          onStart={start}
        />
      )}

      <LessonHeader
        courseId={lesson.course_id}
        courseTitle={courseData?.course?.title || 'Course'}
        lessonTitle={lesson.title}
        xpReward={lesson.xp_reward}
        isSyllabusOpen={isSyllabusOpen}
        onToggleSyllabus={() => setIsSyllabusOpen(!isSyllabusOpen)}
      />

      {/* ── Timer bar (visible once started) ── */}
      {timerEnabled && hasStarted && (
        <LessonTimerDisplay
          timeLeft={timeLeft}
          totalSecs={durationMinutes * 60}
          isComplete={timerDone}
          isPaused={isPaused}
          pauseReason={pauseReason}
          lessonId={lesson.id}
        />
      )}

      {/* Main layout */}
      <div className="flex flex-1 relative overflow-hidden" style={{ height: timerEnabled && hasStarted ? 'calc(100vh - 56px - 36px)' : 'calc(100vh - 56px)' }}>

        {/* ─── Syllabus sidebar ─── */}
        <AnimatePresence>
          {isSyllabusOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsSyllabusOpen(false)}
                className="fixed inset-0 z-[100] bg-slate-950/30 backdrop-blur-sm"
              />
              <motion.aside
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="fixed right-0 top-0 bottom-0 z-[110] w-[88vw] sm:w-[380px] bg-white border-l border-slate-100 flex flex-col shadow-[-30px_0_60px_rgba(0,0,0,0.08)]"
              >
                {/* Sidebar header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-900">Course Roadmap</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {totalLessons} Lessons · {courseProgress}% done
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSyllabusOpen(false)}
                    className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Sidebar body */}
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Your Progress</span>
                      <span className="text-[9px] font-black text-indigo-600">{courseProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                        style={{ width: `${courseProgress}%` }}
                      />
                    </div>
                  </div>

                  {isDocumentLesson && docTotal > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.35em]">Pages</p>
                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{docPage}/{docTotal}</span>
                      </div>
                      <div className="grid grid-cols-6 gap-1.5">
                        {Array.from({ length: docTotal }, (_, i) => i + 1).map(p => {
                          const isUnlocked = p <= docMax;
                          const isCurrent  = p === docPage;
                          return (
                            <button
                              key={p}
                              onClick={() => { handlePageSelect(p); if (window.innerWidth < 1024) setIsSyllabusOpen(false); }}
                              disabled={!isUnlocked}
                              className={cn(
                                'aspect-square rounded-lg flex items-center justify-center text-[9px] font-black border transition-all',
                                isCurrent  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : isUnlocked ? 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                                    : 'bg-slate-50 text-slate-300 border-transparent opacity-50 cursor-not-allowed',
                              )}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>
                      <div className="h-px bg-slate-100 my-5" />
                    </div>
                  )}

                  <LessonSyllabus
                    lessons={courseData?.lessons || []}
                    currentLessonId={lesson.id}
                    isSidebar={true}
                    onLessonSelect={() => { if (window.innerWidth < 1024) setIsSyllabusOpen(false); }}
                  />
                </div>

                {/* Sidebar footer: XP */}
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
                  <div className="bg-white rounded-2xl px-4 py-3 border border-slate-100 shadow-sm flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                      <Trophy size={16} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Lesson Reward</p>
                      <p className="text-sm font-black text-slate-900">+{lesson.xp_reward} XP</p>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ─── Main content ─── */}
        <div className="lesson-scroll-container flex-1 flex flex-col min-w-0 overflow-y-auto">
          <LessonContent
            lesson={lesson}
            isFocusMode={false}
            onComplete={handleComplete}
            lessonComplete={lessonComplete}
            isTimerLocked={!canMarkProgress}
            pageNumber={docPage}
            docMax={docMax}
            onDocStateChange={(total) => setDocTotal(total)}
            onPageChange={(p: number) => handlePageSelect(p)}
          />

      {!(lesson.content_type === 'quiz' && !lessonComplete) && (
            <div className="bg-white border-t border-slate-100 px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16 max-w-[1100px] mx-auto w-full">
              <LessonOverview
                lesson={lesson}
                lessonComplete={lessonComplete}
                nextLesson={nextLesson}
              />
            </div>
          )}

          {/* ─── Bottom lesson action bar ─── */}
          <div className="border-t border-slate-100 bg-white px-4 sm:px-8 lg:px-12 py-5 sm:py-6 max-w-[1100px] mx-auto w-full sticky bottom-0 z-20">
            <div className="flex items-center gap-4 sm:gap-6">

              {/* Status & info together */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {lessonComplete ? (
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                    <CheckIcon size={20} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-600/20">
                    <Timer size={20} className={cn(hasStarted && !timerDone && "animate-pulse")} />
                  </div>
                )}
                
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                    {lessonComplete ? 'Lesson Complete' : 'Your Progress'} · {currentLessonIndex + 1}/{totalLessons}
                  </p>
                  <h3 className="text-sm font-black text-slate-900 truncate uppercase tracking-tight leading-none">
                    {lesson.title}
                  </h3>
                </div>
              </div>

              {/* Primary Action Button (CTA) */}
              <div className="flex-shrink-0">
                {lessonComplete ? (
                  nextLesson ? (
                    <Link href={`/student/lesson/${nextLesson.id}`}>
                      <span className="flex items-center gap-2 h-12 px-6 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-indigo-600 transition-all active:scale-95">
                        Next Lesson <ChevronRight size={16} strokeWidth={3} />
                      </span>
                    </Link>
                  ) : (
                    <Link href="/student">
                      <span className="flex items-center gap-2 h-12 px-6 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95">
                        <Home size={16} /> Dashboard
                      </span>
                    </Link>
                  )
                ) : canMarkProgress ? (
                  <button
                    id="lesson-complete-button"
                    onClick={() => handleComplete(false)}
                    disabled={isSaving}
                    className="flex items-center gap-2 h-12 px-6 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 disabled:opacity-60 hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    {isSaving ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckIcon size={16} strokeWidth={3} />
                    )}
                    {isSaving ? 'Saving…' : 'Save Progress'}
                  </button>
                ) : (
                  <div 
                    id="lesson-complete-locked"
                    className="flex items-center gap-2 h-12 px-6 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed border border-slate-200/60 transition-all select-none"
                  >
                    <Timer size={16} />
                    Locked
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="h-6" />
        </div>
      </div>

      {/* ─── Completion celebration overlay ─── */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/20 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500" />

              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-center">
                  <div className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
                    isSaving ? 'bg-slate-100' : 'bg-indigo-50',
                  )}>
                    {isSaving ? (
                      <div className="w-8 h-8 border-[3px] border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                    ) : (
                      <CheckIcon size={32} className="text-indigo-600" />
                    )}
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    {isSaving ? 'Saving Progress…' : isCourseJustFinished ? 'Course Complete!' : 'Lesson Complete!'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {isSaving
                      ? 'Locking in your progress, just a moment.'
                      : isCourseJustFinished
                        ? 'You finished all lessons in this course.'
                        : 'Progress saved. Keep the momentum going!'}
                  </p>
                </div>

                <div className="flex items-center justify-between bg-amber-50 rounded-2xl px-5 py-4 border border-amber-100">
                  <div>
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-0.5">XP Earned</p>
                    <p className="text-2xl font-black text-slate-900">+{lesson.xp_reward}</p>
                  </div>
                  <Star className="text-amber-400 fill-amber-400" size={28} />
                </div>

                <div className="space-y-2.5">
                  {isSaving ? (
                    <div className="w-full py-4 bg-slate-100 rounded-2xl animate-pulse" />
                  ) : nextLesson ? (
                    <Link
                      href={`/student/lesson/${nextLesson.id}`}
                      onClick={() => setShowCelebration(false)}
                      className="w-full bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all active:scale-95 py-4"
                    >
                      Next Lesson <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <Link
                      href="/student"
                      className="w-full bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all active:scale-95 py-4"
                    >
                      Back to Dashboard <CheckIcon size={16} />
                    </Link>
                  )}
                  {!isSaving && (
                    <button
                      onClick={() => setShowCelebration(false)}
                      className="w-full py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-700 transition-colors"
                    >
                      Review This Lesson
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Level Up Celebration ─── */}
      <LevelUpOverlay 
        show={leveledUpInfo.show} 
        newLevel={leveledUpInfo.level} 
        onClose={() => setLeveledUpInfo({ ...leveledUpInfo, show: false })} 
      />
    </div>
  );
}
