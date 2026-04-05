import { Film, FileText, ImageIcon, MonitorPlay, Layers, HelpCircle, BookOpen } from 'lucide-react';
import { Lesson } from '../../types';

export interface ContentItem {
    id: string;
    type: 'video' | 'pdf' | 'ppt' | 'image';
    url: string;
    urls?: string[];
}

export const BLOCK_TYPES = [
    { id: 'video' as const, label: 'Video', icon: Film, color: 'text-rose-500', accept: 'video/*', desc: 'MP4, YouTube, stream' },
    { id: 'pdf' as const, label: 'Document', icon: FileText, color: 'text-sky-500', accept: '.pdf,.doc,.docx', desc: 'PDF or Word file' },
    { id: 'image' as const, label: 'Images', icon: ImageIcon, color: 'text-emerald-500', accept: 'image/*', desc: 'Photo or carousel' },
    { id: 'ppt' as const, label: 'Slides', icon: MonitorPlay, color: 'text-amber-500', accept: '.ppt,.pptx,.key', desc: 'PowerPoint or Keynote' },
];

export const TYPE_ACCENT: Record<string, { border: string; lightBg: string; darkBg: string }> = {
    video: { border: '#f43f5e', lightBg: '#fff1f2', darkBg: 'rgba(244,63,94,0.07)' },
    pdf: { border: '#0ea5e9', lightBg: '#f0f9ff', darkBg: 'rgba(14,165,233,0.07)' },
    image: { border: '#10b981', lightBg: '#ecfdf5', darkBg: 'rgba(16,185,129,0.07)' },
    ppt: { border: '#f59e0b', lightBg: '#fffbeb', darkBg: 'rgba(245,158,11,0.07)' },
};

export const LESSON_MODES = [
    { id: 'content' as const, label: 'Content', icon: Layers, desc: 'Video, docs & images' },
    { id: 'quiz' as const, label: 'Quiz', icon: HelpCircle, desc: 'Interactive test' },
];

export const XP_PER_TYPE: Record<string, number> = { video: 20, ppt: 15, pdf: 15, image: 10 };

// ── UTILS ─────────────────────────────────────────────────────────────

export function genId() { return Math.random().toString(36).slice(2, 9); }

export function validateBlockUrl(type: ContentItem['type'], url: string): string | null {
    if (!url) return null;
    if (
        url.startsWith('/api/') ||
        url.startsWith('cf-stream://') ||
        url.includes('r2.cloudflarestorage') ||
        url.includes('cloudflare') ||
        url.includes('amazonaws') ||
        url.includes('blob.core.windows')
    ) return null;

    if (type === 'video') {
        const ok = /youtube\.com|youtu\.be|vimeo\.com|dailymotion|\.mp4|\.mov|\.avi|\.mkv|\.webm|\.m4v/i.test(url);
        if (!ok) return 'URL doesn\'t look like a video — expected YouTube/Vimeo link or .mp4/.mov file';
    }
    if (type === 'pdf') {
        const ok = /\.pdf($|\?)|\.doc($|\?)|\.docx($|\?)/i.test(url);
        if (!ok) return 'URL doesn\'t look like a document — expected .pdf or .docx link';
    }
    if (type === 'image') {
        const ok = /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)($|\?)/i.test(url);
        if (!ok) return 'URL doesn\'t look like an image — expected .jpg, .png, .webp, etc.';
    }
    if (type === 'ppt') {
        const ok = /\.(ppt|pptx|key|pdf)($|\?)/i.test(url);
        if (!ok) return 'URL doesn\'t look like a presentation — expected .pptx, .key, or .pdf link';
    }
    return null;
}

export function getLessonMode(contentType?: string): 'content' | 'quiz' {
    if (contentType === 'quiz') return 'quiz';
    return 'content';
}

export function getImageUrls(item: ContentItem): string[] {
    if (item.urls && item.urls.length > 0) return item.urls;
    return item.url ? [item.url] : [''];
}

export function parseContentItems(lesson: Partial<Lesson> | null): ContentItem[] {
    if (!lesson) return [];
    const raw = lesson.content_items;

    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch { }
    }
    const mode = getLessonMode(lesson.content_type);
    if (mode === 'content' && lesson.content_url) {
        return [{ id: 'legacy', type: (lesson.content_type as ContentItem['type']) || 'video', url: lesson.content_url }];
    }
    return [];
}

export function autoCalcXp(items: ContentItem[], mode: 'content' | 'quiz'): number {
    if (mode === 'quiz') return 25;
    if (items.length === 0) return 0;
    const raw = items.reduce((sum, item) => sum + (XP_PER_TYPE[item.type] ?? 10), 0);
    return Math.min(100, raw);
}
