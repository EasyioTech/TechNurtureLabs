'use client';

import React from 'react';
import { useAdminTheme, t } from '../../../theme-context';
import { HardDrive, ChevronRight, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackupsLinkSectionProps {
    schoolsList: Array<{ id: string; name: string }>;
    onTabChange?: (tab: string) => void;
}

export function BackupsLinkSection({ schoolsList, onTabChange }: BackupsLinkSectionProps) {
    const { isDark, accent } = useAdminTheme();

    return (
        <div className={`p-6 rounded-3xl border transition-all duration-300 ${t.card(isDark)} ${t.border(isDark)}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                        <Database size={20} />
                    </div>
                    <div>
                        <h3 className={`text-sm font-black uppercase tracking-widest ${t.textPrimary(isDark)}`}>Data Backups</h3>
                        <p className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>Manage system snapshots and data redundancy</p>
                    </div>
                </div>
            </div>

            <Button
                onClick={() => onTabChange?.('backups')}
                className={`w-full rounded-2xl h-12 font-black text-base gap-2 ${t.btnPrimary(isDark, accent)}`}
                style={isDark ? { boxShadow: t.glowStyle(isDark, accent).boxShadow } : {}}
            >
                <HardDrive size={20} />
                Open Backup Manager
                <ChevronRight size={18} className="ml-auto" />
            </Button>
        </div>
    );
}
