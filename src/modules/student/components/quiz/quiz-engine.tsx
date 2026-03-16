'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ShieldAlert, Timer, Trophy, Star, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { QuizData } from '@/modules/student/types';
import { submitQuizAttempt } from '@/modules/student/actions';
import { toast } from 'sonner';

// ─── Quiz Results Sub-component ───
export function QuizResults({ score, total, percentage, xp, feedback, feedbackData, onComplete }: {
  score: number;
  total: number;
  percentage: number;
  xp: number;
  feedback?: string;
  feedbackData?: any[];
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
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverResults, setServerResults] = useState<any>(null);
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
      setSelectedOptionId(null);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const res = await submitQuizAttempt(quizData.quiz.id, responses);
      if (res.success) {
        setServerResults(res);
        setQuizFinished(true);
        onComplete(res.percentage, res.score === res.total);
      } else {
        toast.error("Failed to submit assessment. Please try again.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelect = (optionId: string) => {
    if (selectedOptionId !== null) return;
    setSelectedOptionId(optionId);
    setResponses(prev => ({ ...prev, [question.id]: optionId }));

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(c => c + 1);
        setSelectedOptionId(null);
      } else {
        finishQuiz();
      }
    }, 1000);
  };

  if (quizFinished || lessonComplete) {
    if (lessonComplete && !serverResults) {
        return (
            <div className="text-center p-20">
                <h2 className="text-2xl font-bold mb-4">Assessment Already Completed</h2>
                <Link href="/student" className="text-indigo-600 font-bold uppercase tracking-widest text-xs">Return to Dashboard</Link>
            </div>
        );
    }
    const pct = serverResults?.percentage || 0;
    return (
        <QuizResults 
            score={serverResults?.score || 0} 
            total={serverResults?.total || 100} 
            percentage={pct} 
            xp={lessonXp} 
            feedbackData={serverResults?.feedback}
            onComplete={finishQuiz} 
        />
    );
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
                  const isSelected = selectedOptionId === option.id;
                  const showResult = selectedOptionId !== null;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelect(option.id)}
                      disabled={selectedOptionId !== null || isSubmitting}
                      className={cn(
                        "w-full group relative p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl text-left border-2 transition-all duration-300 flex items-center gap-4 sm:gap-6",
                        isSelected ? "bg-indigo-50 border-indigo-500 text-indigo-900" :
                        "bg-slate-50/50 border-transparent hover:border-indigo-200 hover:bg-white text-slate-700"
                      )}
                    >
                      <span className={cn(
                        "w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-[10px] sm:text-xs font-black shrink-0 transition-all",
                        isSelected ? "bg-indigo-600 text-white" :
                        "bg-slate-900 text-white group-hover:bg-indigo-600"
                      )}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-[12px] sm:text-sm lg:text-base font-black uppercase tracking-tight font-outfit">{option.option_text}</span>
                    </button>
                  );
                })}
              </div>

              {isSubmitting && (
                <div className="mt-8 flex items-center justify-center gap-4 text-slate-400">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Grading Assessment...</p>
                </div>
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
