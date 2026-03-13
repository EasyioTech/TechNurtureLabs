'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { getLessonData, completeLessonAndReward, saveVideoProgress, updateTimeSpent, getCourseDetailsData } from '@/components/learning/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle2, Clock, Play, FileText, Trophy,
  Zap, ExternalLink, AlertCircle, ChevronRight, MonitorPlay,
  HelpCircle, BookOpen, User, Star, Maximize2, Minimize2, ShieldAlert,
  Timer, Lock as LockIcon, Layers, ShieldCheck
} from 'lucide-react';
import { StudentDashboardLoader } from '@/modules/student/components/dashboard-loader';
import Link from 'next/link';
import dynamic from 'next/dynamic';
// ─── Types ────────────────────────────────────────────────────────
type Question = {
  id: string;
  text: string;
  question_type: string;
  options: string[];
  correct_answer: any; // could be 0-based index or string
  explanation: string;
  points: number;
  time_limit_secs: number;
};

type QuizData = {
  quiz: {
    id: string;
    title: string;
    time_limit_secs: number;
    pass_percentage: number;
    max_attempts: number;
    xp_reward: number;
    is_locked?: boolean;
    lock_reason?: string;
  };
  questions: Question[];
};

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  content_type: 'video' | 'ppt' | 'pdf' | 'assignment';
  content_url: string | null;
  duration: number;
  xp_reward: number;
  course_id: string;
  quiz_data: QuizData | null;
  user_progress?: {
    last_position_secs: number;
    progress_pct: number;
    completed_at: any;
  } | null;
};

import { VideoPlayer } from '@/components/video/video-player';
const PDFViewer = dynamic(() => import('@/components/learning/pdf-viewer').then(mod => mod.PDFViewer), {
  ssr: false,
});
const PPTViewer = dynamic(() => import('@/components/learning/ppt-viewer').then(mod => mod.PPTViewer), {
  ssr: false,
});
import { AssignmentViewer } from '@/components/learning/assignment-viewer';

// ─── Content type helpers ──────────────────────────────────────────
const CONTENT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  video: { label: 'Video Lesson', icon: Play, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  ppt: { label: 'Presentation', icon: MonitorPlay, color: 'text-sky-600 bg-sky-50 border-sky-100' },
  pdf: { label: 'Document', icon: FileText, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  assignment: { label: 'Mission', icon: Trophy, color: 'text-rose-600 bg-rose-50 border-rose-100' },
  quiz: { label: 'Assessment', icon: HelpCircle, color: 'text-amber-600 bg-amber-50 border-amber-100' },
};

function toYouTubeEmbed(url: string) {
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?rel=0&autoplay=0&showinfo=0`;
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?rel=0&autoplay=0&showinfo=0`;
  if (url.includes('/embed/')) return url;
  return url;
}

// ─── Main Page ────────────────────────────────────────────────────
export default function LessonPlayerPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'syllabus' | 'quiz'>('overview');
  const [courseData, setCourseData] = useState<any>(null);
  const [courseLoading, setCourseLoading] = useState(true);

  // Time spent tracking
  useEffect(() => {
    const interval = setInterval(() => {
      if (!lessonComplete && lessonId) {
        updateTimeSpent(lessonId, 10);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [lessonComplete, lessonId]);

  // Global Security Measures
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
      }
    };
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    async function fetchLesson() {
      setLoading(true);
      try {
        const data = await getLessonData(lessonId);
        if (data) {
          setLesson(data as any);
          setLessonComplete(!!data.user_progress?.completed_at);
          
          // Fetch course details for syllabus tab
          const course = await getCourseDetailsData(data.course_id);
          setCourseData(course);

          // Auto-switch to quiz if lesson is complete and quiz exists
          if (data.user_progress?.completed_at && data.quiz_data) {
             setActiveTab('quiz');
          }
        }
      } catch (err) {
        console.error('Failed to load lesson:', err);
      }
      setLoading(false);
      setCourseLoading(false);
    }
    fetchLesson();
  }, [lessonId]);

  const completeLesson = useCallback(async (quizPercentage?: number, isPerfect?: boolean) => {
    if (lessonComplete) return;
    setLessonComplete(true);
    try {
      await completeLessonAndReward(lessonId, quizPercentage, isPerfect);
      if (lesson?.course_id) {
        const course = await getCourseDetailsData(lesson.course_id);
        setCourseData(course);
      }
      // Show quiz tab upon completion
      if (lesson?.quiz_data) setActiveTab('quiz');
    } catch (err) { console.error('Failed to record completion:', err); }
  }, [lessonId, lessonComplete, lesson?.course_id, lesson?.quiz_data]);

  if (loading || courseLoading) {
    return <StudentDashboardLoader message="Loading cinematic learning experience..." />;
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-red-50 rounded-[2.5rem] flex items-center justify-center text-red-500 mx-auto mb-8 border border-red-100">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Unavailable</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">This resource is protected or deleted.</p>
          <Link href="/student">
            <Button className="w-full bg-slate-950 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-[10px]">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentLessonIndex = courseData?.lessons?.findIndex((l: any) => l.id === lessonId) ?? -1;
  const nextLesson = courseData?.lessons?.[currentLessonIndex + 1];

  return (
    <div className="min-h-screen bg-white text-slate-950 selection:bg-indigo-100 selection:text-indigo-900">
      {/* ── CLEAN HEADER ── */}
      <header className="sticky top-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-slate-200 h-20 flex items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-6 min-w-0">
          <Link href={`/student/course/${lesson.course_id}`}>
            <button className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white hover:border-indigo-200 transition-all active:scale-95">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-0.5 whitespace-nowrap">
              {courseData?.course?.title || 'Course Content'}
            </p>
            <h1 className="text-sm font-black uppercase tracking-tight truncate max-w-[200px] md:max-w-md text-slate-900">
              {lesson.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-2xl border border-amber-100 text-[10px] font-black uppercase tracking-widest leading-none">
            <Star size={14} fill="currentColor" />
            Earn +{lesson.xp_reward} XP
          </div>
          
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={cn(
               "w-11 h-11 rounded-2xl border flex items-center justify-center transition-all active:scale-95",
               isFocusMode ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-50 border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200"
            )}
          >
            {isFocusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </header>

      {/* ── PLAYER SECTION ── */}
      <section className={cn(
        "relative transition-all duration-1000",
        isFocusMode ? "fixed inset-0 top-0 z-[100] bg-white" : "bg-white border-b border-slate-100"
      )}>
        <div className={cn(
          "mx-auto transition-all duration-700",
          isFocusMode ? "w-full h-full" : "max-w-[1240px] px-0 lg:px-6 py-0 lg:py-12"
        )}>
           {lesson.content_type === 'video' && lesson.content_url && (
              <VideoPlayer
                src={lesson.content_url}
                lessonId={lessonId}
                initialProgress={lesson.user_progress}
                onComplete={() => completeLesson()}
              />
            )}

            {lesson.content_type === 'pdf' && (
              <div className="max-w-[1240px] mx-auto py-8 lg:py-16">
                <PDFViewer url={lesson.content_url!} onComplete={() => completeLesson()} lessonComplete={lessonComplete} />
              </div>
            )}
            
            {lesson.content_type === 'ppt' && (
              <div className="max-w-[1240px] mx-auto py-8 lg:py-16">
                <PPTViewer url={lesson.content_url!} onComplete={() => completeLesson()} lessonComplete={lessonComplete} />
              </div>
            )}

            {lesson.content_type === 'assignment' && (
              <div className="max-w-[1240px] mx-auto py-8 lg:py-16">
                <AssignmentViewer lessonId={lessonId} onComplete={() => completeLesson()} lessonComplete={lessonComplete} />
              </div>
            )}
        </div>
      </section>

      {/* ── CONTENT AREA ── */}
      {!isFocusMode && (
        <main className="max-w-[1240px] mx-auto px-6 py-12 lg:py-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 border-b border-slate-100 mb-16 overflow-x-auto no-scrollbar">
              {[
                { id: 'overview', label: 'Overview', icon: BookOpen },
                { id: 'syllabus', label: 'Curriculum', icon: Layers },
                { id: 'quiz', label: 'Assessment', icon: HelpCircle, hidden: !lesson.quiz_data }
              ].filter(t => !t.hidden).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={cn(
                    "flex items-center gap-2.5 px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative shrink-0",
                    activeTab === t.id ? "text-indigo-600" : "text-slate-400 hover:text-slate-900"
                  )}
                >
                  <t.icon size={16} />
                  {t.label}
                  {activeTab === t.id && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content with Immersive Transitions */}
            <div className="relative min-h-[500px]">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: "spring", damping: 30, stiffness: 200 }}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-24">
                      <div className="lg:col-span-2 space-y-12">
                        <div className="space-y-6">
                           <Badge className="bg-indigo-600 text-white border-0 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200/50">
                             {lesson.content_type.toUpperCase()} MASTERY
                           </Badge>
                           <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.85] text-slate-900">
                             {lesson.title}
                           </h2>
                        </div>
                        
                        <div className="h-px bg-slate-100 w-full shrink-0" />
                        
                        <div className="space-y-8">
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Curriculum Objective</h4>
                           </div>
                           <p className="text-xl md:text-2xl font-bold text-slate-400 leading-relaxed uppercase selection:bg-indigo-100">
                              {lesson.description || `Gain comprehensive knowledge in ${lesson.title}. Master the professional methodologies and strategic applications presented in this curriculum module.`}
                           </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           {[
                             { label: 'Time Scale', val: `${lesson.duration}m`, icon: Clock, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                             { label: 'Intelligence', val: `+${lesson.xp_reward} XP`, icon: Star, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                             { label: 'Security', val: lessonComplete ? 'Verified' : 'Pending', icon: ShieldCheck, color: lessonComplete ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-slate-400 bg-slate-50 border-slate-200' },
                             { label: 'Protocol', val: lesson.content_type, icon: Zap, color: 'text-sky-600 bg-sky-50 border-sky-100' }
                           ].map((item, i) => (
                             <div key={i} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] transition-all hover:shadow-xl hover:shadow-slate-200/50 group">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-6 border transition-transform group-hover:scale-110", item.color)}>
                                   <item.icon size={22} />
                                </div>
                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2 text-center">{item.label}</p>
                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight text-center">{item.val}</p>
                             </div>
                           ))}
                        </div>
                      </div>

                      {/* Right Panel */}
                      <div className="space-y-8">
                         <div className="p-10 bg-indigo-600 rounded-[3.5rem] shadow-2xl shadow-indigo-600/30 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl transition-transform group-hover:scale-125" />
                            
                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-6 relative z-10">Academy Progression</p>
                            <h4 className="text-2xl font-black text-white uppercase mb-10 leading-none tracking-tight relative z-10">Next Strategic Objective</h4>
                            
                            <div className="relative z-10">
                              {lessonComplete && nextLesson ? (
                                <Link href={`/student/lesson/${nextLesson.id}`}>
                                  <button className="w-full h-20 bg-white text-slate-900 rounded-3xl flex items-center justify-between px-8 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all active:scale-95 shadow-xl">
                                    <span>Initiate Level</span>
                                    <ChevronRight size={20} />
                                  </button>
                                </Link>
                              ) : lessonComplete ? (
                                <div className="w-full h-20 bg-white/10 border border-white/20 rounded-3xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] text-white">
                                   Curriculum Concluded
                                </div>
                              ) : (
                                <div className="w-full h-20 bg-black/10 border border-white/10 rounded-3xl flex items-center justify-center text-[10px] font-black text-white/40 uppercase tracking-widest gap-2">
                                   <LockIcon size={14} /> Playback Lockdown
                                </div>
                              )}
                            </div>
                         </div>

                         {lesson.quiz_data && !lessonComplete && (
                            <div className="p-10 bg-slate-50 border border-slate-200 rounded-[3.5rem] relative overflow-hidden group">
                               <div className="flex items-center gap-4 mb-8">
                                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                                     <HelpCircle size={24} />
                                  </div>
                                  <span className="text-[11px] font-black text-amber-600 uppercase tracking-[0.2em]">Exam Gate</span>
                               </div>
                               <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                  Authentication successful. Awaiting verified playback completion to unlock assessment.
                                </p>
                            </div>
                         )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'syllabus' && (
                  <motion.div
                    key="syllabus"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="max-w-4xl mx-auto space-y-6"
                  >
                     <div className="flex items-center justify-between mb-12 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                              <Layers size={24} />
                           </div>
                           <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">Curriculum Roadmap</h3>
                        </div>
                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">
                           {courseData?.lessons?.length || 0} Professional Steps
                        </span>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {courseData?.lessons?.map((l: any, idx: number) => {
                          const isActive = l.id === lessonId;
                          const isCompleted = l.status === 'completed';
                          const isLocked = l.status === 'locked';
                          const TypeIcon = (CONTENT_CONFIG[l.content_type] || CONTENT_CONFIG.video).icon;

                          return (
                            <Link 
                              key={l.id} 
                              href={isLocked ? '#' : `/student/lesson/${l.id}`}
                              className={cn(
                                "flex items-center gap-6 p-6 rounded-[2.5rem] transition-all border group relative overflow-hidden",
                                isActive 
                                  ? "bg-slate-50 border-indigo-600 ring-4 ring-indigo-500/5 shadow-inner" 
                                  : isLocked 
                                    ? "opacity-40 border-slate-100 grayscale-[0.5] cursor-not-allowed"
                                    : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-200/40"
                              )}
                            >
                               {isActive && <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600" />}
                               <div className={cn(
                                 "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-500",
                                 isActive ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/20" : "bg-slate-50 border-slate-100 text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100"
                               )}>
                                 {isCompleted ? <CheckCircle2 size={28} /> : <TypeIcon size={28} />}
                               </div>
                               <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Module {String(idx + 1).padStart(2, '0')}</span>
                                     {isLocked && <LockIcon size={12} className="text-slate-300" />}
                                  </div>
                                  <p className={cn(
                                    "text-[14px] font-black uppercase tracking-tight truncate transition-all",
                                    isActive ? "text-white" : "text-white/50 group-hover:text-white"
                                  )}>
                                    {l.title}
                                  </p>
                               </div>
                            </Link>
                          );
                        })}
                     </div>
                  </motion.div>
                )}

                {activeTab === 'quiz' && lesson.quiz_data && (
                  <motion.div
                    key="quiz"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="animate-in fade-in duration-1000"
                  >
                     <QuizEngine
                        quizData={lesson.quiz_data}
                        lessonXp={lesson.xp_reward}
                        lessonComplete={lessonComplete}
                        onComplete={completeLesson}
                      />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
        </main>
      )}
    </div>
  );
}
// ─── Quiz Engine ───────────────────────────────────────────────────
function QuizEngine({ quizData, lessonXp, lessonComplete, onComplete }: {
  quizData: QuizData | null;
  lessonXp: number;
  lessonComplete: boolean;
  onComplete: (score?: number, perfect?: boolean) => void;
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);

  if (quizData?.quiz?.is_locked) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6">
        <div className="bg-slate-950 border border-white/5 p-12 lg:p-20 rounded-[4rem] text-center relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px]" />
           <div className="relative z-10 flex flex-col items-center">
             <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-white/10 mb-8 shadow-2xl text-amber-500">
               <LockIcon size={40} strokeWidth={3} />
             </div>
             <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-tight mb-4 text-white">Assessment Locked</h3>
             <p className="text-sm text-slate-400 font-bold uppercase tracking-widest max-w-md mx-auto leading-relaxed">
               {quizData.quiz.lock_reason || "You must complete the lesson content before attempting the quiz."}
             </p>
             <div className="mt-10 flex items-center gap-2 px-6 py-3 bg-white/5 rounded-full border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <ShieldAlert size={14} className="text-amber-500" />
                Verified Playback Enforcement Active
             </div>
           </div>
        </div>
      </div>
    );
  }

  // Security & Time Management
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [strikes, setStrikes] = useState(0);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);

  const questions = quizData?.questions || [];
  const question = questions[currentQuestion];
  const totalPoints = questions.reduce((s, q) => s + (q.points || 1), 0);

  // ─── SECURITY MEASURES ───
  useEffect(() => {
    // 1. Disable Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setSecurityWarning("Security Protocol: Right-click is restricted during exams.");
    };

    // 2. Disable DevTools Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        setSecurityWarning("Security Protocol: Developer tools are restricted during exams.");
      }
    };

    // 3. Tab Switch Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setStrikes(prev => {
          const newStrikes = prev + 1;
          setSecurityWarning(`Security Warning: Tab switch detected! Strike ${newStrikes}/3. The exam will auto-terminate after 3 strikes.`);
          if (newStrikes >= 3) {
            // Auto-submit
            setQuizFinished(true);
            onComplete(0, false);
          }
          return newStrikes;
        });
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onComplete]);

  // ─── PER-QUESTION TIMER ───
  useEffect(() => {
    if (!question || quizFinished || lessonComplete) return;

    // Use question limit or default to 60s if builder didn't set it (optional)
    const limit = question.time_limit_secs || 0;
    if (limit === 0) {
      setTimeLeft(0); // No limit
      return;
    }

    setTimeLeft(limit);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time up! Auto-move to next
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, quizFinished, lessonComplete]);

  const handleTimeout = () => {
    if (selectedAnswer === null) {
      // Mark as incorrect if nothing selected
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = -1;
      setAnswers(newAnswers);
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(c => c + 1);
      setSelectedAnswer(null);
    } else {
      setQuizFinished(true);
      const finalPct = Math.round((score / totalPoints) * 100);
      onComplete(finalPct, score === totalPoints);
    }
  };

  const handleSelect = (optionIndex: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(optionIndex);

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);

    let correctIdx: number;
    if (typeof question.correct_answer === 'number') {
      correctIdx = question.correct_answer;
    } else {
      correctIdx = question.options.findIndex(o =>
        o.toLowerCase().trim() === String(question.correct_answer).toLowerCase().trim()
      );
    }

    const isCorrect = optionIndex === correctIdx;
    if (isCorrect) setScore(s => s + (question.points || 1));

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(c => c + 1);
        setSelectedAnswer(null);
      } else {
        const finalScore = isCorrect ? score + (question.points || 1) : score;
        setScore(finalScore);
        setQuizFinished(true);
        const pct = Math.round((finalScore / totalPoints) * 100);
        onComplete(pct, finalScore === totalPoints);
      }
    }, 1600);
  };

  if (quizFinished || lessonComplete) {
    const pct = Math.round((score / totalPoints) * 100);
    return <QuizResults score={score} total={totalPoints} percentage={pct} xp={lessonXp} courseId="" lessonId="" />;
  }

  let correctIdxForDisplay: number;
  if (typeof question.correct_answer === 'number') {
    correctIdxForDisplay = question.correct_answer;
  } else {
    correctIdxForDisplay = question.options.findIndex(o =>
      o.toLowerCase().trim() === String(question.correct_answer).toLowerCase().trim()
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
      {/* Security Alert Banner */}
      {securityWarning && (
        <div className="bg-red-500 text-white p-4 rounded-2xl flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3">
            <ShieldAlert size={20} />
            <p className="text-[10px] font-black uppercase tracking-widest">{securityWarning}</p>
          </div>
          <button onClick={() => setSecurityWarning(null)} className="opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Stats Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Exam Progress</p>
            <div className="flex items-end justify-between mb-4">
              <span className="text-3xl font-black text-slate-900 leading-none">{currentQuestion + 1}</span>
              <span className="text-xs font-black text-slate-400">/ {questions.length}</span>
            </div>
            <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-700"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {timeLeft > 0 && (
            <div className={cn(
              "bg-white p-6 rounded-[2.5rem] border transition-colors duration-500 shadow-xl shadow-slate-200/50",
              timeLeft < 10 ? "border-red-100 bg-red-50" : "border-slate-100"
            )}>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Time Remaining</p>
              <div className={cn(
                "flex items-center gap-3 text-3xl font-black font-mono leading-none",
                timeLeft < 10 ? "text-red-600 animate-pulse" : "text-slate-900"
              )}>
                <Timer size={24} />
                00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Security Status</p>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", strikes > 0 ? "bg-red-500 animate-ping" : "bg-emerald-500")} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                {strikes === 0 ? "Protected" : `${strikes} Strikes Recorded`}
              </span>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="lg:col-span-3">
          <Card className="bg-white border border-slate-100 rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[500px] flex flex-col">
            <CardContent className="p-12 lg:p-16 flex-1">
              <div className="flex items-center gap-3 mb-8">
                <Badge className="bg-indigo-600 text-white border-0 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">Question {currentQuestion + 1}</Badge>
                <Badge className="bg-amber-50 text-amber-600 border-amber-100 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">+{question.points || 1} XP</Badge>
              </div>

              <h2 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight mb-12 leading-tight">{question.text}</h2>

              <div className="grid grid-cols-1 gap-4">
                {question.options.map((option, i) => {
                  const isSelected = selectedAnswer === i;
                  const isCorrect = i === correctIdxForDisplay;
                  const showResult = selectedAnswer !== null;

                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(i)}
                      disabled={selectedAnswer !== null}
                      className={cn(
                        "group relative p-8 rounded-3xl text-left transition-all duration-300 border-2",
                        showResult && isCorrect
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900 translate-x-1"
                          : showResult && isSelected && !isCorrect
                            ? "bg-red-50 border-red-500 text-red-900 translate-x-1"
                            : "bg-white border-slate-100 hover:border-indigo-400 text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-6 relative z-10">
                        <span className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0 transition-colors",
                          showResult && isCorrect
                            ? "bg-emerald-500 text-white"
                            : showResult && isSelected && !isCorrect
                              ? "bg-red-500 text-white"
                              : "bg-slate-900 text-white group-hover:bg-indigo-600"
                        )}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-base font-black uppercase tracking-tight">{option}</span>
                      </div>
                      {showResult && isCorrect && <CheckCircle2 className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-500" size={24} />}
                    </button>
                  );
                })}
              </div>

              {selectedAnswer !== null && question.explanation && (
                <div className="mt-12 p-8 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 relative overflow-hidden animate-in slide-in-from-top-4">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Expert Explanation</p>
                  <p className="text-sm font-bold text-indigo-900 leading-relaxed uppercase">{question.explanation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Quiz Results ──────────────────────────────────────────────────
function QuizResults({ score, total, percentage, xp, courseId, lessonId }: {
  score: number;
  total: number;
  percentage: number;
  xp: number;
  courseId: string;
  lessonId: string;
}) {
  const passed = percentage >= 60;
  const earned = Math.round(xp * (percentage / 100));

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-slate-900 rounded-[4rem] border border-white/5 shadow-2xl shadow-indigo-900/20 overflow-hidden relative p-12 lg:p-20 text-white text-center">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          <div className={`w-24 h-24 rounded-[2.5rem] bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-10 border border-white/10 shadow-inner ${passed ? 'text-amber-400' : 'text-slate-500'}`}>
            <Trophy size={48} strokeWidth={2.5} />
          </div>

          <h2 className="text-4xl font-black uppercase tracking-tight mb-4">{passed ? 'Quiz Passed!' : 'Try Again'}</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">
            Scored {score} / {total} points • Your Score {percentage}%
          </p>

          <div className="relative w-48 h-48 mx-auto mb-12">
            <svg className="w-full h-full -rotate-90">
              <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="none" className="text-white/5" />
              <circle
                cx="96" cy="96" r="88"
                stroke="currentColor" strokeWidth="12" fill="none"
                strokeDasharray={`${percentage * 5.529} 552.9`}
                className={passed ? 'text-emerald-500' : 'text-white/20'}
                style={{ transition: 'stroke-dasharray 2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-black tracking-tighter">{percentage}<span className="text-2xl text-slate-500">%</span></span>
            </div>
          </div>

          <div className="inline-flex items-center gap-4 px-8 py-4 rounded-3xl bg-white/5 border border-white/10 font-black uppercase tracking-widest text-xs text-amber-400">
            <Star size={20} fill="currentColor" />
            +{earned} XP Accumulated
          </div>
        </div>
      </Card>

      <div className="mt-12 text-center">
        <Link href="/student">
          <button className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-indigo-500 transition-all flex items-center gap-2 mx-auto">
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}
