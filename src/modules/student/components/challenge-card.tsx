import { motion } from 'framer-motion';
import { Award, Zap, CheckCircle2 } from 'lucide-react';

interface ChallengeCardProps {
    title: string;
    progress: number;
    total: number;
    reward: number;
    icon: any;
    unit?: string;
    color: string;
}

export function ChallengeCard({ title, progress, total, reward, icon: Icon, unit = '', color }: ChallengeCardProps) {
    const percentage = Math.min((progress / total) * 100, 100);
    const isComplete = progress >= total;

    const themes: Record<string, { bg: string, text: string, accent: string, glow: string }> = {
        amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', accent: 'bg-amber-500', glow: 'shadow-amber-500/20' },
        sky: { bg: 'bg-sky-500/10', text: 'text-sky-500', accent: 'bg-sky-500', glow: 'shadow-sky-500/20' },
        violet: { bg: 'bg-violet-500/10', text: 'text-violet-500', accent: 'bg-violet-500', glow: 'shadow-violet-500/20' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', accent: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
        indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', accent: 'bg-indigo-500', glow: 'shadow-indigo-500/20' },
    };

    const theme = themes[color] || themes.indigo;

    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className={`relative group h-full bg-white rounded-[2.5rem] p-8 border border-slate-100 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] ${isComplete ? 'ring-2 ring-emerald-500/20 border-emerald-100' : ''}`}
        >
            {/* Background Accent Gradient */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${theme.bg} rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none`} />

            <div className="flex items-start justify-between mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${theme.bg} ${theme.text} shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                    <Icon size={28} strokeWidth={2.5} />
                </div>
                
                <div className={`flex flex-col items-end`}>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-full font-black text-[9px] uppercase tracking-widest shadow-xl">
                        <Zap size={10} className="text-amber-400 fill-amber-400" />
                        +{reward} XP
                    </div>
                    {isComplete && (
                        <div className="mt-2 flex items-center gap-1 text-emerald-500 font-black text-[8px] uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                           <CheckCircle2 size={8} /> Completed
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-8">
                <h4 className="text-lg font-black text-slate-900 tracking-tighter leading-[1.1] uppercase mb-3">
                    {title}
                </h4>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 tracking-tighter">{progress}</span>
                    <span className="text-sm font-black text-slate-300 uppercase tracking-widest">{unit}</span>
                    <span className="mx-2 text-slate-200 font-light">/</span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{total}{unit}</span>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Completion</span>
                    <span className={isComplete ? 'text-emerald-500' : 'text-slate-900'}>{Math.round(percentage)}%</span>
                </div>
                
                <div className="h-4 bg-slate-50 rounded-full p-1 border border-slate-100 overflow-hidden relative">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full rounded-full relative ${isComplete ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : `${theme.accent} ${theme.glow}`}`}
                    >
                        {/* Animated gloss effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full -translate-x-full animate-[shimmer_2s_infinite]" />
                    </motion.div>
                </div>
            </div>

            {/* Hover Footer Action */}
            {!isComplete && (
                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between opacity-50 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Objective in progress</span>
                    <Award size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </div>
            )}
        </motion.div>
    );
}
