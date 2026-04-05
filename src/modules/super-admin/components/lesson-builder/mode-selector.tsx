'use client';

import React from 'react';
import { Layers, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { LESSON_MODES, getLessonMode } from './utils';
import { useAdminTheme } from '../../theme-context';

interface LessonModeSelectorProps {
    contentType?: string;
    onModeChange: (mode: 'content' | 'quiz') => void;
}

export function LessonModeSelector({ contentType, onModeChange }: LessonModeSelectorProps) {
    const { isDark, accent } = useAdminTheme();
    const lessonMode = getLessonMode(contentType);

    return (
        <div className="space-y-2">
            <Label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Lesson Type</Label>
            <div className="grid grid-cols-2 gap-2">
                {LESSON_MODES.map((mode) => {
                    const active = lessonMode === mode.id;
                    return (
                        <button
                            key={mode.id}
                            type="button"
                            onClick={() => onModeChange(mode.id)}
                            className={cn(
                                'flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-center transition-all cursor-pointer',
                                active
                                    ? isDark
                                        ? `${accent.softDark.split(' ')[0]} border-${accent.name}-400/60`
                                        : 'bg-indigo-50 border-indigo-300'
                                    : isDark
                                        ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            )}
                        >
                            <mode.icon
                                size={16}
                                className={active
                                    ? isDark ? accent.text : 'text-indigo-600'
                                    : isDark ? 'text-slate-500' : 'text-slate-400'}
                            />
                            <span className={cn(
                                'text-xs font-black leading-none',
                                active ? isDark ? accent.text : 'text-indigo-700' : (isDark ? 'text-white' : 'text-slate-900')
                            )}>{mode.label}</span>
                            <span className={`text-[9px] font-medium leading-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{mode.desc}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
