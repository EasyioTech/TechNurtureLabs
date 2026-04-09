'use client';

import React from 'react';
import {
    Dialog, DialogContent, DialogTitle
} from '@/components/ui/dialog';
import { Play, FileText, HelpCircle, MonitorPlay, Clock, Zap } from 'lucide-react';
import { useAdminTheme, t } from '../theme-context';
import { Lesson } from '../types';
import dynamic from 'next/dynamic';

interface LessonPreviewModalProps {
    lesson: Lesson | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Lazy load PDF viewer
const PDFViewer = dynamic(() => import('@/modules/student/components/learning/pdf-viewer').then(mod => mod.PDFViewer), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-96 text-slate-400">Loading preview...</div>,
});

export function LessonPreviewModal({ lesson, open, onOpenChange }: LessonPreviewModalProps) {
    const { isDark, accent } = useAdminTheme();

    if (!lesson) return null;

    const getContentTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Play size={20} />;
            case 'ppt': return <MonitorPlay size={20} />;
            case 'pdf': return <FileText size={20} />;
            case 'quiz': return <HelpCircle size={20} />;
            default: return <FileText size={20} />;
        }
    };

    const getContentTypeLabel = (type: string) => {
        switch (type) {
            case 'video': return 'Video Lesson';
            case 'ppt': return 'Presentation';
            case 'pdf': return 'Document';
            case 'quiz': return 'Quiz';
            default: return 'Content';
        }
    };

    const renderPreview = () => {
        if (!lesson.content_url && !lesson.content_items) {
            return (
                <div className="flex flex-col items-center justify-center w-full h-screen sm:h-96 gap-4 p-4 sm:p-0">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                        {getContentTypeIcon(lesson.content_type)}
                    </div>
                    <div className="text-center">
                        <p className={`font-bold ${t.textMuted(isDark)}`}>No content available</p>
                        <p className={`text-sm ${t.textMuted(isDark)}`}>This lesson hasn't been configured yet.</p>
                    </div>
                </div>
            );
        }

        if (lesson.content_type === 'video' && lesson.content_url) {
            return (
                <div className="w-full h-screen sm:h-96 flex items-center justify-center p-2 sm:p-0">
                    {lesson.content_url.startsWith('cf-stream://') ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <iframe
                                src={`https://iframe.videodelivery.net/${lesson.content_url.replace('cf-stream://', '')}?autoplay=false&muted=false&preload=auto`}
                                allowFullScreen
                                className="w-full h-full border-0 rounded-none sm:rounded-xl"
                                title="Video Player"
                            />
                        </div>
                    ) : (
                        <video
                            src={lesson.content_url}
                            controls
                            className="w-full h-full object-contain rounded-none sm:rounded-xl"
                        />
                    )}
                </div>
            );
        }

        if (lesson.content_type === 'pdf' && lesson.content_url) {
            return (
                <div className="w-full h-screen sm:h-96">
                    <PDFViewer
                        url={lesson.content_url}
                        onComplete={() => {}}
                        lessonComplete={false}
                        pageNumber={1}
                        docMax={100}
                        canMarkComplete={false}
                        className="w-full h-full rounded-none border-0"
                    />
                </div>
            );
        }

        if (lesson.content_type === 'ppt' && lesson.content_url) {
            return (
                <div className="w-full h-screen sm:h-96 flex items-center justify-center p-2 sm:p-4">
                    <iframe
                        src={`https://docs.google.com/gview?url=${encodeURIComponent(lesson.content_url)}&embedded=true`}
                        className="w-full h-full rounded-none sm:rounded-xl border-0"
                        title="Presentation Viewer"
                    />
                </div>
            );
        }

        if (lesson.content_type === 'quiz') {
            return (
                <div className="flex flex-col items-center justify-center w-full h-screen sm:h-96 gap-4 p-4 sm:p-0">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                        <HelpCircle size={32} className={isDark ? 'text-orange-400' : 'text-orange-600'} />
                    </div>
                    <div className="text-center">
                        <p className={`font-bold ${t.textPrimary(isDark)}`}>Quiz Lesson</p>
                        <p className={`text-sm ${t.textMuted(isDark)}`}>Quiz preview not available in admin view</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center w-full h-screen sm:h-96 gap-4 p-4 sm:p-0">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                    {getContentTypeIcon(lesson.content_type)}
                </div>
                <p className={`font-bold ${t.textMuted(isDark)}`}>Preview not available</p>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`w-full h-screen sm:w-full sm:h-auto sm:max-w-4xl sm:max-h-[90vh] p-0 border-0 overflow-hidden rounded-none sm:rounded-3xl ${isDark ? 'bg-[#0a0d13]' : 'bg-white'}`}>
                <DialogTitle className="sr-only">
                    {lesson.title} Preview
                </DialogTitle>

                {/* Content */}
                <div className={`w-full h-screen sm:h-auto sm:max-h-[90vh] overflow-y-auto sm:overflow-hidden`}>
                    {renderPreview()}
                </div>
            </DialogContent>
        </Dialog>
    );
}
