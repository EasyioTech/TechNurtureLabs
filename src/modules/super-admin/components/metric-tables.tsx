'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Target, Users } from 'lucide-react';
import { UserMetric, CourseMetric } from '../types';

interface MetricTablesProps {
    userMetrics: UserMetric[];
    courseMetrics: CourseMetric[];
}

export function MetricTables({ userMetrics, courseMetrics }: MetricTablesProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-stone-200 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                        <Users className="text-sky-500" size={20} />
                        Top Students
                    </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-stone-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-4 py-3 text-left">Student</th>
                                <th className="px-4 py-3 text-left">School</th>
                                <th className="px-4 py-3 text-right">XP</th>
                                <th className="px-4 py-3 text-right">Progress</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {userMetrics.map(u => (
                                <tr key={u.id} className="hover:bg-sky-50/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="w-8 h-8">
                                                <AvatarFallback className="bg-sky-100 text-sky-600 font-bold text-xs uppercase">
                                                    {u.full_name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-semibold text-slate-700">{u.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">{u.school_name}</td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-700">{u.total_xp.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100">
                                            {u.lessons_completed} lessons
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Card className="bg-white border-stone-200 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-stone-100 bg-stone-50/50">
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                        <Target className="text-emerald-500" size={20} />
                        Course Performance
                    </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-stone-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-4 py-3 text-left">Course</th>
                                <th className="px-4 py-3 text-right">Enrolled</th>
                                <th className="px-4 py-3 text-right">Completion</th>
                                <th className="px-4 py-3 text-right">Avg Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {courseMetrics.map(c => (
                                <tr key={c.id} className="hover:bg-emerald-50/30 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-700">{c.title}</td>
                                    <td className="px-4 py-3 text-right text-slate-500">{c.enrolled_count}</td>
                                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{c.completion_rate}%</td>
                                    <td className="px-4 py-3 text-right">
                                        <Badge variant="outline" className="bg-sky-50 text-sky-600 border-sky-100">
                                            {c.avg_score}%
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
