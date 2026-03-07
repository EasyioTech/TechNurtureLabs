'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useSchoolTheme, ts } from '../../theme-context';
import { SchoolStats } from '../../types';
import { Settings, CreditCard, Shield, Bell, HelpCircle, CheckCircle2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { promoteStudentsAction } from '../../actions';

interface SettingsTabProps {
    stats: SchoolStats;
    schoolId: string;
}

export function SchoolSettingsTab({ stats, schoolId }: SettingsTabProps) {
    const { isDark } = useSchoolTheme();

    const sections = [
        {
            title: 'Plan & Renewal',
            icon: CreditCard,
            content: (
                <div className="space-y-6">
                    <div className={`p-6 rounded-2xl border ${ts.card(isDark)}`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className={`text-lg font-black mb-1 ${ts.textPrimary(isDark)}`}>Current Plan: {stats.planName || 'Free'}</h3>
                                <p className={`text-sm ${ts.textSecondary(isDark)} mb-4`}>
                                    {stats.subscriptionStatus === 'active'
                                        ? `Your plan is active and will renew on ${stats.planExpiry ? new Date(stats.planExpiry).toLocaleDateString() : 'N/A'}`
                                        : 'Your current plan has expired or requires attention.'}
                                </p>
                            </div>
                            <div className={`px-3 py-1 text-xs font-bold rounded-full ${stats.subscriptionStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                {stats.subscriptionStatus?.toUpperCase() || 'INACTIVE'}
                            </div>
                        </div>
                        <div className="flex gap-4 mt-2">
                            <Button className={`rounded-xl font-bold ${ts.btnPrimary(isDark)}`}>
                                Manage Subscription
                            </Button>
                            <Button variant="outline" className={`rounded-xl font-bold transition-colors ${isDark ? 'border-white/10 text-white hover:bg-white/5' : 'border-slate-200 text-slate-800 hover:bg-slate-50'}`}>
                                View Invoices
                            </Button>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'General Settings',
            icon: Settings,
            content: (
                <div className="space-y-4">
                    <div className={`p-6 rounded-2xl border flex items-center justify-between ${ts.card(isDark)}`}>
                        <div>
                            <h4 className={`font-bold ${ts.textPrimary(isDark)}`}>Email Notifications</h4>
                            <p className={`text-sm ${ts.textSecondary(isDark)}`}>Receive updates on student enrollment and platform news.</p>
                        </div>
                        <Button variant="outline" className={`rounded-full px-5 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>Configure</Button>
                    </div>
                    <div className={`p-6 rounded-2xl border flex items-center justify-between ${ts.card(isDark)}`}>
                        <div>
                            <h4 className={`font-bold ${ts.textPrimary(isDark)}`}>School Details</h4>
                            <p className={`text-sm ${ts.textSecondary(isDark)}`}>Update public information visible to students.</p>
                        </div>
                        <Button variant="outline" className={`rounded-full px-5 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>Edit Profile</Button>
                    </div>
                </div>
            )
        },
        {
            title: 'Security',
            icon: Shield,
            content: (
                <div className={`p-6 rounded-2xl border flex items-center justify-between ${ts.card(isDark)}`}>
                    <div>
                        <h4 className={`font-bold ${ts.textPrimary(isDark)}`}>Password & Authentication</h4>
                        <p className={`text-sm ${ts.textSecondary(isDark)}`}>Manage your password and active sessions.</p>
                    </div>
                    <Button variant="outline" className={`rounded-full px-5 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>Update Password</Button>
                </div>
            )
        },
        {
            title: 'Academic Management',
            icon: GraduationCap,
            content: (
                <div className={`p-6 rounded-2xl border ${ts.card(isDark)}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h4 className={`font-bold text-red-500 mb-1`}>End of Academic Session</h4>
                            <p className={`text-sm tracking-tight ${ts.textSecondary(isDark)}`}>
                                Close the current session and automatically promote all students to their next respective class levels.
                            </p>
                        </div>
                        <Button
                            onClick={async () => {
                                if (confirm('Are you sure you want to end the current academic session and promote all students? This cannot be undone easily.')) {
                                    try {
                                        const res = await promoteStudentsAction(schoolId, `Session ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
                                        toast.success(res?.message || 'Students have been successfully promoted!');
                                    } catch (err: any) {
                                        toast.error(err.message || 'Failed to promote students.');
                                    }
                                }
                            }}
                            className={`rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white shrink-0`}>
                            Promote End of Session
                        </Button>
                    </div>
                    <p className={`text-xs mt-4 p-3 rounded-lg border ${isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                        <strong>Warning:</strong> Ensure all end-of-year grades and certificates have been finalized before continuing. This action will archive current active records.
                    </p>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 max-w-4xl">
            <div className="mb-8">
                <h2 className={`text-2xl font-black mb-2 tracking-tight ${ts.textPrimary(isDark)}`}>School Settings</h2>
                <p className={`text-[13px] font-bold ${ts.textSecondary(isDark)}`}>Manage your school configuration, billing, and platform preferences.</p>
            </div>

            <div className="grid gap-8">
                {sections.map((section, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.4 }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                <section.icon size={20} strokeWidth={2.5} />
                            </div>
                            <h3 className={`text-lg font-black tracking-tight ${ts.textPrimary(isDark)}`}>{section.title}</h3>
                        </div>
                        {section.content}
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="pt-6 mt-8 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between"
            >
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>All services running normally</span>
                </div>
                <Button variant="ghost" className="text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl px-4 font-bold h-9 flex items-center gap-2">
                    <HelpCircle size={16} /> Help & Support
                </Button>
            </motion.div>
        </div>
    );
}
