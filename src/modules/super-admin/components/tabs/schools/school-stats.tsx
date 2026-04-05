import React from 'react';
import { motion } from 'framer-motion';
import { Building2, CheckCircle2, IndianRupee, ArrowUpRight } from 'lucide-react';
import { useAdminTheme, t } from '../../../theme-context';
import { Stats } from '../../../types';

interface SchoolStatsProps {
    stats: Stats;
}

export function SchoolStats({ stats }: SchoolStatsProps) {
    const { isDark, accent } = useAdminTheme();

    const statItems = [
        { 
            value: (stats?.activeSchools || 0).toString(), 
            label: 'Active Institutions', 
            icon: Building2, 
            badge: `of ${stats?.totalSchools || 0} TOTAL`, 
            theme: 'accent' 
        },
        { 
            value: (stats?.activeSubscriptions || 0).toString(), 
            label: 'Active Subscriptions', 
            icon: CheckCircle2, 
            badge: `${stats?.trialingSubscriptions || 0} TRIALS`, 
            theme: 'accent' 
        },
        { 
            value: `\u20B9${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`, 
            label: 'Platform Revenue', 
            icon: IndianRupee, 
            badge: 'ALL-TIME', 
            theme: 'accent' 
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {statItems.map((item, i) => {
                const activeTheme = isDark ? accent.softDark : accent.softLight;
                return (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: i * 0.05 }}
                        className={`rounded-[24px] border p-6 transition-all duration-300 shadow-lg shadow-black/5 flex flex-col justify-between group ${t.card(isDark)} ${t.cardHover(isDark)} ${t.cardHoverAccent(isDark, accent)}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>{item.label}</p>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${activeTheme}`}>
                                <item.icon size={14} />
                            </div>
                        </div>
                        <div>
                            <p className={`text-3xl font-[900] tracking-tighter ${t.textPrimary(isDark)}`}>{item.value}</p>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-black mt-3 px-2.5 py-1 rounded-full ${t.accentBadge(isDark, accent)}`}>
                                <ArrowUpRight size={10} />{item.badge}
                            </span>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
