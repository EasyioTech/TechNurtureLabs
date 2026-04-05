import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, Plus, Trash2, Loader2 } from 'lucide-react';
import { useAdminTheme, t } from '../../../theme-context';

interface AcademicClassesSectionProps {
    classesList: any[];
    classesLoading: boolean;
    newClassName: string;
    setNewClassName: (val: string) => void;
    newClassLevel: string;
    setNewClassLevel: (val: string) => void;
    classCreating: boolean;
    deletingClassId: string | null;
    onCreateClass: () => void;
    onDeleteClass: (classId: string, className: string) => void;
}

export function AcademicClassesSection({
    classesList, classesLoading,
    newClassName, setNewClassName,
    newClassLevel, setNewClassLevel,
    classCreating, deletingClassId,
    onCreateClass, onDeleteClass
}: AcademicClassesSectionProps) {
    const { isDark, accent } = useAdminTheme();

    return (
        <div className={`p-6 md:p-10 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-[#121214]' : 'bg-white'} shadow-xl`}>
            <div className="flex items-center gap-4 mb-8">
                <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                    <GraduationCap className={accent.text} size={28} />
                </div>
                <div className="flex-1">
                    <h2 className={`text-2xl font-black ${t.textPrimary(isDark)} tracking-tight`}>Academic Classes</h2>
                    <p className={`text-sm ${t.textSecondary(isDark)} font-medium mt-1`}>Manage class levels available for school registration. Default classes (1–12) are auto-created.</p>
                </div>
                <div className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                    {classesList.length} total
                </div>
            </div>

            {/* Add New Class */}
            <div className={`p-5 rounded-2xl border-2 border-dashed ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50/50'} mb-6`}>
                <div className="flex items-center gap-2 mb-4">
                    <Plus size={16} className={accent.text} />
                    <span className={`text-xs font-black uppercase tracking-widest ${t.textSecondary(isDark)}`}>Add New Class</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <Input
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            placeholder="e.g., Class 13 or Nursery"
                            className={`h-12 rounded-xl font-medium ${isDark ? '!bg-white/[0.06] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        />
                    </div>
                    <div className="w-full sm:w-32">
                        <Input
                            type="number"
                            value={newClassLevel}
                            onChange={(e) => setNewClassLevel(e.target.value)}
                            placeholder="Level"
                            min={0}
                            className={`h-12 rounded-xl font-medium ${isDark ? '!bg-white/[0.06] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        />
                    </div>
                    <Button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCreateClass(); }}
                        disabled={classCreating || !newClassName.trim() || !newClassLevel}
                        className={`h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-xs ${accent.bg} text-white hover:opacity-90 transition-all shrink-0`}
                    >
                        {classCreating ? <Loader2 className="animate-spin mr-2" size={16} /> : <Plus className="mr-1" size={16} />}
                        Add
                    </Button>
                </div>
                <p className={`text-[10px] ${t.textMuted(isDark)} font-medium mt-2`}>
                    Level determines sort order. Lower levels appear first in registration.
                </p>
            </div>

            {/* Classes List */}
            {classesLoading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className={`animate-spin ${accent.text}`} size={24} />
                </div>
            ) : classesList.length === 0 ? (
                <div className={`text-center py-12 ${t.textMuted(isDark)}`}>
                    <GraduationCap size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-sm">No classes found</p>
                    <p className="text-xs mt-1">Add a class above to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <AnimatePresence mode="popLayout">
                        {classesList.map((cls) => (
                            <motion.div
                                key={cls.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all ${isDark
                                    ? 'bg-white/[0.03] border-white/[0.06] hover:border-white/10'
                                    : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {cls.level}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate ${t.textPrimary(isDark)}`}>{cls.name}</p>
                                    <p className={`text-[10px] font-medium ${t.textMuted(isDark)}`}>Level {cls.level}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteClass(cls.id, cls.name); }}
                                    disabled={deletingClassId === cls.id}
                                    className={`opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all cursor-pointer ${isDark
                                        ? 'hover:bg-rose-500/10 text-rose-400'
                                        : 'hover:bg-rose-50 text-rose-500'
                                        }`}
                                    title={`Delete ${cls.name}`}
                                >
                                    {deletingClassId === cls.id ? (
                                        <Loader2 className="animate-spin" size={16} />
                                    ) : (
                                        <Trash2 size={16} />
                                    )}
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
