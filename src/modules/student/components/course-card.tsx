'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    totalLessons: number;
    completedLessons: number;
}

export function CourseCard({ course }: { course: Course }) {
    const progress = course.totalLessons > 0
        ? (course.completedLessons / course.totalLessons) * 100
        : 0;

    return (
        <Link href={`/student/course/${course.id}`}>
            <Card className="group bg-white border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-shadow duration-150 overflow-hidden cursor-pointer h-full flex flex-col">
                <div className="relative h-40 sm:h-44 overflow-hidden bg-slate-100">
                    <img
                        src={course.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600'}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                        <span className="text-xs font-medium text-white/90">{course.totalLessons} lessons</span>
                    </div>
                </div>

                <CardContent className="p-4 sm:p-5 flex-1 flex flex-col">
                    <div className="flex-1">
                        <h4 className="font-semibold text-base text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors duration-150">
                            {course.title}
                        </h4>
                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                            {course.description || 'Interactive lessons and practice exercises.'}
                        </p>
                    </div>

                    <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">{course.completedLessons} of {course.totalLessons} done</span>
                            <span className="font-medium text-slate-700">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 rounded-full transition-[width] duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <Button
                            size="sm"
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium"
                        >
                            {progress > 0 ? 'Continue' : 'Start'}
                            <ChevronRight size={16} className="ml-1" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
