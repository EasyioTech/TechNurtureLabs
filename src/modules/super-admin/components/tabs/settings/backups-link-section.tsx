'use client';

import React from 'react';
import { useAdminTheme, t } from '../../../theme-context';
import { HardDrive, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackupsLinkSectionProps {
    onNavigateToBackups: () => void;
}

export function BackupsLinkSection({ onNavigateToBackups }: BackupsLinkSectionProps) {
    const { isDark, accent } = useAdminTheme();

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
                <h3 className={`text-lg font-black tracking-tight ${t.textPrimary(isDark)}`}>
                    Data Backup & Recovery
                </h3>
                <div className={`flex-1 h-px ${t.divider(isDark)}`} />
            </div>

            <div className={`p-6 rounded-[28px] border flex flex-col sm:flex-row items-center justify-between gap-6 ${t.card(isDark)}`}>
                <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        <HardDrive size={24} />
                    </div>
                    <div className="text-center sm:text-left">
                        <h4 className={`text-[15px] font-black tracking-tight mb-1 ${t.textPrimary(isDark)}`}>
                            School Backups
                        </h4>
                        <p className={`text-[13px] font-medium leading-relaxed max-w-md ${t.textSecondary(isDark)}`}>
                            Create backups of school data, restore from previous backups, and manage complete data recovery. All school information, students, courses, and transactions are protected.
                        </p>
                    </div>
                </div>
                <Button
                    onClick={onNavigateToBackups}
                    className={`rounded-2xl h-11 px-6 font-black text-[13px] shrink-0 ${t.btnPrimary(isDark, accent)}`}
                    style={isDark ? { boxShadow: t.glowStyle(isDark, accent).boxShadow } : {}}
                >
                    Go to Backups
                    <ChevronRight size={16} className="ml-2" />
                </Button>
            </div>

            <div className={`p-4 rounded-2xl border-l-4 ${isDark ? 'bg-blue-500/5 border-blue-500 text-blue-300' : 'bg-blue-50 border-blue-500 text-blue-700'}`}>
                <p className="text-sm font-bold">
                    💾 Backups are automatically stored in Cloudflare R2 with 30-day retention. Only super admins can create, download, and restore backups.
                </p>
            </div>
        </div>
    );
}
