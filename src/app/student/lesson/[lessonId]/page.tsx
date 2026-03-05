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
  HelpCircle, BookOpen
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

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
  video: { label: 'Video Lesson', icon: Play, color: 'text-violet-400' },
  ppt: { label: 'Presentation', icon: MonitorPlay, color: 'text-blue-400' },
  pdf: { label: 'Document', icon: FileText, color: 'text-emerald-400' },
  quiz: { label: 'Assessment', icon: HelpCircle, color: 'text-amber-400' },
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
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#10b981', '#8b5cf6', '#f59e0b', '#ec4899'] });
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
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-zinc-400 text-sm font-medium animate-pulse">Loading your lesson...</p>
      </div>
    </div>
  );

  if (!lesson) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center space-y-4">
        <AlertCircle size={48} className="mx-auto text-red-400" />
        <h2 className="text-xl font-bold text-white">Lesson Not Found</h2>
        <p className="text-zinc-400">This lesson doesn't exist or you don't have access.</p>
        <Link href="/student"><Button variant="outline">Return to Dashboard</Button></Link>
      </div>
    </div>
  );

  const config = CONTENT_CONFIG[lesson.content_type] || CONTENT_CONFIG.video;
  const ConfigIcon = config.icon;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={`/student/course/${lesson.course_id}`} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to Course</span>
          </Link>
          <div className="flex items-center gap-3">
            <Badge className={`bg-zinc-800 border-zinc-700 text-xs font-bold ${config.color}`}>
              <ConfigIcon size={10} className="mr-1.5" />{config.label}
            </Badge>
            <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
              <Clock size={14} /><span>{lesson.duration} min</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-sm font-bold border border-amber-500/20">
              +{lesson.xp_reward} XP
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">{lesson.title}</h1>
          <p className={`text-sm ${config.color} font-semibold`}>{config.label}</p>
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
        <AnimatePresence>
          {lessonComplete && lesson.content_type !== 'quiz' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center"
            >
              <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
              <h3 className="text-2xl font-black text-emerald-400 mb-2">Lesson Complete! 🎉</h3>
              <p className="text-zinc-400 mb-6">You earned <span className="text-amber-400 font-bold">+{lesson.xp_reward} XP</span></p>
              <Link href={`/student/course/${lesson.course_id}`}>
                <Button className="bg-emerald-500 hover:bg-emerald-600 rounded-full h-12 px-8 font-bold">
                  Continue Journey <ChevronRight size={18} className="ml-1" />
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
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
    <div className="space-y-5">
      <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
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
            className="w-full h-full"
            onTimeUpdate={onTimeUpdate}
          />
        )}
      </div>

      {isYT ? (
        <div className={`flex items-center justify-between p-5 rounded-xl ${lessonComplete ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-zinc-900 border border-zinc-800'}`}>
          <p className="text-sm text-zinc-400">Watch the full video, then mark it as complete.</p>
          {!lessonComplete && (
            <Button onClick={onComplete} className="rounded-full bg-emerald-500 hover:bg-emerald-600 h-10 px-6 font-bold">
              <CheckCircle2 size={16} className="mr-2" /> Mark Complete
            </Button>
          )}
          {lessonComplete && <CheckCircle2 size={24} className="text-emerald-400" />}
        </div>
      ) : (
        <div className="space-y-2 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
          <div className="flex justify-between text-sm text-zinc-400">
            <span>Watch Progress</span>
            <span className="font-bold text-white">{Math.round(videoProgress)}%</span>
          </div>
          <Progress value={videoProgress} className="h-2" />
          <p className="text-xs text-zinc-600">Watch 90% of the video to unlock the next lesson</p>
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
    <div className="aspect-video bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center gap-4">
      <FileText size={56} className="text-zinc-600" />
      <p className="text-zinc-500 text-sm">No document attached to this lesson.</p>
      <Button onClick={onComplete} className="rounded-full bg-emerald-500 hover:bg-emerald-600">Mark Complete</Button>
    </div>
  );

  const viewerUrl = url.includes('docs.google.com')
    ? url
    : toGoogleDocsViewer(url);

  return (
    <div className="space-y-5">
      <div className="w-full bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl" style={{ height: '75vh' }}>
        <iframe
          src={viewerUrl}
          className="w-full h-full"
          onLoad={() => setLoaded(true)}
        />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <div className={`flex items-center justify-between p-5 rounded-xl ${lessonComplete ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-zinc-900 border border-zinc-800'}`}>
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-emerald-400" />
          <div>
            <p className="text-sm font-bold text-white">Document Lesson</p>
            <p className="text-xs text-zinc-500">Read through the document above, then mark it complete.</p>
          </div>
        </div>
        {!lessonComplete ? (
          <Button onClick={onComplete} className="rounded-full bg-emerald-500 hover:bg-emerald-600 h-10 px-6 font-bold">
            <CheckCircle2 size={16} className="mr-2" /> Mark Complete
          </Button>
        ) : (
          <CheckCircle2 size={24} className="text-emerald-400" />
        )}
      </div>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm transition-colors">
          <ExternalLink size={14} /> Open document in a new tab
        </a>
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
    <div className="aspect-video bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center gap-4">
      <MonitorPlay size={56} className="text-zinc-600" />
      <p className="text-zinc-500 text-sm">No presentation attached to this lesson.</p>
      <Button onClick={onComplete} className="rounded-full bg-emerald-500 hover:bg-emerald-600">Mark Complete</Button>
    </div>
  );

  // Google Slides / Office Online / raw PPT — use Google Docs viewer
  const viewerUrl = url.includes('docs.google.com')
    ? url
    : toGoogleDocsViewer(url);

  return (
    <div className="space-y-5">
      <div className="w-full bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl" style={{ height: '70vh' }}>
        <iframe src={viewerUrl} className="w-full h-full" allowFullScreen />
      </div>
      <div className={`flex items-center justify-between p-5 rounded-xl ${lessonComplete ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-zinc-900 border border-zinc-800'}`}>
        <div className="flex items-center gap-3">
          <MonitorPlay size={20} className="text-blue-400" />
          <div>
            <p className="text-sm font-bold text-white">Presentation Slides</p>
            <p className="text-xs text-zinc-500">Review all slides, then mark as complete.</p>
          </div>
        </div>
        {!lessonComplete ? (
          <Button onClick={onComplete} className="rounded-full bg-emerald-500 hover:bg-emerald-600 h-10 px-6 font-bold">
            <CheckCircle2 size={16} className="mr-2" /> Mark Complete
          </Button>
        ) : (
          <CheckCircle2 size={24} className="text-emerald-400" />
        )}
      </div>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm transition-colors">
          <ExternalLink size={14} /> Open presentation in a new tab
        </a>
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
      <div className="p-10 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-4">
        <HelpCircle size={48} className="mx-auto text-amber-400" />
        <h3 className="text-xl font-bold">No Questions Yet</h3>
        <p className="text-zinc-400">This quiz doesn't have any questions configured yet.</p>
        {!lessonComplete && (
          <Button onClick={() => onComplete(100, false)} className="rounded-full bg-emerald-500 hover:bg-emerald-600">
            Complete Lesson
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
      // Try finding the index of the matching string in options
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
        // Quiz finished
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

  // Determine correct index for display
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
      <div className="flex items-center justify-between mb-2">
        <span className="text-zinc-400 text-sm">Question {currentQuestion + 1} of {questions.length}</span>
        <span className="text-zinc-400 text-sm">{quizData.quiz.pass_percentage}% to pass</span>
      </div>
      <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-1.5" />

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-8">
          <h2 className="text-xl font-bold mb-8 leading-relaxed">{question.text}</h2>

          <div className="space-y-3">
            {question.options.map((option, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrect = i === correctIdxForDisplay;
              const showResult = selectedAnswer !== null;

              return (
                <motion.button
                  key={i}
                  whileHover={{ scale: selectedAnswer !== null ? 1 : 1.01 }}
                  whileTap={{ scale: selectedAnswer !== null ? 1 : 0.99 }}
                  onClick={() => handleSelect(i)}
                  disabled={selectedAnswer !== null}
                  className={`w-full p-4 rounded-xl text-left transition-all duration-300 border-2 text-sm font-medium
                                        ${showResult && isCorrect
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                      : showResult && isSelected && !isCorrect
                        ? 'bg-red-500/15 border-red-500 text-red-300'
                        : 'bg-zinc-800 border-zinc-700 hover:border-violet-500 text-white'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0
                                            ${showResult && isCorrect
                        ? 'bg-emerald-500 text-white'
                        : showResult && isSelected && !isCorrect
                          ? 'bg-red-500 text-white'
                          : 'bg-zinc-700 text-zinc-300 group-hover:bg-violet-600'
                      }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {option}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          {selectedAnswer !== null && question.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl bg-zinc-800 border border-zinc-700"
            >
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Explanation</p>
              <p className="text-sm text-zinc-300">{question.explanation}</p>
            </motion.div>
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto"
    >
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-10 text-center">
          <Trophy size={56} className={`mx-auto mb-6 ${passed ? 'text-amber-400' : 'text-zinc-500'}`} />
          <h2 className="text-3xl font-black mb-2">{passed ? 'Excellent Work! 🎉' : 'Keep Practicing!'}</h2>
          <p className="text-zinc-400 mb-8 text-sm">
            You scored {score} of {total} points
          </p>

          {/* Score ring */}
          <div className="relative w-28 h-28 mx-auto mb-8">
            <svg className="w-full h-full -rotate-90">
              <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="none" className="text-zinc-800" />
              <circle
                cx="56" cy="56" r="48"
                stroke="currentColor" strokeWidth="8" fill="none"
                strokeDasharray={`${percentage * 3.016} 301.6`}
                className={passed ? 'text-emerald-500' : 'text-orange-500'}
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-black">{percentage}%</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/10 text-amber-400 font-bold text-sm border border-amber-500/20">
            <Zap size={14} />
            +{earned} XP Earned
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
