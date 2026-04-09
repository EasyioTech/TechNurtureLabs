'use client';

import { useState, useCallback } from 'react';

export function useAdminBackups() {
    const [backups, setBackups] = useState<any[]>([]);
    const [backupsLoading, setBackupsLoading] = useState(false);
    const [backupsInitialized, setBackupsInitialized] = useState(false);
    const [selectedSchoolId, setSelectedSchoolId] = useState<string | undefined>();

    const loadBackups = useCallback(async (schoolId?: string) => {
        setBackupsLoading(true);
        try {
            const { listSchoolBackupsAdmin } = await import('@/app/(super-admin)/admin-portal/actions/backup-actions');
            const result = await listSchoolBackupsAdmin(schoolId || '');
            if (result.success) {
                setBackups(result.backups);
                setSelectedSchoolId(schoolId);
            }
        } catch (error) {
            console.error('Failed to load backups:', error);
            setBackups([]);
        } finally {
            setBackupsLoading(false);
            setBackupsInitialized(true);
        }
    }, []);

    return {
        backups,
        setBackups,
        backupsLoading,
        backupsInitialized,
        selectedSchoolId,
        loadBackups
    };
}
