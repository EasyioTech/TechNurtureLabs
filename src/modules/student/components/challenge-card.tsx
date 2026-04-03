import { motion } from 'framer-motion';
import { Award, Zap, CheckCircle2, Sparkles } from 'lucide-react';

interface ChallengeCardProps {
    title: string;
    progress: number;
    total: number;
    reward: number;
    icon: any;
    unit?: string;
    color: string;
    description?: string;
}

export function ChallengeCard({ title, progress, total, reward, icon: Icon, unit = '', color, description }: ChallengeCardProps) {
    const percentage = Math.min((progress / total) * 100, 100);
    const isComplete = progress >= total;

    const themes: Record<string, { bg: string, text: string, accent: string, glow: string, border: string }> = {
        amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', accent: 'bg-amber-500', glow: 'shadow-amber-500/20', border: 'border-amber-100' },
        sky: { bg: 'bg-sky-500/10', text: 'text-sky-500', accent: 'bg-sky-500', glow: 'shadow-sky-500/20', border: 'border-sky-100' },
        violet: { bg: 'bg-violet-500/10', text: 'text-violet-500', accent: 'bg-violet-500', glow: 'shadow-violet-500/20', border: 'border-violet-100' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', accent: 'bg-emerald-500', glow: 'shadow-emerald-500/20', border: 'border-emerald-100' },
        indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', accent: 'bg-indigo-500', glow: 'shadow-indigo-500/20', border: 'border-indigo-100' },
    };

    const theme = themes[color] || themes.indigo;

    return (
        <motion.div
            whileHover={{ y: -8 }}
            className={`relative group h-full bg-white rounded-[2.5rem] p-8 border transition-all duration-500 hover:shadow-2xl hover:shadow-slate-300/20 ${
                isComplete ? 'ring-2 ring-emerald-500/30 border-emerald-200' : `border-slate-100 ${theme.border}`
            }`}
        >
            {/* Background Accent Gradient */}
            <div className={`absolute top-0 right-0 w-40 h-40 ${theme.bg} rounded-full blur-3xl -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none`} />

            <div className="flex items-start justify-between mb-7 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${theme.bg} ${theme.text} shadow-md group-hover:scale-125 transition-transform duration-500`}>
                    <motion.div animate={isComplete ? { rotate: 360 } : { scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                        <Icon size={28} strokeWidth={2.5} />
                    </motion.div>
                </div>

                <div className={`flex flex-col items-end gap-2`}>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg hover:shadow-xl"
                    >
                        <Zap size={11} className="text-amber-400 fill-amber-400" />
                        +{reward} XP
                    </motion.div>
                    {isComplete && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1.5 text-emerald-600 font-black text-[8px] uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200"
                        >
                           <CheckCircle2 size={10} fill="currentColor" /> UNLOCKED
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="mb-7 relative z-10">
                <h4 className="text-lg font-black text-slate-950 tracking-tighter leading-snug uppercase mb-3">
                    {title}
                </h4>
                {description && (
                    <p className="text-[11px] font-semibold text-slate-600 leading-relaxed mb-4">
                        {description}
                    </p>
                )}
                <div className="flex items-baseline gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 inline-block">
                    <span className="text-lg font-black text-slate-950 tracking-tight">{progress}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{unit}</span>
                    <span className="text-slate-300 font-light">/</span>
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{total}{unit}</span>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress</span>
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`text-[11px] font-black tracking-tight ${isComplete ? 'text-emerald-600' : 'text-slate-900'}`}
                    >
                        {Math.round(percentage)}%
                    </motion.span>
                </div>

                <div className="h-4 bg-slate-100 rounded-2xl p-1 border border-slate-200 overflow-hidden relative">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className={`h-full rounded-xl relative ${isComplete ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.6)]' : `bg-gradient-to-r from-${color}-400 to-${color}-600 ${theme.glow}`}`}
                    >
                        <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    </motion.div>
                </div>
            </div>

            {/* Bottom Action Area */}
            <div className="mt-7 pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
                <span className={`text-[9px] font-black uppercase tracking-widest ${isComplete ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {isComplete ? '✓ Completed' : 'In Progress'}
                </span>
                <motion.div animate={!isComplete ? { x: [0, 5, 0] } : {}} transition={{ duration: 2, repeat: Infinity }}>
                    {isComplete ? <Sparkles size={14} className="text-emerald-500" /> : <Award size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />}
                </motion.div>
            </div>
        </motion.div>
    );
}
