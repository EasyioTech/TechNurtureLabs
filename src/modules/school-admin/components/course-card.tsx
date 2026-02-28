'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';

interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    published: boolean;
    lesson_count: number;
    enrolled_count: number;
}

export function CourseCard({ course, index }: { course: Course; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <Card className="bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-lg hover:shadow-xl transition-all group overflow-hidden">
                <div className="relative h-40 overflow-hidden">
                    <img
                        src={course.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400'}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                    <div className="absolute top-3 right-3">
                        <Badge className={course.published ? 'bg-emerald-500 text-white border-0' : 'bg-slate-500 text-white border-0'}>
                            {course.published ? 'Published' : 'Draft'}
                        </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <span className="text-white/90 text-sm font-medium">{course.lesson_count} Lessons</span>
                        <span className="text-white/90 text-sm">{course.enrolled_count} enrolled</span>
                    </div>
                </div>
                <CardContent className="p-4">
                    <h3 className="font-bold text-slate-800 mb-2 group-hover:text-violet-600 transition-colors">
                        {course.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                        {course.description || 'No description available'}
                    </p>
                    <Link href={`/school-admin/course/${course.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                            <Eye size={14} className="mr-1" />View Details
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </motion.div>
    );
}
