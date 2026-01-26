'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
  content_type: 'video' | 'ppt' | 'mcq';
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
      const { data } = await supabase
        .from('lessons')
        .select('*, course_id')
        .eq('id', lessonId)
        .single();
      
      if (data) {
        setLesson(data);
        setCourseId(data.course_id);
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existingProgress } = await supabase
      .from('progress_tracking')
      .select('id')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .eq('status', 'completed')
      .maybeSingle();

    if (existingProgress) return;

    await supabase.from('progress_tracking').upsert({
      user_id: user.id,
      lesson_id: lessonId,
      status: 'completed',
      completed_at: new Date().toISOString()
    }, { onConflict: 'user_id,lesson_id' });

    const xpToAdd = lesson?.xp_reward || 50;
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp, total_lessons_completed, current_streak')
      .eq('id', user.id)
      .single();
    
    const newLessonsCompleted = (profile?.total_lessons_completed || 0) + 1;
    let newXp = (profile?.total_xp || 0) + xpToAdd;
    
    if (profile) {
      await supabase.from('profiles').update({
        total_xp: newXp,
        total_lessons_completed: newLessonsCompleted
      }).eq('id', user.id);
    }

    const today = new Date().toISOString().split('T')[0];
    
    const { data: lessonChallenges } = await supabase
      .from('daily_challenges')
      .select('id, target_value, xp_reward')
      .eq('is_active', true)
      .eq('challenge_type', 'lessons_completed');

    for (const challenge of lessonChallenges || []) {
      const { data: userChallenge } = await supabase
        .from('user_daily_challenges')
        .select('id, current_progress, is_completed')
        .eq('user_id', user.id)
        .eq('challenge_id', challenge.id)
        .eq('challenge_date', today)
        .maybeSingle();

      if (userChallenge?.is_completed) continue;

      const newProgress = (userChallenge?.current_progress || 0) + 1;
      const isNowComplete = newProgress >= challenge.target_value;

      await supabase.from('user_daily_challenges').upsert({
        user_id: user.id,
        challenge_id: challenge.id,
        challenge_date: today,
        current_progress: newProgress,
        is_completed: isNowComplete,
        completed_at: isNowComplete ? new Date().toISOString() : null
      }, { onConflict: 'user_id,challenge_id,challenge_date' });

      if (isNowComplete) {
        newXp += challenge.xp_reward;
        await supabase.from('profiles').update({ total_xp: newXp }).eq('id', user.id);
      }
    }

    if (quizPercentage !== undefined) {
      if (quizPercentage >= 80) {
        const { data: scoreChallenges } = await supabase
          .from('daily_challenges')
          .select('id, target_value, xp_reward')
          .eq('is_active', true)
          .eq('challenge_type', 'quiz_score');

        for (const challenge of scoreChallenges || []) {
          const { data: userChallenge } = await supabase
            .from('user_daily_challenges')
            .select('id, is_completed')
            .eq('user_id', user.id)
            .eq('challenge_id', challenge.id)
            .eq('challenge_date', today)
            .maybeSingle();

          if (!userChallenge?.is_completed) {
            await supabase.from('user_daily_challenges').upsert({
              user_id: user.id,
              challenge_id: challenge.id,
              challenge_date: today,
              current_progress: 1,
              is_completed: true,
              completed_at: new Date().toISOString()
            }, { onConflict: 'user_id,challenge_id,challenge_date' });
            
            newXp += challenge.xp_reward;
            await supabase.from('profiles').update({ total_xp: newXp }).eq('id', user.id);
          }
        }
      }

      if (isPerfect) {
        const { data: perfectChallenges } = await supabase
          .from('daily_challenges')
          .select('id, xp_reward')
          .eq('is_active', true)
          .eq('challenge_type', 'quiz_perfect');

        for (const challenge of perfectChallenges || []) {
          const { data: userChallenge } = await supabase
            .from('user_daily_challenges')
            .select('id, is_completed')
            .eq('user_id', user.id)
            .eq('challenge_id', challenge.id)
            .eq('challenge_date', today)
            .maybeSingle();

          if (!userChallenge?.is_completed) {
            await supabase.from('user_daily_challenges').upsert({
              user_id: user.id,
              challenge_id: challenge.id,
              challenge_date: today,
              current_progress: 1,
              is_completed: true,
              completed_at: new Date().toISOString()
            }, { onConflict: 'user_id,challenge_id,challenge_date' });
            
            newXp += challenge.xp_reward;
            await supabase.from('profiles').update({ total_xp: newXp }).eq('id', user.id);
          }
        }
      }
    }

    const { data: lessonAchievements } = await supabase
      .from('achievements')
      .select('id, requirement_value, xp_reward')
      .eq('requirement_type', 'total_lessons')
      .lte('requirement_value', newLessonsCompleted);

    for (const achievement of lessonAchievements || []) {
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', user.id)
        .eq('achievement_id', achievement.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from('user_achievements').insert({
          user_id: user.id,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString()
        });
        
        newXp += achievement.xp_reward;
        await supabase.from('profiles').update({ total_xp: newXp }).eq('id', user.id);
      }
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

        {lesson.content_type === 'video' && (
          <div className="space-y-6">
            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
              {lesson.content_url?.includes('youtube.com') ? (
                <iframe
                  src={lesson.content_url}
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
            {lesson.content_url?.includes('youtube.com') ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">Watch the video above, then mark as complete when finished.</p>
                {!lessonComplete && (
                  <Button onClick={completeLesson} className="bg-emerald-500 hover:bg-emerald-600">
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
        )}

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
                  <Button className="mt-6" onClick={completeLesson}>
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
                className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                  showResult && isCorrect
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
