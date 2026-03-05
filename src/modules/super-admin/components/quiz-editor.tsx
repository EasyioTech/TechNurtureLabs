'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Plus, Trash2, Check, X, Settings2, Info,
    ChevronLeft, LayoutDashboard, Target, Clock,
    Trophy, Sparkles, Save, Layout, ListOrdered,
    MonitorPlay, HelpCircle, GripVertical
} from 'lucide-react';
import { useAdminTheme, t } from '../theme-context';
import { fetchQuizAdmin, saveQuizAdmin } from '../actions';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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

interface QuizBuilderProps {
    lessonId: string;
    courseId: string;
    onClose: () => void;
}

export function QuizBuilder({ lessonId, courseId, onClose }: QuizBuilderProps) {
    const { isDark, accent } = useAdminTheme();
    const [quiz, setQuiz] = React.useState<Quiz | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<'questions' | 'settings'>('questions');

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
                            correct_answer: q.correct_answer || 0
                        }))
                    } as any);
                } else {
                    setQuiz({
                        lesson_id: lessonId,
                        course_id: courseId,
                        title: 'Lesson Assessment',
                        description: 'Test your knowledge on this lesson.',
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
                toast.error('Failed to load assessment');
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
            toast.success('Assessment saved', {
                description: 'Your changes are now live for students.',
                icon: <Sparkles className={accent.text} size={16} />
            });
        } catch (err) {
            console.error('Save failed:', err);
            toast.error('Failed to save assessment');
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
                    options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
                    correct_answer: 0,
                    explanation: '',
                    points: 1
                }
            ]
        });
        setTimeout(() => {
            const container = document.getElementById('questions-canvas');
            if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }, 100);
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
        <div className={`fixed inset-0 z-[200] ${isDark ? 'bg-[#0f1219]' : 'bg-slate-50'} flex flex-col items-center justify-center gap-6`}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className={`w-12 h-12 border-4 ${accent.name === 'emerald' ? 'border-emerald-400' : `border-${accent.name}-400`} border-t-transparent rounded-full`}
            />
            <div className="text-center space-y-2">
                <p className={`text-xs font-black uppercase tracking-[0.2em] ${accent.text} animate-pulse`}>Loading Assessment</p>
                <p className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-widest`}>Preparing your workspace...</p>
            </div>
        </div>
    );

    if (!quiz) return null;

    const totalPoints = quiz.questions.reduce((sum, q) => sum + (q.points || 0), 0);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[200] ${isDark ? 'bg-[#0A0C10]' : 'bg-slate-50'} flex flex-col font-sans select-none overflow-hidden`}
        >
            {/* ─── Top Header ────────────────────────────────────────────────── */}
            <header className={`min-h-[72px] md:h-20 border-b ${isDark ? 'border-white/5 bg-[#0D0F14]/80' : 'border-slate-200 bg-white/80'} flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-3 md:py-0 backdrop-blur-xl gap-4 md:gap-0 shrink-0`}>
                <div className="flex items-center gap-3 md:gap-6 w-full md:w-auto">
                    <button
                        onClick={onClose}
                        className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${isDark ? 'hover:bg-white/5 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                    >
                        <ChevronLeft size={20} className="md:hidden" />
                        <ChevronLeft size={24} className="hidden md:block" />
                    </button>
                    <div className={`h-6 md:h-8 w-[1px] ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 md:gap-2 overflow-hidden">
                            <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${accent.text} px-2 py-0.5 rounded-full border border-${accent.name}-400/10 shrink-0 ${isDark ? accent.softDark.split(' ')[0] : accent.softLight.split(' ')[0]}`}>QUIZ BUILDER</span>
                            <span className="text-[9px] md:text-[10px] font-bold text-slate-500 shrink-0">•</span>
                            <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{quiz.questions.length} Questions</span>
                        </div>
                        <h1 className={`text-sm md:text-lg font-black tracking-tight leading-none mt-1 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {quiz.title}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end">
                    <div className={`flex p-0.5 md:p-1 ${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-100 border-slate-200 shadow-inner'} rounded-full border`}>
                        <button
                            onClick={() => setActiveTab('questions')}
                            className={`px-3 md:px-6 py-1.5 md:py-2 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'questions' ? `${accent.bg} text-slate-900 shadow-xl` : `${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-800'}`}`}
                        >
                            <span className="flex items-center gap-1.5 md:gap-2"><ListOrdered size={12} className="md:size-3.5" /> Questions</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-3 md:px-6 py-1.5 md:py-2 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? `${accent.bg} text-slate-900 shadow-xl` : `${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-800'}`}`}
                        >
                            <span className="flex items-center gap-1.5 md:gap-2"><Settings2 size={12} className="md:size-3.5" /> Settings</span>
                        </button>
                    </div>

                    <Button
                        disabled={saving}
                        onClick={handleSave}
                        className={`rounded-full h-9 md:h-11 px-4 md:px-8 ${accent.bg} text-slate-900 ${accent.bgHover} font-black text-[10px] md:text-xs gap-2 shadow-lg transition-all active:scale-95 shrink-0`}
                        style={t.glowStyle(isDark, accent)}
                    >
                        {saving ? (
                            <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save size={14} strokeWidth={3} className="md:size-4" />
                        )}
                        <span>{saving ? 'SAVING...' : 'SAVE CHANGES'}</span>
                    </Button>
                </div>
            </header>

            {/* ─── Main Content Area ────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Sidebar Stats - responsive handling */}
                <aside className={`hidden lg:block w-72 xl:w-80 border-r ${isDark ? 'border-white/5 bg-[#0D0F14]/50' : 'border-slate-200 bg-white/50'} p-8 space-y-8 overflow-y-auto shrink-0`}>
                    <div className="space-y-6">
                        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Assessment Overview</h3>

                        <div className="grid grid-cols-1 gap-4">
                            <StatCard icon={Sparkles} color={accent.text} label="XP Points" value={quiz.xp_reward} sub="Points per lesson" />
                            <StatCard icon={Target} color={accent.text} label="Passing Score" value={`${quiz.pass_percentage}%`} sub="Min requirements" />
                            <StatCard icon={Clock} color={accent.text} label="Time Limit" value={quiz.time_limit_secs === 0 ? 'Unlimited' : `${Math.floor(quiz.time_limit_secs / 60)}m`} sub="Session duration" />
                        </div>
                    </div>

                    <div className="h-[2px] w-full bg-white/5" />

                    <div className="space-y-6">
                        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Summary</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-widest`}>Total Points</span>
                                <span className={`text-[11px] font-black ${isDark ? 'text-white bg-white/5 border-white/10' : 'text-slate-900 bg-slate-100 border-slate-200'} px-2 py-1 rounded-lg border`}>{totalPoints} PTS</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-widest`}>Difficulty</span>
                                <span className={`text-[11px] font-black ${isDark ? 'text-white' : 'text-slate-900'} tracking-widest uppercase`}>{quiz.questions.length > 5 ? 'Advanced' : 'Intermediate'}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Question Canvas */}
                <div id="questions-canvas" className={`flex-1 ${isDark ? 'bg-black/20' : 'bg-slate-100/50'} overflow-y-auto p-4 md:p-8 lg:p-12 custom-scrollbar relative`}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'questions' ? (
                            <motion.div
                                key="questions"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="max-w-4xl mx-auto space-y-6 md:space-y-12 pb-32"
                            >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-8">
                                    <div>
                                        <h2 className={`text-xl md:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'} tracking-tighter`}>Assessment Questions</h2>
                                        <p className={`text-[10px] md:text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-widest mt-1`}>Design your assessment logic here.</p>
                                    </div>
                                    <Button
                                        onClick={addQuestion}
                                        className={`w-full sm:w-auto rounded-full ${isDark ? 'bg-white text-slate-900 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'} font-black text-[10px] md:text-[11px] uppercase tracking-widest h-10 md:h-11 px-6 gap-2`}
                                    >
                                        <Plus size={16} strokeWidth={3} /> Add Question
                                    </Button>
                                </div>

                                {quiz.questions.map((q, idx) => (
                                    <QuestionCard
                                        key={idx}
                                        idx={idx}
                                        q={q}
                                        onUpdate={(updates: Partial<Question>) => updateQuestion(idx, updates)}
                                        onDelete={() => deleteQuestion(idx)}
                                    />
                                ))}

                                {quiz.questions.length === 0 && (
                                    <div className="py-20 md:py-32 flex flex-col items-center justify-center text-center gap-6">
                                        <div className={`w-16 h-16 md:w-24 md:h-24 rounded-[32px] md:rounded-[40px] ${isDark ? 'bg-white/[0.02] border-white/5 text-slate-700' : 'bg-slate-200 border-slate-300 text-slate-400'} flex items-center justify-center`}>
                                            <HelpCircle size={32} className="md:size-12" />
                                        </div>
                                        <div>
                                            <h3 className={`text-lg md:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>No Questions Yet</h3>
                                            <p className={`text-[10px] md:text-sm font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest mt-2 px-6`}>Add your first question to get started.</p>
                                        </div>
                                        <Button
                                            onClick={addQuestion}
                                            className={`rounded-full ${accent.bg} text-slate-900 ${accent.bgHover} font-black h-11 md:h-12 px-8 md:px-10 shadow-2xl`}
                                        >
                                            ADD FIRST QUESTION
                                        </Button>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="settings"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="max-w-2xl mx-auto space-y-6 md:space-y-10"
                            >
                                <div className="mb-6 md:mb-12 text-center md:text-left">
                                    <h2 className={`text-xl md:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'} tracking-tighter`}>Quiz Settings</h2>
                                    <p className={`text-[10px] md:text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-widest mt-1`}>Configure how this quiz behaves for students.</p>
                                </div>

                                <div className={`grid grid-cols-1 gap-6 md:gap-8 p-6 md:p-10 rounded-[32px] md:rounded-[40px] ${isDark ? 'bg-[#11141B]/50 border-white/5' : 'bg-white border-slate-200 shadow-xl'} border`}>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Quiz Title</Label>
                                        <Input
                                            value={quiz.title}
                                            onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                                            className={`h-14 md:h-16 rounded-2xl ${isDark ? 'bg-black/30 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} px-6 font-black focus:border-${accent.name}-400/30 transition-all`}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                        <SettingsField label="Time Limit (Seconds)" value={quiz.time_limit_secs} onChange={(v: number) => setQuiz({ ...quiz, time_limit_secs: v })} />
                                        <SettingsField label="Min Passing Score (%)" value={quiz.pass_percentage} onChange={(v: number) => setQuiz({ ...quiz, pass_percentage: v })} />
                                        <SettingsField label="Maximum Attempts" value={quiz.max_attempts} onChange={(v: number) => setQuiz({ ...quiz, max_attempts: v })} />
                                        <SettingsField label="Rewards (XP)" value={quiz.xp_reward} onChange={(v: number) => setQuiz({ ...quiz, xp_reward: v })} />
                                    </div>

                                    <div className={`mt-4 flex items-center justify-between p-6 md:p-8 rounded-[24px] md:rounded-[32px] ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'} border group`}>
                                        <div className="space-y-1 flex-1 pr-4">
                                            <h4 className={`text-[11px] font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-widest`}>Publish Assessment</h4>
                                            <p className={`text-[9px] md:text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'} leading-tight`}>Enable visibility of this assessment for enrolled students.</p>
                                        </div>
                                        <button
                                            onClick={() => setQuiz({ ...quiz, is_published: !quiz.is_published })}
                                            className={`w-12 h-7 md:w-14 md:h-8 rounded-full p-1 transition-all shrink-0 border ${quiz.is_published ? `${accent.bg} border-transparent` : (isDark ? 'bg-slate-800 border-white/5' : 'bg-slate-300 border-slate-300')}`}
                                            style={quiz.is_published ? t.glowStyle(isDark, accent) : {}}
                                        >
                                            <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full bg-white shadow-xl transition-all ${quiz.is_published ? 'translate-x-5 md:translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
                @media (min-width: 768px) { .custom-scrollbar::-webkit-scrollbar { width: 6px; } }
            `}</style>
        </motion.div>
    );
}

// ─── Subcomponents ──────────────────────────────────────────────────

function StatCard({ icon: Icon, color, label, value, sub }: any) {
    const { isDark } = useAdminTheme();
    return (
        <div className={`p-4 rounded-2xl md:rounded-3xl ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'} border space-y-2`}>
            <div className={`flex items-center gap-2 ${color} mb-1`}>
                <Icon size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{label}</span>
            </div>
            <div className={`text-xl md:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</div>
            <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'} font-bold uppercase leading-tight`}>{sub}</p>
        </div>
    );
}

function SettingsField({ label, value, onChange }: any) {
    const { isDark, accent } = useAdminTheme();
    return (
        <div className="space-y-2.5">
            <Label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'} px-1`}>{label}</Label>
            <Input
                type="number"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                className={`h-12 md:h-14 rounded-xl md:rounded-2xl ${isDark ? 'bg-black/20 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900 shadow-inner'} px-4 md:px-6 font-bold focus-visible:ring-${accent.name}-400/50 focus:border-${accent.name}-400/30 transition-all`}
            />
        </div>
    );
}

function QuestionCard({ idx, q, onUpdate, onDelete }: any) {
    const { isDark, accent } = useAdminTheme();
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group relative p-6 md:p-10 rounded-[32px] md:rounded-[48px] ${isDark ? 'bg-[#11141B] border-white/5' : 'bg-white border-slate-200 shadow-xl'} border hover:border-white/10 transition-all`}
        >
            <div className={`absolute -left-3 md:-left-4 top-8 md:top-10 w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl ${accent.bg} text-slate-900 flex items-center justify-center font-black text-xs md:text-sm shadow-xl z-10`}
                style={t.glowStyle(isDark, accent)}>
                {idx + 1}
            </div>

            <div className="flex justify-between items-start mb-6 md:mb-10 pl-4 md:pl-6">
                <div className="space-y-1">
                    <Label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Question Type</Label>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black ${isDark ? 'text-white bg-white/5 border-white/10' : 'text-slate-900 bg-slate-100 border-slate-200'} px-3 py-1.5 rounded-full uppercase tracking-widest`}>Multiple Choice</span>
                    </div>
                </div>
                <button
                    onClick={onDelete}
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-red-500/20 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-all sm:opacity-0 group-hover:opacity-100"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="space-y-8 md:space-y-10 pl-4 md:pl-6">
                <div className="space-y-3">
                    <Label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Question Text</Label>
                    <Textarea
                        value={q.question_text}
                        onChange={(e) => onUpdate({ question_text: e.target.value })}
                        placeholder="Define the question context..."
                        className={`${isDark ? 'bg-black/30 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} rounded-2xl md:rounded-[32px] min-h-[100px] md:min-h-[120px] p-5 md:p-6 text-sm md:text-base font-medium placeholder:text-slate-700 focus:border-${accent.name}-400/30 transition-all resize-none`}
                    />
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <Label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Answer Options</Label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        {q.options.map((opt: string, oIdx: number) => (
                            <div key={oIdx} className="relative group/opt">
                                <Input
                                    value={opt}
                                    onChange={(e) => {
                                        const newOpts = [...q.options];
                                        newOpts[oIdx] = e.target.value;
                                        onUpdate({ options: newOpts });
                                    }}
                                    className={`h-14 md:h-16 pl-14 md:pl-16 pr-6 rounded-full font-bold text-xs md:text-sm ${isDark ? 'bg-black/20 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} transition-all ${q.correct_answer === oIdx ? `border-${accent.name}-400/50 ${isDark ? accent.softDark.split(' ')[0] : accent.softLight.split(' ')[0]}` : 'hover:border-white/10'}`}
                                />
                                <button
                                    onClick={() => onUpdate({ correct_answer: oIdx })}
                                    className={`absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${q.correct_answer === oIdx ? `${accent.bg} text-slate-900 shadow-lg` : (isDark ? 'bg-white/5 border-white/10 text-transparent' : 'bg-slate-100 border-slate-200 text-transparent hover:text-slate-400')} border`}
                                >
                                    <Check size={14} strokeWidth={4} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Explanation (Optional)</Label>
                    <Input
                        value={q.explanation}
                        onChange={(e) => onUpdate({ explanation: e.target.value })}
                        placeholder="Provide an explanation for the correct answer..."
                        className={`${isDark ? 'bg-white/[0.03] border-white/5 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'} h-12 md:h-14 rounded-full px-5 md:px-6 text-[13px] font-medium placeholder:text-slate-700`}
                    />
                </div>
            </div>
        </motion.div>
    );
}
