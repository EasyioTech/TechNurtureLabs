'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getLessonData, completeLessonAndReward, saveVideoProgress } from '@/components/learning/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, CheckCircle2, Clock, Play, FileText, Trophy,
  Zap, ExternalLink, AlertCircle, ChevronRight, MonitorPlay,
  HelpCircle, BookOpen, User, Star
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

// ─── Content type helpers ──────────────────────────────────────────
const CONTENT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  video: { label: 'Video Lesson', icon: Play, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  ppt: { label: 'Presentation', icon: MonitorPlay, color: 'text-sky-600 bg-sky-50 border-sky-100' },
  pdf: { label: 'Document', icon: FileText, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  quiz: { label: 'Assessment', icon: HelpCircle, color: 'text-amber-600 bg-amber-50 border-amber-100' },
};

function isYouTubeUrl(url: string) {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

function toYouTubeEmbed(url: string) {
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?rel=0`;
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?rel=0`;
  if (url.includes('/embed/')) return url;
  return url;
}

function toGoogleDocsViewer(url: string) {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
}

// ─── Main Page ────────────────────────────────────────────────────
export default function LessonPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveProgressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setVideoProgress(pct);
    // Throttle save to every 5 seconds
    if (saveProgressRef.current) clearTimeout(saveProgressRef.current);
    saveProgressRef.current = setTimeout(() => saveVideoProgress(lessonId, pct), 5000);
    if (pct >= 90 && !lessonComplete) completeLesson();
  };

  // Safe configuration lookup
  const currentConfig = lesson ? (CONTENT_CONFIG[lesson.content_type] || CONTENT_CONFIG.video) : CONTENT_CONFIG.video;
  const DynamicIcon = currentConfig.icon;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-8">
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
    <div className="min-h-screen bg-slate-50/30 text-slate-900 pb-32">
      {/* Simplified Premium Header */}
      <header className="sticky top-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-slate-100 lg:px-12 px-6 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Link href={`/student/course/${lesson.course_id}`}>
            <button className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all">
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
          <div className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${currentConfig.color}`}>
            <DynamicIcon size={14} strokeWidth={3} />
            {currentConfig.label}
          </div>
          <div className="h-6 w-px bg-slate-100 hidden sm:block" />
          <div className="flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-2xl border border-amber-100 text-[10px] font-black uppercase tracking-widest">
            <Star size={14} fill="currentColor" />
            +{lesson.xp_reward} XP
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 lg:px-12 py-12 lg:py-20">
        <div className="mb-12">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge className="bg-slate-900 text-white border-0 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">{lesson.content_type.toUpperCase()} CONTENT</Badge>
            <Badge className="bg-white border-slate-100 text-slate-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
              <Clock size={12} />
              Estimated {lesson.duration}m
            </Badge>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tight leading-none mb-6">Learning Topic: {lesson.title}</h1>
        </div>

        <div className="relative">
          {/* ── VIDEO ── */}
          {lesson.content_type === 'video' && lesson.content_url && (
            <VideoPlayer
              url={lesson.content_url}
              videoRef={videoRef}
              videoProgress={videoProgress}
              onTimeUpdate={handleVideoTimeUpdate}
              lessonComplete={lessonComplete}
              onComplete={() => completeLesson()}
            />
          )}

          {/* ── PDF ── */}
          {lesson.content_type === 'pdf' && (
            <PDFViewer url={lesson.content_url} onComplete={() => completeLesson()} lessonComplete={lessonComplete} />
          )}

          {/* ── PPT / Slides ── */}
          {lesson.content_type === 'ppt' && (
            <PPTViewer url={lesson.content_url} onComplete={() => completeLesson()} lessonComplete={lessonComplete} />
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
          <div className="mt-16 p-12 rounded-[3rem] bg-slate-900 text-white text-center shadow-2xl shadow-indigo-900/10 relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]" />

            <div className="relative z-10 max-w-md mx-auto">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center border border-white/10 mx-auto mb-8 shadow-inner">
                <CheckCircle2 size={32} className="text-emerald-400" strokeWidth={3} />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tight mb-4">Lesson Complete</h3>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-10">
                Great job! You have earned <span className="text-indigo-400">+{lesson.xp_reward} XP</span>.
              </p>
              <Link href={`/student/course/${lesson.course_id}`}>
                <button className="w-full bg-white text-slate-950 h-16 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-400 hover:text-white transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                  Finish Activity <ChevronRight size={18} className="ml-2 inline-block" />
                </button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


// ─── Video Player ──────────────────────────────────────────────────
function VideoPlayer({ url, videoRef, videoProgress, onTimeUpdate, lessonComplete, onComplete }: {
  url: string;
  videoRef: React.Ref<HTMLVideoElement>;
  videoProgress: number;
  onTimeUpdate: () => void;
  lessonComplete: boolean;
  onComplete: () => void;
}) {
  const isYT = isYouTubeUrl(url);

  return (
    <div className="space-y-8">
      <div className="aspect-video bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-900/10 border border-white/5 relative group">
        {isYT ? (
          <iframe
            src={toYouTubeEmbed(url)}
            className="w-full h-full relative z-10"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={url}
            controls
            className="w-full h-full object-contain relative z-10"
            onTimeUpdate={onTimeUpdate}
          />
        )}
        <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none group-hover:opacity-0 transition-opacity" />
      </div>

      <div className={`p-8 rounded-[2.5rem] border transition-all ${lessonComplete ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border-2 transition-colors ${lessonComplete ? 'bg-white text-emerald-500 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
              {lessonComplete ? <CheckCircle2 size={32} /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </div>
            <div>
              <h4 className={`text-lg font-black uppercase tracking-tight leading-none mb-2 ${lessonComplete ? 'text-emerald-900' : 'text-slate-900'}`}>{lessonComplete ? 'Video Finished' : 'Watch & Learn'}</h4>
              <p className={`text-xs font-bold uppercase tracking-widest leading-none ${lessonComplete ? 'text-emerald-600' : 'text-slate-400'}`}>{lessonComplete ? 'You have successfully watched the video.' : 'Watch the video lesson to continue your progress.'}</p>
            </div>
          </div>

          {!isYT ? (
            <div className="flex-1 max-w-xs">
              <div className="flex items-end justify-between mb-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Stream Progress</p>
                <p className="text-sm font-black text-indigo-600 leading-none">{Math.round(videoProgress)}%</p>
              </div>
              <div className="h-4 bg-slate-100 rounded-2xl overflow-hidden p-1 border border-slate-200/50">
                <div
                  className="h-full bg-indigo-600 rounded-xl transition-all duration-300"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
            </div>
          ) : !lessonComplete && (
            <button
              onClick={onComplete}
              className="bg-slate-950 text-white px-10 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-200"
            >
              Mark as Finished
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── PDF Viewer ────────────────────────────────────────────────────
function PDFViewer({ url, onComplete, lessonComplete }: {
  url: string | null;
  onComplete: () => void;
  lessonComplete: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  if (!url) return (
    <div className="h-96 bg-white rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center p-12 text-center shadow-sm">
      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-8">
        <FileText size={40} />
      </div>
      <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">No Document Found</h4>
      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">This lesson doesn't have an attached reading document.</p>
      <button onClick={onComplete} className="bg-slate-950 text-white px-10 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-100">Skip this part</button>
    </div>
  );

  const viewerUrl = url.includes('docs.google.com')
    ? url
    : toGoogleDocsViewer(url);

  return (
    <div className="space-y-10">
      <div className="w-full bg-slate-900 rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl shadow-indigo-900/10 relative h-[80vh]">
        <iframe
          src={viewerUrl}
          className="w-full h-full relative z-10"
          onLoad={() => setLoaded(true)}
        />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-20">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
              <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}
      </div>

      <div className={`p-8 rounded-[2.5rem] border transition-all ${lessonComplete ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border-2 transition-colors ${lessonComplete ? 'bg-white text-emerald-500 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
              {lessonComplete ? <CheckCircle2 size={32} /> : <FileText size={32} />}
            </div>
            <div>
              <h4 className={`text-lg font-black uppercase tracking-tight leading-none mb-2 ${lessonComplete ? 'text-emerald-900' : 'text-slate-900'}`}>{lessonComplete ? 'Finished Reading' : 'Reading Material'}</h4>
              <p className={`text-xs font-bold uppercase tracking-widest leading-none ${lessonComplete ? 'text-emerald-600' : 'text-slate-400'}`}>{lessonComplete ? 'Reading material completed.' : 'Read through the document to continue.'}</p>
            </div>
          </div>

          {!lessonComplete && (
            <button
              onClick={onComplete}
              className="bg-slate-950 text-white px-10 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-200"
            >
              Mark Reading Successful
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <ExternalLink size={14} /> Open Document in New Tab
        </a>
      </div>
    </div>
  );
}


// ─── PPT Viewer ────────────────────────────────────────────────────
function PPTViewer({ url, onComplete, lessonComplete }: {
  url: string | null;
  onComplete: () => void;
  lessonComplete: boolean;
}) {
  if (!url) return (
    <div className="h-96 bg-white rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center p-12 text-center shadow-sm">
      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-8">
        <MonitorPlay size={40} />
      </div>
      <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Slideshow Missing</h4>
      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">This lesson doesn't have an attached slideshow.</p>
      <button onClick={onComplete} className="bg-slate-950 text-white px-10 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-100">Skip slides</button>
    </div>
  );

  const viewerUrl = url.includes('docs.google.com')
    ? url
    : toGoogleDocsViewer(url);

  return (
    <div className="space-y-10">
      <div className="w-full bg-slate-900 rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl shadow-indigo-900/10 relative h-[75vh]">
        <iframe src={viewerUrl} className="w-full h-full relative z-10" allowFullScreen />
      </div>

      <div className={`p-8 rounded-[2.5rem] border transition-all ${lessonComplete ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border-2 transition-colors ${lessonComplete ? 'bg-white text-emerald-500 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
              {lessonComplete ? <CheckCircle2 size={32} /> : <MonitorPlay size={32} />}
            </div>
            <div>
              <h4 className={`text-lg font-black uppercase tracking-tight leading-none mb-2 ${lessonComplete ? 'text-emerald-900' : 'text-slate-900'}`}>{lessonComplete ? 'Slides Reviewed' : 'Review Slides'}</h4>
              <p className={`text-xs font-bold uppercase tracking-widest leading-none ${lessonComplete ? 'text-emerald-600' : 'text-slate-400'}`}>{lessonComplete ? 'You have reviewed all the slides.' : 'Go through the slides to understand the concepts.'}</p>
            </div>
          </div>

          {!lessonComplete && (
            <button
              onClick={onComplete}
              className="bg-slate-950 text-white px-10 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-200"
            >
              Finished Review
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <ExternalLink size={14} /> View Original Slideshow
        </a>
      </div>
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

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="p-12 rounded-[3rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 text-center space-y-8">
        <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center text-amber-500 mx-auto border border-amber-100">
          <HelpCircle size={40} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Quiz Not Available</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">This quiz is currently being updated or is not yet ready.</p>
        </div>
        {!lessonComplete && (
          <button
            onClick={() => onComplete(100, false)}
            className="bg-slate-950 text-white px-12 h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-100"
          >
            Force Complete Node
          </button>
        )}
      </div>
    );
  }

  const questions = quizData.questions;
  const question = questions[currentQuestion];
  const totalPoints = questions.reduce((s, q) => s + (q.points || 1), 0);

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
    <div className="max-w-3xl mx-auto space-y-12">
      <div>
        <div className="flex items-center justify-between mb-6 px-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {currentQuestion + 1} of {questions.length}</span>
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Passing Score: {quizData.quiz.pass_percentage}%</span>
        </div>
        <div className="h-4 bg-white rounded-full overflow-hidden p-1 border border-slate-100 shadow-sm">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <Card className="bg-white border border-slate-100 rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden">
        <CardContent className="p-12 lg:p-16">
          <h2 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight mb-12 leading-tight">{question.text}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.options.map((option, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrect = i === correctIdxForDisplay;
              const showResult = selectedAnswer !== null;

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={selectedAnswer !== null}
                  className={`group relative p-6 rounded-3xl text-left transition-all duration-300 border-2
                    ${showResult && isCorrect
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 scale-[1.02]'
                      : showResult && isSelected && !isCorrect
                        ? 'bg-red-50 border-red-500 text-red-900'
                        : 'bg-white border-slate-100 hover:border-indigo-400 text-slate-700 hover:scale-[1.01]'
                    }`}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 transition-colors
                        ${showResult && isCorrect
                        ? 'bg-emerald-500 text-white'
                        : showResult && isSelected && !isCorrect
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-900 text-white group-hover:bg-indigo-600'
                      }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm font-black uppercase tracking-tight">{option}</span>
                  </div>
                  {showResult && isCorrect && <CheckCircle2 className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500" size={24} />}
                </button>
              );
            })}
          </div>

          {selectedAnswer !== null && question.explanation && (
            <div className="mt-12 p-8 rounded-3xl bg-slate-50 border border-slate-100 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Correct Answer & Explanation</p>
              <p className="text-sm font-bold text-slate-700 leading-relaxed uppercase">{question.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>
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
