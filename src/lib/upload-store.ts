'use client';

import { useState, useEffect } from 'react';

export interface UploadTask {
    id: string;
    fileName: string;
    progress: number;
    isUploading: boolean;
    error: string | null;
    isLocalVisible?: boolean;
    onCancel?: () => void;
    onReset?: () => void;
}

type Listener = (tasks: Record<string, UploadTask>) => void;
let listeners: Listener[] = [];
let tasks: Record<string, UploadTask> = {};

const emit = () => {
    listeners.forEach(l => l(tasks));
};

export const uploadStore = {
    getState: () => tasks,
    subscribe: (listener: Listener) => {
        listeners.push(listener);
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    },
    addTask: (task: UploadTask) => {
        tasks = { ...tasks, [task.id]: task };
        emit();
    },
    updateTask: (id: string, updates: Partial<UploadTask>) => {
        if (!tasks[id]) return;
        tasks = {
            ...tasks,
            [id]: { ...tasks[id], ...updates }
        };
        emit();
    },
    removeTask: (id: string) => {
        const newTasks = { ...tasks };
        delete newTasks[id];
        tasks = newTasks;
        emit();
    }
};

export function useUploadTasks() {
    const [currentTasks, setCurrentTasks] = useState(tasks);

    useEffect(() => {
        return uploadStore.subscribe(setCurrentTasks);
    }, []);

    return currentTasks;
}
