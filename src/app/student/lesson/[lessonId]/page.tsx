'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getLessonData, completeLessonAndReward } from '@/modules/learning/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle2, Clock, Play, FileText, Trophy } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

type Question = {
  id: number;
  text: string;
  options: string[];
  correct_answer: string;
};

type Lesson = {
  id: string;
  title: string;
  content_type: 'video' | 'youtube' | 'ppt' | 'mcq';
  content_url: string;
  duration: number;
  quiz_data: { questions: Question[] };
  xp_reward: number;
};

export default function LessonPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function fetchLesson() {
      try {
        const data = await getLessonData(lessonId);
        if (data) {
          setLesson(data as any);
          setCourseId(data.course_id);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchLesson();
  }, [lessonId]);

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(progress);
      if (progress >= 90 && !lessonComplete) {
        completeLesson();
      }
    }
  };

  const completeLesson = async (quizPercentage?: number, isPerfect?: boolean) => {
    setLessonComplete(true);
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899']
    });

    try {
      await completeLessonAndReward(lessonId, quizPercentage, isPerfect);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);

    const questions = lesson?.quiz_data?.questions || [];
    const isCorrect = answer === questions[currentQuestion]?.correct_answer;
    const newScore = isCorrect ? quizScore + 1 : quizScore;
    if (isCorrect) setQuizScore(prev => prev + 1);

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        setQuizComplete(true);
        const finalScore = newScore;
        const totalQuestions = questions.length;
        const percentage = Math.round((finalScore / totalQuestions) * 100);
        completeLesson(percentage, finalScore === totalQuestions);
      }
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-pulse text-zinc-400">Loading lesson...</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Lesson not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={courseId ? `/student/course/${courseId}` : '/student'} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span>Back to Course</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <Clock size={16} />
              <span>{lesson.duration} min</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-bold">
              +{lesson.xp_reward} XP
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black mb-8">{lesson.title}</h1>

        {(lesson.content_type === 'video' || lesson.content_type === 'youtube') && (() => {
          const isYouTube = lesson.content_type === 'youtube' || lesson.content_url?.includes('youtube.com') || lesson.content_url?.includes('youtu.be');

          const getEmbedUrl = (url: string) => {
            if (!url) return '';
            // Convert youtube.com/watch?v=ID to youtube.com/embed/ID
            const watchMatch = url.match(/[?&]v=([^&]+)/);
            if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
            // Convert youtu.be/ID to youtube.com/embed/ID
            const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
            if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
            // Already an embed URL or other format
            if (url.includes('/embed/')) return url;
            return url;
          };

          return (
            <div className="space-y-6">
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
                {isYouTube ? (
                  <iframe
                    src={getEmbedUrl(lesson.content_url)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={lesson.content_url || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                    controls
                    className="w-full h-full"
                    onTimeUpdate={handleVideoTimeUpdate}
                  />
                )}
              </div>
              {isYouTube ? (
                <div className="space-y-4">
                  <p className="text-sm text-zinc-400">Watch the video above, then mark as complete when finished.</p>
                  {!lessonComplete && (
                    <Button onClick={() => completeLesson()} className="bg-emerald-500 hover:bg-emerald-600">
                      <CheckCircle2 size={18} className="mr-2" />
                      Mark as Complete
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-zinc-400">
                    <span>Watch Progress</span>
                    <span>{Math.round(videoProgress)}%</span>
                  </div>
                  <Progress value={videoProgress} className="h-2" />
                  <p className="text-xs text-zinc-500">Complete 90% of the video to unlock the next lesson</p>
                </div>
              )}
            </div>
          );
        })()}

        {lesson.content_type === 'ppt' && (
          <div className="space-y-6">
            <div className="aspect-video bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex items-center justify-center">
              {lesson.content_url ? (
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(lesson.content_url)}&embedded=true`}
                  className="w-full h-full"
                />
              ) : (
                <div className="text-center p-12">
                  <FileText size={64} className="mx-auto text-zinc-600 mb-4" />
                  <p className="text-zinc-400">PDF presentation placeholder</p>
                  <Button className="mt-6" onClick={() => completeLesson()}>
                    Mark as Complete
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {lesson.content_type === 'mcq' && (
          <div className="max-w-2xl mx-auto">
            {!quizComplete ? (
              <QuizPlayer
                questions={lesson.quiz_data?.questions || []}
                currentQuestion={currentQuestion}
                selectedAnswer={selectedAnswer}
                onSelect={handleAnswerSelect}
              />
            ) : (
              <QuizResults
                score={quizScore}
                total={lesson.quiz_data?.questions?.length || 0}
                xp={lesson.xp_reward}
              />
            )}
          </div>
        )}

        <AnimatePresence>
          {lessonComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center"
            >
              <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-emerald-400 mb-2">Lesson Complete!</h3>
              <p className="text-zinc-400 mb-6">You earned {lesson.xp_reward} XP</p>
              <Link href={courseId ? `/student/course/${courseId}` : '/student'}>
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600">
                  Continue Journey
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function QuizPlayer({ questions, currentQuestion, selectedAnswer, onSelect }: {
  questions: Question[];
  currentQuestion: number;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
}) {
  const question = questions[currentQuestion];
  if (!question) return null;

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-8">
        <div className="flex justify-between items-center mb-6">
          <span className="text-zinc-400 text-sm">Question {currentQuestion + 1} of {questions.length}</span>
          <Progress value={((currentQuestion + 1) / questions.length) * 100} className="w-32 h-2" />
        </div>

        <h2 className="text-2xl font-bold mb-8">{question.text}</h2>

        <div className="space-y-3">
          {question.options.map((option, i) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === question.correct_answer;
            const showResult = selectedAnswer !== null;

            return (
              <motion.button
                key={i}
                whileHover={{ scale: selectedAnswer ? 1 : 1.02 }}
                whileTap={{ scale: selectedAnswer ? 1 : 0.98 }}
                onClick={() => onSelect(option)}
                disabled={selectedAnswer !== null}
                className={`w-full p-4 rounded-xl text-left transition-all border-2 ${showResult && isCorrect
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : showResult && isSelected && !isCorrect
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-zinc-800 border-zinc-700 hover:border-primary'
                  }`}
              >
                <span className="font-medium">{String.fromCharCode(65 + i)}. {option}</span>
              </motion.button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function QuizResults({ score, total, xp }: { score: number; total: number; xp: number }) {
  const percentage = Math.round((score / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-12">
          <Trophy size={64} className="mx-auto text-yellow-500 mb-6" />
          <h2 className="text-3xl font-black mb-2">Quiz Complete!</h2>
          <p className="text-zinc-400 mb-8">You scored {score} out of {total}</p>

          <div className="relative w-32 h-32 mx-auto mb-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-zinc-800"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${percentage * 3.52} 352`}
                className={percentage >= 70 ? 'text-emerald-500' : 'text-orange-500'}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-black">{percentage}%</span>
            </div>
          </div>

          <div className="px-4 py-2 rounded-full bg-primary/20 text-primary inline-block">
            +{Math.round(xp * (score / total))} XP Earned
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
