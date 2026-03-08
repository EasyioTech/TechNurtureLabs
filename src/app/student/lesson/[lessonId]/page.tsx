'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { getLessonData, completeLessonAndReward, saveVideoProgress, updateTimeSpent } from '@/components/learning/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, CheckCircle2, Clock, Play, FileText, Trophy,
  Zap, ExternalLink, AlertCircle, ChevronRight, MonitorPlay,
  HelpCircle, BookOpen, User, Star, Maximize2, Minimize2, ShieldAlert,
  Timer
} from 'lucide-react';
import Link from 'next/link';
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
  };
  questions: Question[];
};

type Lesson = {
  id: string;
  title: string;
  content_type: 'video' | 'ppt' | 'pdf' | 'quiz';
  content_url: string | null;
  duration: number;
  xp_reward: number;
  course_id: string;
  quiz_data: QuizData | null;
};

import { VideoPlayer } from '@/components/video/video-player';
import { PDFViewer } from '@/components/learning/pdf-viewer';
import { PPTViewer } from '@/components/learning/ppt-viewer';

// ─── Content type helpers ──────────────────────────────────────────
const CONTENT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  video: { label: 'Video Lesson', icon: Play, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  ppt: { label: 'Presentation', icon: MonitorPlay, color: 'text-sky-600 bg-sky-50 border-sky-100' },
  pdf: { label: 'Document', icon: FileText, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
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

  // Time spent tracking
  useEffect(() => {
    const interval = setInterval(() => {
      if (!lessonComplete && lessonId) {
        updateTimeSpent(lessonId, 10);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [lessonComplete, lessonId]);

  // Global Security Measures (Disable inspect element, right click)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
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
      try {
        const data = await getLessonData(lessonId);
        if (data) setLesson(data as any);
      } catch (err) {
        console.error('Failed to load lesson:', err);
      }
      setLoading(false);
    }
    fetchLesson();
  }, [lessonId]);

  const completeLesson = useCallback(async (quizPercentage?: number, isPerfect?: boolean) => {
    if (lessonComplete) return;
    setLessonComplete(true);
    try {
      await completeLessonAndReward(lessonId, quizPercentage, isPerfect);
    } catch (err) { console.error('Failed to record completion:', err); }
  }, [lessonId, lessonComplete]);

  // Safe configuration lookup
  const currentConfig = lesson ? (CONTENT_CONFIG[lesson.content_type] || CONTENT_CONFIG.video) : CONTENT_CONFIG.video;
  const DynamicIcon = currentConfig.icon;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-8 font-sans">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 border-[6px] border-slate-100 rounded-full" />
          <div className="absolute inset-0 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <DynamicIcon size={40} className="text-slate-900" />
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 mx-auto mb-8 border border-red-100">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4 leading-none">Lesson Locked</h2>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-10 leading-relaxed">This lesson is either not available yet or you need to enroll first.</p>
          <Link href="/student">
            <Button className="w-full bg-slate-950 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-[10px]">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-700 font-sans selection:bg-indigo-100 selection:text-indigo-900",
      isFocusMode ? "bg-slate-950 text-white" : "bg-slate-50/30 text-slate-900 pb-32"
    )}>
      {/* Premium Header */}
      {!isFocusMode && (
        <header className="sticky top-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-slate-100 lg:px-12 px-6 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-6">
            <Link href={`/student/course/${lesson.course_id}`}>
              <button className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all hover:scale-105 active:scale-95 shadow-sm">
                <ArrowLeft size={18} />
              </button>
            </Link>
            <div className="h-6 w-px bg-slate-100" />
            <div className="min-w-0">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-0.5">Lesson Mode</p>
              <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate max-w-[200px] md:max-w-md">
                {lesson.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsFocusMode(true)}
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-100 bg-white text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
            >
              <Maximize2 size={14} /> Focus Mode
            </button>
            <div className="h-6 w-px bg-slate-100 hidden sm:block" />
            <div className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${currentConfig.color}`}>
              <DynamicIcon size={14} strokeWidth={3} />
              {currentConfig.label}
            </div>
            <div className="h-6 w-px bg-slate-100 hidden sm:block" />
            <div className="flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-2xl border border-amber-100 text-[10px] font-black uppercase tracking-widest shadow-sm">
              <Star size={14} fill="currentColor" />
              +{lesson.xp_reward} XP
            </div>
          </div>
        </header>
      )}

      {isFocusMode && (
        <div className="fixed top-8 right-8 z-[100] animate-in fade-in duration-500">
          <button
            onClick={() => setIsFocusMode(false)}
            className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all transform hover:rotate-90"
            title="Exit Focus Mode"
          >
            <Minimize2 size={24} />
          </button>
        </div>
      )}

      <main className={cn(
        "mx-auto transition-all duration-700 animate-in fade-in slide-in-from-bottom-4",
        isFocusMode ? "max-w-[1400px] py-12 px-12" : "max-w-[1200px] px-6 lg:px-12 py-12 lg:py-20 "
      )}>
        <div className={cn("mb-12", isFocusMode && "text-center")}>
          <div className={cn("flex flex-wrap items-center gap-3 mb-6", isFocusMode && "justify-center")}>
            <Badge className={cn(
              "border-0 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest",
              isFocusMode ? "bg-white/10 text-white" : "bg-slate-900 text-white"
            )}>{lesson.content_type.toUpperCase()} CONTENT</Badge>
            <Badge className={cn(
              "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm",
              isFocusMode ? "bg-white/5 border-white/10 text-white/40" : "bg-white border-slate-100 text-slate-400"
            )}>
              <Clock size={12} />
              Estimated {lesson.duration}m
            </Badge>
          </div>
          <h1 className={cn(
            "font-black uppercase tracking-tight leading-none mb-6",
            isFocusMode ? "text-4xl lg:text-7xl text-white" : "text-3xl lg:text-5xl text-slate-900"
          )}>
            {lesson.title}
          </h1>
          {!isFocusMode && (
            <p className="text-slate-500 font-medium max-w-2xl text-lg leading-relaxed">
              {lesson.description || `In this lesson, you will explore everything about ${lesson.title}. Follow along carefully to complete the lesson and earn your rewards.`}
            </p>
          )}
        </div>

        <div className="relative">
          {/* ── VIDEO ── */}
          {lesson.content_type === 'video' && lesson.content_url && (
            <VideoPlayer
              src={lesson.content_url}
              lessonId={lessonId}
              onComplete={() => completeLesson()}
            />
          )}

          {/* ── PDF ── */}
          {lesson.content_type === 'pdf' && lesson.content_url && (
            <PDFViewer
              url={lesson.content_url}
              onComplete={() => completeLesson()}
              lessonComplete={lessonComplete}
            />
          )}

          {/* ── PPT / Slides ── */}
          {lesson.content_type === 'ppt' && lesson.content_url && (
            <PPTViewer
              url={lesson.content_url}
              onComplete={() => completeLesson()}
              lessonComplete={lessonComplete}
            />
          )}

          {/* ── QUIZ ── */}
          {lesson.content_type === 'quiz' && (
            <QuizEngine
              quizData={lesson.quiz_data}
              lessonXp={lesson.xp_reward}
              lessonComplete={lessonComplete}
              onComplete={completeLesson}
            />
          )}
        </div>

        {/* ── Completion Banner ── */}
        {lessonComplete && lesson.content_type !== 'quiz' && (
          <div className="mt-16 p-12 rounded-[4rem] bg-slate-950 text-white text-center shadow-[0_40px_80px_-20px_rgba(30,41,59,0.3)] relative overflow-hidden border border-white/5 animate-in zoom-in-95 duration-700">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]" />

            <div className="relative z-10 max-w-md mx-auto">
              <div className="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center border border-white/10 mx-auto mb-8 shadow-2xl">
                <CheckCircle2 size={40} className="text-emerald-400" strokeWidth={3} />
              </div>
              <h3 className="text-4xl font-black uppercase tracking-tight mb-4">Lesson Complete</h3>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-10">
                Excellent effort! You have earned <span className="text-emerald-400 font-black">+{lesson.xp_reward} XP</span>.
              </p>
              <Link href={`/student/course/${lesson.course_id}`}>
                <button className="group w-full bg-white text-slate-950 h-16 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-400 hover:text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl flex items-center justify-center gap-3">
                  Back to Course <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        )}
      </main>
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
