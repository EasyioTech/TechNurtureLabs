'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Check, X, GripVertical, Settings2, Info } from 'lucide-react';
import { useAdminTheme, t } from '../theme-context';
import { fetchQuizAdmin, saveQuizAdmin } from '../actions';
import { toast } from 'sonner';

interface Question {
    id?: string;
    question_text: string;
    question_type: string;
    options: string[];
    correct_answer: any;
    explanation: string;
    points: number;
}

interface Quiz {
    id?: string;
    lesson_id: string;
    course_id: string;
    title: string;
    description: string;
    time_limit_secs: number;
    pass_percentage: number;
    max_attempts: number;
    xp_reward: number;
    is_published: boolean;
    questions: Question[];
}

interface QuizEditorProps {
    lessonId: string;
    courseId: string;
    isDark: boolean;
}

export function QuizEditor({ lessonId, courseId, isDark }: QuizEditorProps) {
    const [quiz, setQuiz] = React.useState<Quiz | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const data = await fetchQuizAdmin(lessonId);
                if (data) {
                    setQuiz({
                        ...data,
                        pass_percentage: Number(data.pass_percentage),
                        questions: (data.questions || []).map((q: any) => ({
                            ...q,
                            options: Array.isArray(q.options) ? q.options : [],
                            correct_answer: q.correct_answer || (q.question_type === 'mcq' ? 0 : false)
                        }))
                    } as any);
                } else {
                    setQuiz({
                        lesson_id: lessonId,
                        course_id: courseId,
                        title: 'Lesson Knowledge Check',
                        description: '',
                        time_limit_secs: 0,
                        pass_percentage: 60,
                        max_attempts: 3,
                        xp_reward: 20,
                        is_published: true,
                        questions: []
                    });
                }
            } catch (err) {
                console.error('Failed to load quiz:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [lessonId, courseId]);

    const handleSave = async () => {
        if (!quiz) return;
        setSaving(true);
        try {
            const saved = await saveQuizAdmin(quiz);
            setQuiz({
                ...saved,
                pass_percentage: Number(saved.pass_percentage)
            } as any);
            toast.success('Quiz architecture synchronized successfully');
        } catch (err) {
            console.error('Save failed:', err);
            toast.error('Failed to save quiz configurations');
        } finally {
            setSaving(false);
        }
    };

    const addQuestion = () => {
        if (!quiz) return;
        setQuiz({
            ...quiz,
            questions: [
                ...quiz.questions,
                {
                    question_text: '',
                    question_type: 'mcq',
                    options: ['Option A', 'Option B', 'Option C', 'Option D'],
                    correct_answer: 0,
                    explanation: '',
                    points: 1
                }
            ]
        });
    };

    const deleteQuestion = (index: number) => {
        if (!quiz) return;
        const newQs = [...quiz.questions];
        newQs.splice(index, 1);
        setQuiz({ ...quiz, questions: newQs });
    };

    const updateQuestion = (index: number, updates: Partial<Question>) => {
        if (!quiz) return;
        const newQs = [...quiz.questions];
        newQs[index] = { ...newQs[index], ...updates };
        setQuiz({ ...quiz, questions: newQs });
    };

    if (loading) return (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-lime-400 border-t-transparent rounded-full animate-spin" />
            <p className={`text-xs font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Initializing Quiz Engine...</p>
        </div>
    );

    if (!quiz) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Quiz Settings */}
            <div className={`p-6 rounded-[32px] border-2 space-y-6 ${t.border(isDark)} ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-lime-400 text-slate-900' : 'bg-slate-900 text-white'}`}>
                        <Settings2 size={18} />
                    </div>
                    <div>
                        <h4 className={`text-sm font-black uppercase tracking-tight ${t.textPrimary(isDark)}`}>Quiz Configuration</h4>
                        <p className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>Define assessment parameters and rewards.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <Label className={`text-[10px] font-black uppercase tracking-wider ${t.textSecondary(isDark)} pl-1`}>Time Limit (Sec)</Label>
                        <Input
                            type="number"
                            value={quiz.time_limit_secs}
                            onChange={(e) => setQuiz({ ...quiz, time_limit_secs: parseInt(e.target.value) || 0 })}
                            className={`rounded-full h-10 border-2 font-black text-xs ${isDark ? 'bg-transparent border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className={`text-[10px] font-black uppercase tracking-wider ${t.textSecondary(isDark)} pl-1`}>Pass Score (%)</Label>
                        <Input
                            type="number"
                            value={quiz.pass_percentage}
                            onChange={(e) => setQuiz({ ...quiz, pass_percentage: parseInt(e.target.value) || 60 })}
                            className={`rounded-full h-10 border-2 font-black text-xs ${isDark ? 'bg-transparent border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className={`text-[10px] font-black uppercase tracking-wider ${t.textSecondary(isDark)} pl-1`}>Max Attempts</Label>
                        <Input
                            type="number"
                            value={quiz.max_attempts}
                            onChange={(e) => setQuiz({ ...quiz, max_attempts: parseInt(e.target.value) || 3 })}
                            className={`rounded-full h-10 border-2 font-black text-xs ${isDark ? 'bg-transparent border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className={`text-[10px] font-black uppercase tracking-wider ${t.textSecondary(isDark)} pl-1`}>XP Reward</Label>
                        <Input
                            type="number"
                            value={quiz.xp_reward}
                            onChange={(e) => setQuiz({ ...quiz, xp_reward: parseInt(e.target.value) || 20 })}
                            className={`rounded-full h-10 border-2 font-black text-xs ${isDark ? 'bg-transparent border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        />
                    </div>
                </div>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/5 text-lime-400' : 'bg-slate-100 text-slate-900'}`}>
                            <Info size={14} />
                        </div>
                        <h4 className={`text-sm font-black uppercase tracking-tight ${t.textPrimary(isDark)}`}>Assessing Content ({quiz.questions.length})</h4>
                    </div>
                    <Button
                        onClick={addQuestion}
                        className={`rounded-full h-9 px-4 text-[10px] font-black gap-2 ${isDark ? 'bg-lime-400 text-slate-900 hover:bg-lime-500 shadow-lg shadow-lime-400/20' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                    >
                        <Plus size={14} strokeWidth={3} /> ADD QUESTION
                    </Button>
                </div>

                <div className="space-y-6">
                    {quiz.questions.map((q, qIdx) => (
                        <div key={qIdx} className={`p-6 rounded-[32px] border-2 transition-all ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                                        {qIdx + 1}
                                    </div>
                                    <div className={`w-[1px] h-full ${isDark ? 'bg-white/5' : 'bg-slate-50'}`} />
                                    <button
                                        onClick={() => deleteQuestion(qIdx)}
                                        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="flex-1 space-y-6">
                                    <div className="space-y-1.5">
                                        <Label className={`text-[10px] font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Question Fragment</Label>
                                        <Textarea
                                            value={q.question_text}
                                            onChange={(e) => updateQuestion(qIdx, { question_text: e.target.value })}
                                            placeholder="What is the primary function of...?"
                                            className={`rounded-2xl min-h-[80px] border-2 font-medium text-sm transition-all focus:border-lime-400/50 ${isDark ? 'bg-transparent border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <Label className={`text-[10px] font-black uppercase tracking-wider ${t.textSecondary(isDark)} pl-1`}>Interaction Options</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {q.options.map((opt, oIdx) => (
                                                <div key={oIdx} className="group relative">
                                                    <Input
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newOpts = [...q.options];
                                                            newOpts[oIdx] = e.target.value;
                                                            updateQuestion(qIdx, { options: newOpts });
                                                        }}
                                                        className={`rounded-full h-11 pl-12 pr-4 border-2 font-bold text-xs transition-all ${q.correct_answer === oIdx
                                                            ? (isDark ? 'border-lime-400 bg-lime-400/5 text-white' : 'border-slate-900 bg-slate-50 text-slate-900')
                                                            : (isDark ? 'bg-transparent border-white/5 text-slate-300' : 'bg-white border-slate-200 text-slate-500')}`}
                                                    />
                                                    <button
                                                        onClick={() => updateQuestion(qIdx, { correct_answer: oIdx })}
                                                        className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-all ${q.correct_answer === oIdx
                                                            ? (isDark ? 'bg-lime-400 text-slate-900' : 'bg-slate-900 text-white')
                                                            : (isDark ? 'bg-white/5 text-transparent border border-white/20 hover:text-slate-400' : 'bg-slate-100 text-transparent border border-slate-200 hover:text-slate-400')}`}
                                                    >
                                                        <Check size={10} strokeWidth={4} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className={`text-[10px] font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Conceptual Explanation (Optional)</Label>
                                        <Input
                                            value={q.explanation}
                                            onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                                            placeholder="Provide context for the correct solution..."
                                            className={`rounded-full h-10 border-2 font-medium text-xs ${isDark ? 'bg-transparent border-white/5 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {quiz.questions.length === 0 && (
                    <div className={`p-10 rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center text-center gap-3 ${t.border(isDark)}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-white/5 text-slate-600' : 'bg-slate-50 text-slate-300'}`}>
                            <Plus size={24} />
                        </div>
                        <p className={`text-xs font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>Zero Question Logic Fragments</p>
                    </div>
                )}
            </div>

            {/* Global Actions */}
            <div className={`sticky bottom-2 p-4 rounded-[40px] border-2 shadow-2xl backdrop-blur-md flex items-center justify-between z-10 ${isDark ? 'bg-[#0f1219]/90 border-white/10' : 'bg-white/90 border-slate-200'}`}>
                <div className="flex items-center gap-3 px-4">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${quiz.questions.length > 0 ? 'bg-lime-400' : 'bg-orange-400'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>
                        {quiz.questions.length > 0 ? 'Engine Ready for Deployment' : 'Incomplete Logic Mapping'}
                    </span>
                </div>
                <div className="flex gap-3">
                    <Button
                        disabled={saving || quiz.questions.length === 0}
                        onClick={handleSave}
                        className={`rounded-full h-11 px-8 text-xs font-black gap-2 transition-all active:scale-95 ${isDark ? 'bg-lime-400 text-slate-900 hover:bg-lime-500 shadow-xl shadow-lime-400/30' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Check size={16} strokeWidth={3} />
                        )}
                        {saving ? 'SYNCHRONIZING...' : 'SAVE ASSESSMENT'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
