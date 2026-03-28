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
  const [docPage,         setDocPage]         = useState(1);
  const [docTotal,        setDocTotal]        = useState(0);
  const [docMax,          setDocMax]          = useState(lessonComplete ? 9999 : 1);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isSaving,        setIsSaving]        = useState(false);

  const isDocumentLesson = lesson.content_type === 'pdf' || lesson.content_type === 'ppt';

  // ── Timer ─────────────────────────────────────────────────────────────────
  // Only active when lesson has a duration and is not already complete
  const durationMinutes: number = lesson.duration_minutes ?? 0;
  const timerEnabled            = durationMinutes > 0 && !lessonComplete;

  const { timeLeft, isComplete: timerDone, isPaused, pauseReason, hasStarted, start } =
    useLessonTimer({
      lessonId:          lesson.id,
      durationMinutes:   timerEnabled ? durationMinutes : 0,
      isAlreadyComplete: lessonComplete,
    });

  // Allow "Mark Done" when: no timer set  OR  timer finished
  const canMarkDone = !timerEnabled || timerDone || lessonComplete;

  // ── Accidental-navigation guard ────────────────────────────────────────────
  // Active only while timer is running (started but not yet done)
  useEffect(() => {
    if (!timerEnabled || !hasStarted || timerDone || lessonComplete) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    // Push a fake history entry so pressing back triggers popstate first
    history.pushState(null, '', location.href);
    const onPopState = () => {
      history.pushState(null, '', location.href);
      toast.warning('Finish the lesson before leaving — your timer is still running.', {
        duration: 4000,
      });
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('popstate',     onPopState);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('popstate',     onPopState);
    };
  }, [timerEnabled, hasStarted, timerDone, lessonComplete]);

  // ── Listen for Mark Done triggered from the mobile bottom-nav ─────────────
  useEffect(() => {
    const handler = () => {
      if (canMarkDone && !lessonComplete) handleComplete(false);
    };
    window.addEventListener('tnl:mark-done-click', handler);
    return () => window.removeEventListener('tnl:mark-done-click', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canMarkDone, lessonComplete]);

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
      if (!lessonComplete && lesson.id) updateTimeSpent(lesson.id, 10);
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
    try {
      setIsSaving(true);
      setShowCelebration(true);

      const res = await completeLessonAndReward(lesson.id, quizPercentage, isPerfect);

      if (res?.success || res?.alreadyCompleted) {
        setLessonComplete(true);
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
  }, [lessonComplete, lesson.id, lesson.course_id]);

  const handlePageSelect = (p: number) => {
    if (p > docTotal || p < 1) return;
    if (p > docMax + 1) return;
    setDocPage(p);
    if (p > docMax) setDocMax(p);
    document.querySelector('.lesson-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
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
                <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5">
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
        <div className="lesson-scroll-container flex-1 flex flex-col min-w-0 overflow-y-auto no-scrollbar">
          <LessonContent
            lesson={lesson}
            isFocusMode={false}
            onComplete={handleComplete}
            lessonComplete={lessonComplete}
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
          <div className="border-t border-slate-100 bg-white px-4 sm:px-8 lg:px-12 py-4 sm:py-5 max-w-[1100px] mx-auto w-full">
            <div className="flex items-center gap-4">

              {/* Status icon */}
              {lessonComplete ? (
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckIcon size={16} className="text-emerald-500" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100/60 flex items-center justify-center flex-shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                </div>
              )}

              {/* Lesson info */}
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  {lessonComplete ? 'Completed' : 'In Progress'} · {currentLessonIndex + 1} of {totalLessons}
                </p>
                <p className="text-xs sm:text-sm font-black text-slate-800 truncate leading-tight uppercase tracking-tight">
                  {lesson.title}
                </p>
              </div>

              {/* CTA */}
              {lessonComplete ? (
                nextLesson ? (
                  <Link href={`/student/lesson/${nextLesson.id}`} className="flex-shrink-0">
                    <span className="flex items-center gap-2 h-11 px-5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap hover:bg-indigo-600 transition-colors">
                      Next Lesson <ChevronRight size={14} strokeWidth={3} />
                    </span>
                  </Link>
                ) : (
                  <Link href="/student" className="flex-shrink-0">
                    <span className="flex items-center gap-2 h-11 px-5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap hover:bg-emerald-600 transition-colors">
                      <Home size={14} /> Back to Home
                    </span>
                  </Link>
                )
              ) : canMarkDone ? (
                /* Timer done (or no timer) — Mark Done enabled */
                <button
                  onClick={() => handleComplete(false)}
                  disabled={isSaving}
                  className="flex-shrink-0 flex items-center gap-2 h-11 px-5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap disabled:opacity-60 hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  {isSaving ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckIcon size={14} />
                  )}
                  {isSaving ? 'Saving…' : 'Mark Done'}
                </button>
              ) : (
                /* Timer still running — locked state */
                <div className="flex-shrink-0 flex items-center gap-2 h-11 px-5 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap cursor-not-allowed select-none border border-slate-200">
                  <Timer size={14} />
                  {hasStarted ? 'Finish timer first' : 'Start lesson'}
                </div>
              )}
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
    </div>
  );
}
