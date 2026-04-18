'use client';

import React from 'react';
import { HelpCircle, CheckCircle2, Circle, HelpCircle as QuestionIcon, Clock, Target, Trophy, Info } from 'lucide-react';
import { useAdminTheme } from '../../theme-context';
import { motion } from 'framer-motion';

interface Option {
    id: string;
    option_text: string;
    is_correct: boolean;
}

interface Question {
    id: string;
    question_text: string;
    question_type: string;
    points: number | string;
    explanation?: string | null;
    options: Option[];
}

interface Quiz {
    id: string;
    title: string;
    description: string | null;
    time_limit_secs: number | null;
    pass_percentage: number | string;
    xp_reward: number | string;
    questions: Question[];
}

interface QuizPreviewProps {
    lessonId: string;
}

export function QuizPreview({ lessonId }: QuizPreviewProps) {
    const { isDark, accent } = useAdminTheme();
    const [quiz, setQuiz] = React.useState<Quiz | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                // We use the existing action from super-admin
                const { fetchQuizAdmin } = await import('../../actions');
                const data = await fetchQuizAdmin(lessonId);
                setQuiz(data || null);
            } catch (err) {
                console.error('Failed to load quiz preview:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [lessonId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className={`w-10 h-10 border-4 ${accent.name === 'emerald' ? 'border-emerald-400' : `border-${accent.name}-400`} border-t-transparent rounded-full animate-spin`} />
                <p className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Loading Assessment Preview...</p>
            </div>
        );
    }

    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4 p-8 text-center">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                    <HelpCircle size={32} className="text-slate-400" />
                </div>
                <div>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No Quiz Configured</p>
                    <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>This lesson has the quiz type set but no questions have been added yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Quiz Header Info */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-[32px] ${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-200'} border`}>
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500">
                        <QuestionIcon size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Questions</span>
                    </div>
                    <div className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{quiz.questions.length}</div>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Clock size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Time Limit</span>
                    </div>
                    <div className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {(!quiz.time_limit_secs || quiz.time_limit_secs === 0) ? 'Unlimited' : `${Math.floor(quiz.time_limit_secs / 60)}m`}
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Target size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Passing Score</span>
                    </div>
                    <div className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{quiz.pass_percentage}%</div>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Trophy size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">XP Reward</span>
                    </div>
                    <div className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{quiz.xp_reward} XP</div>
                </div>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
                <h3 className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} px-2`}>Question Structure</h3>
                {quiz.questions.map((q, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={q.id || idx}
                        className={`p-6 md:p-8 rounded-[32px] ${isDark ? 'bg-[#11141B] border-white/5' : 'bg-white border-slate-200 shadow-sm'} border relative overflow-hidden`}
                    >
                        <div className={`absolute top-0 right-0 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                            {q.points} PTS
                        </div>

                        <div className="flex gap-4">
                            <div className={`w-8 h-8 rounded-xl ${accent.bg} text-slate-900 flex items-center justify-center font-black text-xs shrink-0 shadow-lg`}>
                                {idx + 1}
                            </div>
                            <div className="flex-1 space-y-6">
                                <h4 className={`text-base md:text-lg font-black leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {q.question_text}
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {(q.options || []).map((opt, oIdx) => (
                                        <div 
                                            key={opt.id || oIdx}
                                            className={`p-4 rounded-2xl flex items-center gap-3 border transition-all ${
                                                opt.is_correct 
                                                    ? `${isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}` 
                                                    : `${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'}`
                                            }`}
                                        >
                                            <div className="shrink-0">
                                                {opt.is_correct ? (
                                                    <CheckCircle2 size={16} className="text-emerald-500 font-bold" />
                                                ) : (
                                                    <Circle size={16} className={isDark ? 'text-slate-700' : 'text-slate-300'} />
                                                )}
                                            </div>
                                            <span className={`text-xs md:text-sm font-bold ${
                                                opt.is_correct 
                                                    ? (isDark ? 'text-emerald-400' : 'text-emerald-700') 
                                                    : (isDark ? 'text-slate-400' : 'text-slate-600')
                                            }`}>
                                                {opt.option_text}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {q.explanation && (
                                    <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-indigo-50 border-indigo-100'} border flex gap-3`}>
                                        <Info size={16} className={isDark ? 'text-slate-400' : 'text-indigo-500'} />
                                        <div className="space-y-1">
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-indigo-400'}`}>Explanation</span>
                                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} font-medium`}>{q.explanation}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
