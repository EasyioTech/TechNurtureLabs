'use client';

import React, { useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, BookOpen, HelpCircle, GraduationCap, Plus, Loader2 } from 'lucide-react';
import { fetchGlobalLessons, fetchGlobalQuizzes } from '@/modules/super-admin/actions';
import { useAdminTheme, t } from '../theme-context';

interface EntityLibraryPickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entityType: 'lesson' | 'quiz';
    onSelect: (id: string) => void;
}

export function EntityLibraryPicker({
    open,
    onOpenChange,
    entityType,
    onSelect,
}: EntityLibraryPickerProps) {
    const { isDark, accent } = useAdminTheme();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [cloningId, setCloningId] = useState<string | null>(null);

    async function loadData() {
        setLoading(true);
        try {
            if (entityType === 'lesson') {
                const result = await fetchGlobalLessons();
                setData(result.data);
            } else {
                const result = await fetchGlobalQuizzes();
                setData(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch entities:', error);
        }
        setLoading(false);
    }

    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            loadData();
        }
    }, [open, entityType]);


    const filteredData = data.filter((item) =>

        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.course_title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = async (id: string) => {
        setCloningId(id);
        await onSelect(id);
        setCloningId(null);
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className={`sm:max-w-[500px] p-0 flex flex-col border-l ${t.card(isDark)}`}>
                <SheetHeader className={`p-6 border-b ${t.border(isDark)} hover:bg-transparent`}>
                    <div className="flex items-center justify-between">
                        <SheetTitle className={`text-xl font-black tracking-tight ${t.textPrimary(isDark)}`}>
                            Import {entityType === 'lesson' ? 'Chapter' : 'Quiz'}
                        </SheetTitle>
                    </div>
                    <p className={`text-xs font-medium ${t.textMuted(isDark)}`}>
                        Select a previously created {entityType} to clone into this course.
                    </p>
                </SheetHeader>

                <div className={`p-4 border-b ${t.border(isDark)} space-y-4`}>
                    <div className="relative">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${t.textMuted(isDark)}`} />
                        <Input
                            placeholder={`Search ${entityType}s or courses...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`pl-11 rounded-full h-11 border-2 focus:ring-${accent.name}-400/50 ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`}
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader2 className={`w-10 h-10 animate-spin ${accent.text}`} />
                            <p className={`text-xs font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Loading Library...</p>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center py-20">
                            <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                {entityType === 'lesson' ? <BookOpen className={t.textMuted(isDark)} /> : <HelpCircle className={t.textMuted(isDark)} />}
                            </div>
                            <p className={`text-sm font-bold ${t.textPrimary(isDark)}`}>No {entityType}s found</p>
                            <p className={`text-xs ${t.textMuted(isDark)} mt-1`}>Try a different search term or check other courses.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredData.map((item) => (
                                <div
                                    key={item.id}
                                    className={`group p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 cursor-pointer ${isDark ? `bg-white/[0.03] border-white/5 hover:border-${accent.name}-400/50` : `bg-slate-50 border-slate-100 hover:border-${accent.name}-400/30`}`}
                                    onClick={() => !cloningId && handleSelect(item.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.initialCircle(isDark, accent)}`}>
                                                {entityType === 'lesson' ? <BookOpen size={18} /> : <HelpCircle size={18} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`font-black text-sm tracking-tight truncate ${t.textPrimary(isDark)}`}>{item.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[10px] font-bold flex items-center gap-1 ${t.textMuted(isDark)}`}>
                                                        <GraduationCap size={10} /> {item.course_title}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {cloningId === item.id ? (
                                            <Loader2 size={16} className={`animate-spin ${accent.text}`} />
                                        ) : (
                                            <div className={`opacity-0 group-hover:opacity-100 transition-all ${isDark ? accent.text : 'text-slate-900'}`}>
                                                <Plus size={18} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 pt-1">
                                        <Badge variant="outline" className={`text-[9px] font-black uppercase px-2 py-0 ${isDark ? 'bg-white/[0.05] border-white/10' : 'bg-white border-slate-200'}`}>
                                            {entityType === 'lesson' ? item.content_type : `${item.questions_count || 0} Questions`}
                                        </Badge>
                                        <span className={`text-[9px] font-bold ${t.textMuted(isDark)}`}>
                                            Created {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
