'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
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
            <Card className="bg-white border-stone-200 hover:border-sky-300 shadow-sm hover:shadow-md transition-all group overflow-hidden cursor-pointer">
                <div className="relative h-44 overflow-hidden">
                    <img
                        src={course.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400'}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                        <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[11px] font-bold text-slate-700 shadow-sm">
                            {course.totalLessons} Lessons
                        </span>
                    </div>
                </div>
                <CardContent className="p-5">
                    <h4 className="font-bold text-lg mb-2 text-slate-800 group-hover:text-sky-600 transition-colors">
                        {course.title}
                    </h4>
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                        {course.description || 'Master the fundamentals with interactive lessons and quizzes.'}
                    </p>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">{course.completedLessons} of {course.totalLessons} complete</span>
                            <span className="font-semibold text-sky-600">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-sky-500 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <Button
                        className="w-full mt-5 bg-sky-500 hover:bg-sky-600 border-0 shadow-lg shadow-sky-200 text-white font-semibold"
                    >
                        <Play size={16} className="mr-2" />
                        {progress > 0 ? 'Continue' : 'Start'} Learning
                    </Button>
                </CardContent>
            </Card>
        </Link>
    );
}
