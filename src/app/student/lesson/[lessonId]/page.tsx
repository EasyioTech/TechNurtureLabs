'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getLessonData, completeLessonAndReward, saveVideoProgress } from '@/modules/learning/actions';
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 font-medium animate-pulse">Loading lesson...</p>
      </div>
    </div>
  );

  if (!lesson) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <AlertCircle size={48} className="mx-auto text-red-500" />
        <h2 className="text-xl font-bold text-slate-800">Lesson Not Found</h2>
        <p className="text-slate-500">This lesson doesn't exist or you don't have access.</p>
        <Link href="/student"><Button variant="outline">Return to Dashboard</Button></Link>
      </div>
    </div>
  );

  const config = CONTENT_CONFIG[lesson.content_type] || CONTENT_CONFIG.video;
  const ConfigIcon = config.icon;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={`/student/course/${lesson.course_id}`} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm font-semibold">Back to Course</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className={`px-2.5 py-1 rounded border text-xs font-bold flex items-center ${config.color}`}>
              <ConfigIcon size={12} className="mr-1.5" />{config.label}
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
              <Clock size={14} /><span>{lesson.duration} min</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 text-amber-600 text-sm font-bold border border-amber-100">
              <Star size={14} fill="currentColor" />
              <span>+{lesson.xp_reward} XP</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">{lesson.title}</h1>
            <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <ConfigIcon size={16} />
              {config.label}
            </p>
          </div>
        </div>

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

        {/* ── Completion Banner ── */}
        {lessonComplete && lesson.content_type !== 'quiz' && (
          <div className="mt-8 p-8 rounded-xl bg-emerald-50 border border-emerald-100 text-center shadow-sm">
            <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
            <h3 className="text-2xl font-bold text-emerald-900 mb-2">Lesson Complete!</h3>
            <p className="text-emerald-700 mb-6 font-medium">You earned <span className="font-bold text-emerald-800">+{lesson.xp_reward} XP</span></p>
            <Link href={`/student/course/${lesson.course_id}`}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-8 font-bold border-0 shadow-sm">
                Continue Journey <ChevronRight size={18} className="ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}


// ─── Video Player ──────────────────────────────────────────────────
function VideoPlayer({ url, videoRef, videoProgress, onTimeUpdate, lessonComplete, onComplete }: {
  url: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  videoProgress: number;
  onTimeUpdate: () => void;
  lessonComplete: boolean;
  onComplete: () => void;
}) {
  const isYT = isYouTubeUrl(url);

  return (
    <div className="space-y-6">
      <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-sm border border-slate-200">
        {isYT ? (
          <iframe
            src={toYouTubeEmbed(url)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={url}
            controls
            className="w-full h-full object-contain"
            onTimeUpdate={onTimeUpdate}
          />
        )}
      </div>

      {isYT ? (
        <div className={`flex items-center justify-between p-5 rounded-xl ${lessonComplete ? 'bg-emerald-50 border border-emerald-100' : 'bg-white border border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${lessonComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              {lessonComplete ? <CheckCircle2 size={20} /> : <Play size={20} />}
            </div>
            <div>
              <p className={`font-bold ${lessonComplete ? 'text-emerald-800' : 'text-slate-800'}`}>Video Lesson</p>
              <p className={`text-sm ${lessonComplete ? 'text-emerald-600' : 'text-slate-500'}`}>Watch the full video, then mark it as complete.</p>
            </div>
          </div>
          {!lessonComplete && (
            <Button onClick={onComplete} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 border-0 shadow-sm">
              Mark Complete <CheckCircle2 size={16} className="ml-2" />
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between text-sm font-semibold text-slate-700">
            <span>Watch Progress</span>
            <span className="text-indigo-600">{Math.round(videoProgress)}%</span>
          </div>
          <Progress value={videoProgress} className="h-2 bg-slate-100 [&>div]:bg-indigo-600" />
          <p className="text-xs text-slate-500 font-medium">Watch 90% of the video to unlock the next lesson</p>
        </div>
      )}
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
    <div className="aspect-video bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-4">
      <FileText size={48} className="text-slate-300" />
      <p className="text-slate-500 font-medium">No document attached to this lesson.</p>
      <Button onClick={onComplete} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">Mark Complete</Button>
    </div>
  );

  const viewerUrl = url.includes('docs.google.com')
    ? url
    : toGoogleDocsViewer(url);

  return (
    <div className="space-y-6">
      <div className="w-full bg-slate-50 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative" style={{ height: '75vh' }}>
        <iframe
          src={viewerUrl}
          className="w-full h-full"
          onLoad={() => setLoaded(true)}
        />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <div className={`flex items-center justify-between p-5 rounded-xl shadow-sm ${lessonComplete ? 'bg-emerald-50 border border-emerald-100' : 'bg-white border border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${lessonComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
            {lessonComplete ? <CheckCircle2 size={20} /> : <FileText size={20} />}
          </div>
          <div>
            <p className={`font-bold ${lessonComplete ? 'text-emerald-800' : 'text-slate-800'}`}>Document Lesson</p>
            <p className={`text-sm ${lessonComplete ? 'text-emerald-600' : 'text-slate-500'}`}>Read through the document above, then mark it complete.</p>
          </div>
        </div>
        {!lessonComplete && (
          <Button onClick={onComplete} className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-6 font-bold border-0 shadow-sm">
            Mark Complete <CheckCircle2 size={16} className="ml-2" />
          </Button>
        )}
      </div>
      {url && (
        <div className="flex justify-end">
          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 text-sm font-semibold transition-colors">
            <ExternalLink size={14} /> Open document in a new tab
          </a>
        </div>
      )}
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
    <div className="aspect-video bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-4">
      <MonitorPlay size={48} className="text-slate-300" />
      <p className="text-slate-500 font-medium">No presentation attached to this lesson.</p>
      <Button onClick={onComplete} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">Mark Complete</Button>
    </div>
  );

  const viewerUrl = url.includes('docs.google.com')
    ? url
    : toGoogleDocsViewer(url);

  return (
    <div className="space-y-6">
      <div className="w-full bg-slate-50 rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: '70vh' }}>
        <iframe src={viewerUrl} className="w-full h-full" allowFullScreen />
      </div>
      <div className={`flex items-center justify-between p-5 rounded-xl shadow-sm ${lessonComplete ? 'bg-emerald-50 border border-emerald-100' : 'bg-white border border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${lessonComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
            {lessonComplete ? <CheckCircle2 size={20} /> : <MonitorPlay size={20} />}
          </div>
          <div>
            <p className={`font-bold ${lessonComplete ? 'text-emerald-800' : 'text-slate-800'}`}>Presentation Slides</p>
            <p className={`text-sm ${lessonComplete ? 'text-emerald-600' : 'text-slate-500'}`}>Review all slides, then mark as complete.</p>
          </div>
        </div>
        {!lessonComplete && (
          <Button onClick={onComplete} className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-6 font-bold border-0 shadow-sm">
            Mark Complete <CheckCircle2 size={16} className="ml-2" />
          </Button>
        )}
      </div>
      {url && (
        <div className="flex justify-end">
          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 text-sm font-semibold transition-colors">
            <ExternalLink size={14} /> Open presentation in a new tab
          </a>
        </div>
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

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="p-10 rounded-xl bg-white border border-slate-200 shadow-sm text-center space-y-4">
        <HelpCircle size={48} className="mx-auto text-amber-500" />
        <h3 className="text-xl font-bold text-slate-800">No Questions Yet</h3>
        <p className="text-slate-500 font-medium">This quiz doesn't have any questions configured.</p>
        {!lessonComplete && (
          <Button onClick={() => onComplete(100, false)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold border-0 mt-4">
            Mark Lesson Complete
          </Button>
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

    // Determine if correct
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress header */}
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="text-slate-500 text-sm font-semibold">Question {currentQuestion + 1} of {questions.length}</span>
        <span className="text-slate-500 text-sm font-semibold">{quizData.quiz.pass_percentage}% to pass</span>
      </div>
      <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-2 bg-slate-200 [&>div]:bg-indigo-600" />

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-8 leading-relaxed">{question.text}</h2>

          <div className="space-y-3">
            {question.options.map((option, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrect = i === correctIdxForDisplay;
              const showResult = selectedAnswer !== null;

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={selectedAnswer !== null}
                  className={`w-full p-4 rounded-xl text-left transition-colors border-2 text-sm font-bold
                    ${showResult && isCorrect
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : showResult && isSelected && !isCorrect
                        ? 'bg-red-50 border-red-500 text-red-800'
                        : 'bg-white border-slate-200 hover:border-indigo-400 text-slate-700'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-black flex-shrink-0
                        ${showResult && isCorrect
                        ? 'bg-emerald-500 text-white'
                        : showResult && isSelected && !isCorrect
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {option}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {selectedAnswer !== null && question.explanation && (
            <div className="mt-6 p-5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Explanation</p>
              <p className="text-sm font-medium text-slate-700">{question.explanation}</p>
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
    <div className="max-w-md mx-auto">
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-10 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${passed ? 'bg-amber-100 text-amber-500' : 'bg-slate-100 text-slate-400'}`}>
            <Trophy size={40} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">{passed ? 'Excellent Work!' : 'Keep Practicing!'}</h2>
          <p className="text-slate-500 font-medium mb-8">
            You scored {score} out of {total} points
          </p>

          {/* Score ring */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <svg className="w-full h-full -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-100" />
              <circle
                cx="64" cy="64" r="56"
                stroke="currentColor" strokeWidth="8" fill="none"
                strokeDasharray={`${percentage * 3.518} 351.8`}
                className={passed ? 'text-emerald-500' : 'text-slate-400'}
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-3xl font-bold text-slate-800">{percentage}%</span>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-amber-50 text-amber-600 font-bold border border-amber-100">
            <Star size={18} fill="currentColor" />
            +{earned} XP Earned
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
