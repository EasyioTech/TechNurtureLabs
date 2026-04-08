'use client';

import React, { useState } from 'react';
import { useAdminTheme, t } from '../../../theme-context';
import { HardDrive, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackupsPage } from '../backups-page';

interface BackupsLinkSectionProps {
    schoolsList: Array<{ id: string; name: string }>;
}

export function BackupsLinkSection({ schoolsList }: BackupsLinkSectionProps) {
    const { isDark, accent } = useAdminTheme();
    const [showBackups, setShowBackups] = useState(false);

    if (showBackups) {
        return <BackupsPage schoolsList={schoolsList} onClose={() => setShowBackups(false)} />;
    }

    return (
        <Button
            onClick={() => setShowBackups(true)}
            className={`w-full rounded-2xl h-12 font-black text-base gap-2 ${t.btnPrimary(isDark, accent)}`}
            style={isDark ? { boxShadow: t.glowStyle(isDark, accent).boxShadow } : {}}
        >
            <HardDrive size={20} />
            School Backups
            <ChevronRight size={18} className="ml-auto" />
        </Button>
    );
}
