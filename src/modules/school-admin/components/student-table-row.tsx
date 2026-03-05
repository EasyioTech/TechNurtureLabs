'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Star, Flame, Eye, Edit } from 'lucide-react';

interface Student {
    id: string;
    full_name: string;
    total_xp: number;
    current_streak: number;
    level: number;
    class_name?: string;
    progress?: number;
    status: 'active' | 'inactive' | 'graduating';
}

export function StudentTableRow({ student, index }: { student: Student; index: number }) {
    return (
        <motion.tr
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="hover:bg-slate-50/50"
        >
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-violet-100 text-violet-600 text-xs font-medium text-center flex items-center justify-center">
                            {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium text-slate-800">{student.full_name}</p>
                        <p className="text-xs text-slate-400">ID: {student.id.slice(0, 8)}</p>
                    </div>
                </div>
            </td>
            <td className="p-4 text-slate-600">{student.class_name}</td>
            <td className="p-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                        {student.level}
                    </div>
                </div>
            </td>
            <td className="p-4">
                <div className="flex items-center gap-1 text-amber-500">
                    <Star size={14} fill="currentColor" />
                    <span className="font-semibold">{student.total_xp}</span>
                </div>
            </td>
            <td className="p-4">
                <div className="flex items-center gap-1 text-orange-500">
                    <Flame size={14} />
                    <span className="font-semibold">{student.current_streak}</span>
                </div>
            </td>
            <td className="p-4">
                <div className="flex items-center gap-2">
                    <Progress value={student.progress} className="w-20 h-2" />
                    <span className="text-sm text-slate-600">{student.progress}%</span>
                </div>
            </td>
            <td className="p-4">
                <Badge className={student.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-slate-100 text-slate-600 border-0'}>
                    {student.status}
                </Badge>
            </td>
            <td className="p-4">
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="w-8 h-8">
                        <Eye size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8">
                        <Edit size={16} />
                    </Button>
                </div>
            </td>
        </motion.tr>
    );
}
