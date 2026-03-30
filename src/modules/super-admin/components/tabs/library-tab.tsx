'use client';

import React, { useState, useDeferredValue, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, Zap, Search, Copy, ExternalLink, 
    Filter, LayoutGrid, List, Check, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAdminTheme, t } from '../../theme-context';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Course } from '../../types';

interface LibraryTabProps {
    lessons: any[];
    quizzes: any[];
    loading: boolean;
    courses: Course[];
    onCloneLesson: (lessonId: string, targetCourseId: string) => Promise<void>;
    onCloneQuiz: (quizId: string, targetCourseId: string) => Promise<void>;
    lessonsPage?: number;
    totalLessonsPages?: number;
    onLessonsPageChange?: (page: number) => void;
    quizzesPage?: number;
    totalQuizzesPages?: number;
    onQuizzesPageChange?: (page: number) => void;
}

export function LibraryTab({
    lessons, quizzes, loading, courses, onCloneLesson, onCloneQuiz,
    lessonsPage = 1, totalLessonsPages = 1, onLessonsPageChange,
    quizzesPage = 1, totalQuizzesPages = 1, onQuizzesPageChange
}: LibraryTabProps) {
    const { isDark, accent } = useAdminTheme();
    const [view, setView] = useState<'lessons' | 'quizzes'>('lessons');
    const [searchQuery, setSearchQuery] = useState('');
    const [cloneItem, setCloneItem] = useState<{ id: string, type: 'lesson' | 'quiz', title: string } | null>(null);
    const [targetCourseId, setTargetCourseId] = useState<string>('');
    const [cloning, setCloning] = useState(false);

    // useDeferredValue lets React prioritise input responsiveness: the search input
    // updates immediately while the expensive re-render of potentially hundreds of
    // motion.div cards is deferred to the next idle frame, eliminating main-thread lag.
    const deferredSearch = useDeferredValue(searchQuery);

    const filteredLessons = useMemo(() =>
        lessons.filter(l =>
            l.title.toLowerCase().includes(deferredSearch.toLowerCase()) ||
            l.course_title?.toLowerCase().includes(deferredSearch.toLowerCase())
        ), [lessons, deferredSearch]);

    const filteredQuizzes = useMemo(() =>
        quizzes.filter(q =>
            q.title.toLowerCase().includes(deferredSearch.toLowerCase()) ||
            q.course_title?.toLowerCase().includes(deferredSearch.toLowerCase())
        ), [quizzes, deferredSearch]);

    const handleClone = async () => {
        if (!cloneItem || !targetCourseId) return;
        setCloning(true);
        try {
            if (cloneItem.type === 'lesson') {
                await onCloneLesson(cloneItem.id, targetCourseId);
            } else {
                await onCloneQuiz(cloneItem.id, targetCourseId);
            }
            setCloneItem(null);
        } finally {
            setCloning(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* ── Toolbar ── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className={`p-1 flex rounded-full border ${t.border(isDark)} ${isDark ? 'bg-white/[0.02]' : 'bg-neutral-100/50'}`}>
                    <button 
                        onClick={() => setView('lessons')}
                        className={`px-6 py-2 rounded-full text-[11px] font-[1000] tracking-widest transition-all
                            ${view === 'lessons' 
                                ? `${accent.bg} text-slate-900 shadow-lg shadow-black/10` 
                                : t.navInactive(isDark)}`}
                    >
                        LESSONS ({lessons.length})
                    </button>
                    <button 
                        onClick={() => setView('quizzes')}
                        className={`px-6 py-2 rounded-full text-[11px] font-[1000] tracking-widest transition-all
                            ${view === 'quizzes' 
                                ? `${accent.bg} text-slate-900 shadow-lg shadow-black/10` 
                                : t.navInactive(isDark)}`}
                    >
                        QUIZZES ({quizzes.length})
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`flex items-center rounded-full px-4 py-2 border gap-3 transition-all duration-300 min-w-[300px] ${t.border(isDark)} ${isDark ? 'bg-white/[0.03] focus-within:bg-white/[0.05]' : 'bg-white'}`}>
                        <Search size={16} className={isDark ? accent.text : 'text-neutral-400'} />
                        <input 
                            type="text" 
                            placeholder={`Search ${view}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`bg-transparent text-xs font-bold outline-none flex-1 ${t.textPrimary(isDark)} placeholder:text-neutral-500`}
                        />
                    </div>
                </div>
            </div>

            {/* ── Content Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={`h-40 rounded-[24px] animate-pulse border ${t.border(isDark)} ${isDark ? 'bg-white/[0.02]' : 'bg-neutral-50'}`} />
                    ))
                ) : (
                    <>
                        {view === 'lessons' ? (
                            filteredLessons.length > 0 ? filteredLessons.map((item, i) => (
                                <ItemCard key={item.id} item={item} type="lesson" isDark={isDark} accent={accent} onClone={() => setCloneItem({ ...item, type: 'lesson' })} />
                            )) : <EmptyState type="lessons" isDark={isDark} accent={accent} />
                        ) : (
                            filteredQuizzes.length > 0 ? filteredQuizzes.map((item, i) => (
                                <ItemCard key={item.id} item={item} type="quiz" isDark={isDark} accent={accent} onClone={() => setCloneItem({ ...item, type: 'quiz' })} />
                            )) : <EmptyState type="quizzes" isDark={isDark} accent={accent} />
                        )}
                    </>
                )}
            </div>

            {/* ── Pagination Footer ── */}
            {!loading && (
                <>
                    {view === 'lessons' && totalLessonsPages > 1 && (
                        <div className={`p-6 rounded-[24px] border ${t.border(isDark)} flex items-center justify-between mt-4 ${isDark ? 'bg-white/[0.01]' : 'bg-white'}`}>
                            <p className={`text-[11px] font-black tracking-widest ${t.textMuted(isDark)}`}>
                                PAGE <span className={t.textPrimary(isDark)}>{lessonsPage}</span> OF {totalLessonsPages}
                            </p>
                            <div className="flex items-center gap-3">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    disabled={lessonsPage === 1}
                                    onClick={() => onLessonsPageChange?.(lessonsPage - 1)}
                                    className={`rounded-full px-4 h-9 text-[10px] font-black border ${t.border(isDark)}`}
                                >
                                    PREV
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    disabled={lessonsPage >= totalLessonsPages}
                                    onClick={() => onLessonsPageChange?.(lessonsPage + 1)}
                                    className={`rounded-full px-4 h-9 text-[10px] font-black border ${t.border(isDark)}`}
                                >
                                    NEXT
                                </Button>
                            </div>
                        </div>
                    )}
                    {view === 'quizzes' && totalQuizzesPages > 1 && (
                        <div className={`p-6 rounded-[24px] border ${t.border(isDark)} flex items-center justify-between mt-4 ${isDark ? 'bg-white/[0.01]' : 'bg-white'}`}>
                            <p className={`text-[11px] font-black tracking-widest ${t.textMuted(isDark)}`}>
                                PAGE <span className={t.textPrimary(isDark)}>{quizzesPage}</span> OF {totalQuizzesPages}
                            </p>
                            <div className="flex items-center gap-3">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    disabled={quizzesPage === 1}
                                    onClick={() => onQuizzesPageChange?.(quizzesPage - 1)}
                                    className={`rounded-full px-4 h-9 text-[10px] font-black border ${t.border(isDark)}`}
                                >
                                    PREV
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    disabled={quizzesPage >= totalQuizzesPages}
                                    onClick={() => onQuizzesPageChange?.(quizzesPage + 1)}
                                    className={`rounded-full px-4 h-9 text-[10px] font-black border ${t.border(isDark)}`}
                                >
                                    NEXT
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── Clone Dialog ── */}
            <Dialog open={!!cloneItem} onOpenChange={(open) => !open && setCloneItem(null)}>
                <DialogContent className={`rounded-[32px] border-0 shadow-2xl p-0 overflow-hidden ${isDark ? 'bg-[#0f1219]' : 'bg-white'}`}>
                    <div className="p-8">
                        <DialogHeader className="p-0 text-center flex flex-col items-center">
                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-xl ${isDark ? 'bg-indigo-500/10 text-indigo-500 shadow-indigo-500/10' : 'bg-indigo-50 text-indigo-600'}`}>
                                <Copy size={32} />
                            </div>
                            <DialogTitle className={`text-2xl font-[1000] tracking-tighter uppercase ${t.textPrimary(isDark)}`}>Clone Content</DialogTitle>
                            <DialogDescription className={`text-[12px] font-bold uppercase tracking-widest mt-2 ${t.textMuted(isDark)}`}>
                                Create a copy of <span className={isDark ? accent.text : 'text-slate-900'}>"{cloneItem?.title}"</span>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-8 space-y-6">
                            <div className="space-y-3">
                                <label className={`text-[10px] font-black tracking-widest uppercase ml-1 ${t.textMuted(isDark)}`}>Target Course</label>
                                <Select value={targetCourseId} onValueChange={setTargetCourseId}>
                                    <SelectTrigger className={`h-14 rounded-2xl border-2 font-black text-sm transition-all ${t.border(isDark)} ${isDark ? 'bg-white/5 focus:ring-0 focus:border-white/20' : 'bg-neutral-50'}`}>
                                        <SelectValue placeholder="Select Destination Course" />
                                    </SelectTrigger>
                                    <SelectContent className={`rounded-2xl border-0 shadow-2xl ${isDark ? 'bg-[#18181b]' : 'bg-white'}`}>
                                        {courses.map(course => (
                                            <SelectItem key={course.id} value={course.id} className="font-bold py-3 px-4 rounded-xl">
                                                {course.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className={`p-5 rounded-2xl border-2 border-dashed ${t.border(isDark)} ${isDark ? 'bg-white/[0.02]' : 'bg-neutral-50'}`}>
                                <div className="flex items-start gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                        <Check size={16} />
                                    </div>
                                    <p className={`text-[11px] font-bold leading-relaxed ${t.textMuted(isDark)}`}>
                                        This will create a new instance of the {cloneItem?.type} in the selected course. All content, metadata, and (for quizzes) questions will be preserved.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className={`p-6 px-8 flex items-center gap-3 border-t ${isDark ? 'border-white/10 bg-[#0c0e14]' : 'border-neutral-100 bg-neutral-50'}`}>
                        <Button 
                            variant="ghost" 
                            disabled={cloning}
                            onClick={() => setCloneItem(null)}
                            className={`flex-1 rounded-full h-12 font-black text-xs ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-neutral-200 text-neutral-500 bg-neutral-100'}`}
                        >
                            CANCEL
                        </Button>
                        <Button 
                            disabled={!targetCourseId || cloning}
                            onClick={handleClone}
                            className={`flex-1 rounded-full h-12 font-black text-xs shadow-xl flex items-center gap-2
                                ${t.btnPrimary(isDark, accent)}`}
                            style={isDark && targetCourseId ? t.glowStyle(isDark, accent) : {}}
                        >
                            {cloning ? 'CLONING...' : (
                                <>CLONE NOW <ArrowRight size={16} strokeWidth={3} /></>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ItemCard({ item, type, isDark, accent, onClone }: { item: any, type: 'lesson' | 'quiz', isDark: boolean, accent: any, onClone: () => void }) {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`group p-6 rounded-[24px] border transition-all duration-300 shadow-xl shadow-black/5 flex flex-col justify-between overflow-hidden relative
                ${t.card(isDark)} hover:shadow-2xl hover:-translate-y-1 ${isDark ? 'hover:border-white/20' : 'hover:border-neutral-200'}`}
        >
            {/* Background Icon Watermark */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12 transition-transform group-hover:rotate-0">
                {type === 'lesson' ? <BookOpen size={120} /> : <Zap size={120} />}
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <Badge className={`text-[9px] font-black px-2 py-0.5 rounded-md ${isDark ? 'bg-white/10 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                        {type === 'lesson' ? item.content_type?.toUpperCase() || 'LESSON' : 'QUIZ'}
                    </Badge>
                    {type === 'quiz' && (
                        <span className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>
                            {item.questions_count || 0} QUESTS
                        </span>
                    )}
                </div>
                
                <h4 className={`text-lg font-[1000] tracking-tight leading-tight mb-2 truncate ${t.textPrimary(isDark)}`}>
                    {item.title}
                </h4>
                
                <div className="flex items-center gap-2 mb-6">
                    <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white/20' : 'bg-neutral-200'}`} />
                    <p className={`text-[11px] font-black uppercase tracking-widest truncate ${isDark ? accent.text : 'text-neutral-500'}`}>
                        {item.course_title}
                    </p>
                </div>
            </div>

            <div className="relative z-10 pt-4 flex items-center justify-between gap-3 border-t border-dashed border-white/10">
                <p className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>
                    {new Date(item.created_at).toLocaleDateString()}
                </p>
                <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onClone}
                    className={`h-9 px-4 rounded-full text-[10px] font-black tracking-widest gap-2 group/btn
                        ${isDark ? 'bg-white/5 hover:bg-white/10 hover:text-white' : 'bg-neutral-100 hover:bg-neutral-200'}`}
                >
                    <Copy size={12} className="group-hover/btn:scale-110 transition-transform" /> CLONE
                </Button>
            </div>
        </motion.div>
    );
}

function EmptyState({ type, isDark, accent }: { type: string, isDark: boolean, accent: any }) {
    return (
        <div className="col-span-full py-20 flex flex-col items-center text-center">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl border-2 border-dashed ${t.border(isDark)} ${isDark ? 'bg-white/[0.02]' : 'bg-neutral-50'}`}>
                {type === 'lessons' ? <BookOpen size={32} className="opacity-20" /> : <Zap size={32} className="opacity-20" />}
            </div>
            <h3 className={`text-xl font-[1000] tracking-tight mb-2 ${t.textPrimary(isDark)} uppercase`}>No {type} found</h3>
            <p className={`text-sm font-medium ${t.textMuted(isDark)} max-w-sm`}>
                We couldn't find any {type} matching your search criteria. Try a different term or clear the filter.
            </p>
        </div>
    );
}
