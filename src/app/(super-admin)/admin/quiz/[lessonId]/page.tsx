'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QuizBuilder } from '@/modules/super-admin/components/quiz-editor';
import { fetchQuizAdmin, fetchLessonAdmin } from '@/modules/super-admin/actions';
import { useAdminTheme } from '@/modules/super-admin/theme-context';
import { X } from 'lucide-react';

export default function QuizEditorPage() {
    const params = useParams();
    const router = useRouter();
    const lessonId = params.lessonId as string;
    const { isDark, accent } = useAdminTheme();
    const [quizData, setQuizData] = React.useState<any>(null);
    const [lessonData, setLessonData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function load() {
            try {
                // Parallel load
                const [quiz, lesson] = await Promise.all([
                    fetchQuizAdmin(lessonId),
                    fetchLessonAdmin(lessonId)
                ]);
                setQuizData(quiz);
                setLessonData(lesson);
            } catch (err) {
                console.error('Failed to load assessment data:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [lessonId]);

    if (loading) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-[#0A0C10]' : 'bg-slate-50'} flex flex-col items-center justify-center gap-6`}>
                <div className={`w-12 h-12 border-4 ${accent.border} border-t-transparent rounded-full animate-spin`} />
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${accent.text}`}>Booting Quiz Engine...</p>
            </div>
        );
    }

    if (!lessonData) {
        return (
            <div className="min-h-screen bg-[#0A0C10] flex flex-col items-center justify-center gap-4 text-center p-8">
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Lesson Not Found</h2>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest max-w-md">
                    The requested lesson logic fragment could not be resolved in the curriculum database.
                </p>
                <button
                    onClick={() => router.back()}
                    className="mt-4 px-8 py-3 bg-white text-black font-black text-xs rounded-full uppercase tracking-widest"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    // Resolve courseId strictly to prevent silent failures in saveQuizAdmin
    const resolvedCourseId = quizData?.course_id || lessonData?.course_id;

    if (!resolvedCourseId) {
        return (
            <div className="min-h-screen bg-[#0A0C10] flex flex-col items-center justify-center gap-4 text-center p-8">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                    <X className="text-red-500" size={32} />
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Architectural Error</h2>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest max-w-md">
                    The course identifier could not be resolved. This assessment cannot be managed without a parent course context.
                </p>
                <button
                    onClick={() => router.back()}
                    className="mt-4 px-8 py-3 bg-white text-black font-black text-xs rounded-full uppercase tracking-widest"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <QuizBuilder
            lessonId={lessonId}
            courseId={resolvedCourseId}
            initialData={quizData}
            onClose={() => router.back()}
        />
    );
}
