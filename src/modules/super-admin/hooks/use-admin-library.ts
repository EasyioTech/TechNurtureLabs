'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { fetchGlobalLessons, fetchGlobalQuizzes } from '../actions';

export function useAdminLibrary() {
    const [globalLessons, setGlobalLessons] = useState<any[]>([]);
    const [globalQuizzes, setGlobalQuizzes] = useState<any[]>([]);
    const [globalLoading, setGlobalLoading] = useState(false);
    const [globalLessonsPage, setGlobalLessonsPage] = useState(1);
    const [totalGlobalLessonsPages, setTotalGlobalLessonsPages] = useState(0);
    const [globalQuizzesPage, setGlobalQuizzesPage] = useState(1);
    const [totalGlobalQuizzesPages, setTotalGlobalQuizzesPages] = useState(0);

    async function loadGlobalLessons(page = 1, search = '') {
        setGlobalLoading(true);
        try {
            const res = await fetchGlobalLessons({ page, search });
            setGlobalLessons(res.data);
            setGlobalLessonsPage(page);
            setTotalGlobalLessonsPages(res.pages);
        } catch { toast.error('Failed to load global lessons'); }
        finally { setGlobalLoading(false); }
    }

    async function loadGlobalQuizzes(page = 1, search = '') {
        setGlobalLoading(true);
        try {
            const res = await fetchGlobalQuizzes({ page, search });
            setGlobalQuizzes(res.data);
            setGlobalQuizzesPage(page);
            setTotalGlobalQuizzesPages(res.pages);
        } catch { toast.error('Failed to load global quizzes'); }
        finally { setGlobalLoading(false); }
    }

    return {
        globalLessons, globalQuizzes, globalLoading,
        globalLessonsPage, totalGlobalLessonsPages,
        globalQuizzesPage, totalGlobalQuizzesPages,
        loadGlobalLessons, loadGlobalQuizzes,
    };
}
