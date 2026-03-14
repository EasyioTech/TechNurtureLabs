'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ShieldAlert, Timer, Trophy, Star, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { QuizData } from '@/modules/student/types';

// ─── Quiz Results Sub-component ───
export function QuizResults({ score, total, percentage, xp, onComplete }: {
  score: number;
  total: number;
  percentage: number;
  xp: number;
  onComplete?: () => void;
}) {
  const passed = percentage >= 60;
  const earned = passed ? Math.round(xp * (percentage / 100)) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-12 px-4 shadow-outfit">
      <div className={cn(
        "p-8 sm:p-20 rounded-[2.5rem] sm:rounded-[4rem] border-2 transition-all text-center relative overflow-hidden",
        passed ? "bg-emerald-50 border-emerald-100 shadow-3xl shadow-emerald-50" : "bg-white border-slate-100 shadow-2xl"
      )}>
        <div className="relative z-10">
          <div className={cn(
             "w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 sm:mb-10 border-4 shadow-xl",
             passed ? "bg-emerald-500 text-white border-white" : "bg-slate-100 text-slate-400 border-white"
          )}>
            <Trophy size={passed ? 28 : 32} className="sm:size-40" />
          </div>

          <h2 className="text-2xl sm:text-5xl font-black uppercase tracking-tight mb-4 text-slate-900">
            {passed ? 'Assessment Mastered' : 'Analysis Incomplete'}
          </h2>
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 sm:mb-12">
            Score: {score} / {total} Points • Proficiency {percentage}%
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-xl mx-auto">
             <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reward Points</p>
                <p className="text-xl sm:text-2xl font-black text-indigo-600">+{earned} XP</p>
             </div>
             <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Accuracy</p>
                <p className="text-xl sm:text-2xl font-black text-indigo-600">{percentage}%</p>
             </div>
          </div>

          {passed ? (
             <div className="mt-8 sm:mt-12">
                <p className="text-[10px] sm:text-[11px] font-black text-emerald-600 uppercase tracking-widest flex items-center justify-center gap-3">
                   <Star size={14} className="animate-pulse" /> Completion Verified & Recorded
                </p>
             </div>
          ) : (
             <div className="mt-8 sm:mt-12 space-y-4">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Pass threshold is 60%. Please review materials and re-attempt.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-auto bg-slate-900 text-white px-10 h-14 sm:h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-[11px] hover:bg-indigo-600 transition-all shadow-xl"
                >
                  Restart Assessment
                </button>
             </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <Link href="/student">
          <button className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-indigo-500 transition-all flex items-center gap-3 mx-auto">
            <ArrowLeft size={16} /> Return to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}

// ─── Main Quiz Engine ───
export function QuizEngine({ quizData, lessonXp, lessonComplete, onComplete }: {
  quizData: QuizData;
  lessonXp: number;
  lessonComplete: boolean;
  onComplete: (score?: number, perfect?: boolean) => void;
}) {
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [strikes, setStrikes] = useState(0);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);

  const questions = quizData?.questions || [];
  const totalPoints = questions.reduce((s, q) => s + (q.points || 1), 0);
  const question = questions[currentQuestion];

  // Security Mechanisms
  useEffect(() => {
    if (!isStarted || quizFinished || lessonComplete) return;

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setStrikes(prev => {
          const newStrikes = prev + 1;
          setSecurityWarning(`Integrity Violation: Tab switch detected (Strike ${newStrikes}/3)`);
          if (newStrikes >= 3) {
            setQuizFinished(true);
            onComplete(0, false);
          }
          return newStrikes;
        });
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isStarted, quizFinished, lessonComplete, onComplete]);

  // Timer logic
  useEffect(() => {
    if (!isStarted || !question || quizFinished || lessonComplete) return;
    const limit = question.time_limit_secs || 0;
    if (limit === 0) return;

    setTimeLeft(limit);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, currentQuestion, quizFinished, lessonComplete, question]);

  if (!isStarted && !lessonComplete) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-20 animate-in fade-in slide-in-from-bottom-8 duration-700 font-outfit px-4">
        <div className="bg-white border border-slate-100 p-8 sm:p-20 rounded-[2.5rem] sm:rounded-[4rem] text-center shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative z-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 rounded-2xl sm:rounded-[2rem] flex items-center justify-center mx-auto mb-8 sm:mb-10 text-indigo-600 shadow-xl shadow-indigo-100">
              <Trophy size={28} className="sm:size-32" />
            </div>

            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-4 text-slate-900 leading-tight">Ready for Assessment?</h2>
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 sm:mb-12 leading-relaxed max-w-sm mx-auto">
              This module evaluates your proficiency. Complete all questions to earn your XP rewards.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-12">
               <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100">
                  <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Questions</p>
                  <p className="text-lg sm:text-xl font-black text-slate-900">{questions.length}</p>
               </div>
               <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100">
                  <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">XP Reward</p>
                  <p className="text-lg sm:text-xl font-black text-indigo-600">+{lessonXp}</p>
               </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => setIsStarted(true)}
                className="w-full h-14 sm:h-20 bg-slate-950 text-white rounded-2xl sm:rounded-[2rem] font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-200 active:scale-95 group"
              >
                Launch Assessment
                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </button>
              <div className="flex items-center justify-center gap-2 opacity-40">
                <ShieldAlert size={12} />
                <p className="text-[8px] font-black uppercase tracking-widest">Integrity monitoring active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (quizData?.quiz?.is_locked) {
    return (
      <div className="max-w-4xl mx-auto py-20">
        <div className="bg-white border border-slate-100 p-16 md:p-24 rounded-[3.5rem] text-center shadow-2xl relative overflow-hidden">
           <div className="relative z-10 flex flex-col items-center">
             <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center border border-amber-100 mb-8 text-amber-500">
               <ShieldAlert size={32} />
             </div>
             <h3 className="text-3xl font-black uppercase tracking-tight mb-4 text-slate-900 font-outfit">Assessment Locked</h3>
             <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest max-w-md mx-auto leading-loose font-outfit">
               {quizData.quiz.lock_reason || "Access to this assessment requires completion of all preceding modules."}
             </p>
           </div>
        </div>
      </div>
    );
  }





  const handleTimeout = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(c => c + 1);
      setSelectedAnswer(null);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setQuizFinished(true);
    const finalPct = Math.round((score / totalPoints) * 100);
    onComplete(finalPct, score === totalPoints);
  };

  const handleSelect = (optionIndex: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(optionIndex);

    let correctIdx: number;
    if (typeof question.correct_answer === 'number') {
      correctIdx = question.correct_answer;
    } else {
      correctIdx = question.options.findIndex(o =>
        o.toLowerCase().trim() === String(question.correct_answer).toLowerCase().trim()
      );
    }

    const isCorrect = optionIndex === correctIdx;
    const newScore = isCorrect ? score + (question.points || 1) : score;
    if (isCorrect) setScore(newScore);

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(c => c + 1);
        setSelectedAnswer(null);
      } else {
        setQuizFinished(true);
        const pct = Math.round((newScore / totalPoints) * 100);
        onComplete(pct, newScore === totalPoints);
      }
    }, 1500);
  };

  if (quizFinished || lessonComplete) {
    const pct = Math.round((score / totalPoints) * 100);
    return <QuizResults score={score} total={totalPoints} percentage={pct} xp={lessonXp} onComplete={finishQuiz} />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-8 font-outfit px-4 sm:px-0">
      {securityWarning && (
        <div className="bg-rose-500 text-white p-3 sm:p-4 rounded-2xl flex items-center justify-between shadow-xl">
           <div className="flex items-center gap-3">
             <ShieldAlert size={14} className="sm:size-18" />
             <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-none">{securityWarning}</p>
           </div>
           <button onClick={() => setSecurityWarning(null)}>✕</button>
        </div>
      )}

      {/* Condesed Stats Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* Progress Card */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Progress</p>
                 <span className="text-[10px] font-black text-slate-900">{currentQuestion + 1} / {questions.length}</span>
              </div>
              <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
              </div>
          </div>

          {/* Timer Card */}
          {timeLeft > 0 && (
            <div className={cn(
                "p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border shadow-sm flex flex-col justify-center",
                timeLeft < 10 ? "border-rose-100 bg-rose-50" : "bg-white border-slate-100"
            )}>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Limit</p>
                <div className={cn("flex items-center gap-2 text-sm sm:text-lg font-black", timeLeft < 10 ? "text-rose-500 animate-pulse" : "text-slate-900")}>
                   <Timer size={14} /> {timeLeft}s
                </div>
            </div>
          )}

          {/* Security Status Card */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center col-span-2 sm:col-span-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Security</p>
              <div className="flex items-center gap-2">
                 <div className={cn("w-1.5 h-1.5 rounded-full", strikes > 0 ? "bg-rose-500 animate-ping" : "bg-emerald-500 shadow-glow")} />
                 <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-900">{strikes === 0 ? "Active Protected" : `${strikes} Violations`}</span>
              </div>
          </div>

          {/* Potential Reward (Desktop Only) */}
          <div className="hidden lg:flex bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex-col justify-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Module Reward</p>
              <div className="flex items-center gap-2 text-lg font-black text-amber-600">
                 <Star size={16} fill="currentColor" /> +{lessonXp} XP
              </div>
          </div>
      </div>

      {/* Primary Content (Question & Options) */}
      <Card className="bg-white border border-slate-100 rounded-[2rem] sm:rounded-[3rem] shadow-3xl shadow-slate-100 overflow-hidden">
          <CardContent className="p-6 sm:p-10 lg:p-16">
              <div className="flex items-center gap-2 mb-8 sm:mb-12">
                <Badge className="bg-indigo-600 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black tracking-widest uppercase border-0">Question {currentQuestion + 1}</Badge>
                <Badge className="bg-amber-50 text-amber-600 px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black tracking-widest uppercase border-amber-100">+{question.points || 1} XP</Badge>
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight mb-8 sm:mb-16 leading-tight font-outfit">{question.text}</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
                {question.options.map((option, i) => {
                  const isSelected = selectedAnswer === i;
                  const showResult = selectedAnswer !== null;
                  const correctIdx = typeof question.correct_answer === 'number' ? question.correct_answer : question.options.findIndex(o => o.toLowerCase().trim() === String(question.correct_answer).toLowerCase().trim());
                  const isCorrect = i === correctIdx;

                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(i)}
                      disabled={selectedAnswer !== null}
                      className={cn(
                        "w-full group relative p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl text-left border-2 transition-all duration-300 flex items-center gap-4 sm:gap-6",
                        showResult && isCorrect ? "bg-emerald-50 border-emerald-500 text-emerald-900" :
                        showResult && isSelected && !isCorrect ? "bg-rose-50 border-rose-500 text-rose-900" :
                        "bg-slate-50/50 border-transparent hover:border-indigo-200 hover:bg-white text-slate-700"
                      )}
                    >
                      <span className={cn(
                        "w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-[10px] sm:text-xs font-black shrink-0 transition-all",
                        showResult && isCorrect ? "bg-emerald-500 text-white" :
                        showResult && isSelected && !isCorrect ? "bg-rose-500 text-white" :
                        "bg-slate-900 text-white group-hover:bg-indigo-600"
                      )}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-[12px] sm:text-sm lg:text-base font-black uppercase tracking-tight font-outfit">{option}</span>
                    </button>
                  );
                })}
              </div>

              {selectedAnswer !== null && question.explanation && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 sm:mt-12 p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-indigo-50/30 border border-indigo-100">
                    <p className="text-[8px] sm:text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 font-outfit">Explanatory Rationale</p>
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wide leading-relaxed font-outfit">{question.explanation}</p>
                </motion.div>
              )}
          </CardContent>
      </Card>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
        .shadow-glow { box-shadow: 0 0 10px rgba(16, 185, 129, 0.5); }
      `}</style>
    </div>
  );
}
