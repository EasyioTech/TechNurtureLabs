'use client';

import React, { useState } from 'react';
import {
    Bell, Shield, CheckCircle2, LogOut, ArrowRight,
    Loader2, User, Lock, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
    updateNotificationPreferences,
    updatePrivacySettings,
    changeStudentPassword
} from '@/modules/student/actions/settings-actions';
import { deleteStudentAccountAction } from '@/modules/student/actions';

type TabType = 'notifications' | 'security';

interface SettingsClientProps {
    initialData: {
        profile: any;
        stats: any;
        school?: any;
    };
}

export function SettingsClient({ initialData }: SettingsClientProps) {
    const { signOut } = useAuth();
    const { profile: userProfile, stats } = initialData;

    const [activeTab, setActiveTab] = useState<TabType>('notifications');

    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailReports, setEmailReports] = useState(true);
    const [newContentAlerts, setNewContentAlerts] = useState(true);
    const [publicProfile, setPublicProfile] = useState(true);

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (activeTab === 'notifications') {
                await updateNotificationPreferences({
                    mobile_push: pushEnabled,
                    email_reports: emailReports,
                    new_content: newContentAlerts,
                });
            } else {
                await updatePrivacySettings({ public_profile: publicProfile });
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save settings:', err);
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Please fill in all password fields.');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match.');
            return;
        }
        if (newPassword.length < 8) {
            toast.error('New password must be at least 8 characters.');
            return;
        }
        setSavingPassword(true);
        try {
            const result = await changeStudentPassword(currentPassword, newPassword);
            if (result.success) {
                toast.success('Password changed successfully.');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast.error(result.error || 'Failed to change password.');
            }
        } catch (err) {
            toast.error('An error occurred. Please try again.');
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/10 pb-20">

            {/* ── Header ── */}
            <div className="relative bg-white border-b border-slate-100 py-14 px-6 lg:px-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/40 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3" />

                <div className="max-w-[1200px] mx-auto relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                    {/* Identity */}
                    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-3">Account Settings</p>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-[0.9] mb-4">
                            {userProfile?.full_name || 'Student'}
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                            Level {stats?.level ?? 1} · {userProfile?.className || 'Student'}
                        </p>
                    </motion.div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <Link href="/student/profile">
                            <Button variant="outline" className="h-12 px-6 rounded-xl border-2 border-slate-100 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:border-indigo-200 hover:text-indigo-600 transition-all">
                                <User size={15} />
                                View Profile
                            </Button>
                        </Link>
                        <button
                            onClick={() => signOut()}
                            aria-label="Sign out"
                            className="h-12 px-5 rounded-xl bg-rose-50 border-2 border-rose-100 flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                        >
                            <LogOut size={15} />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <main className="max-w-[1200px] mx-auto px-6 lg:px-12 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Tab Nav */}
                    <nav className="lg:col-span-3 flex flex-row lg:flex-col gap-3" aria-label="Settings navigation">
                        <TabButton
                            active={activeTab === 'notifications'}
                            icon={Bell}
                            label="Notifications"
                            onClick={() => setActiveTab('notifications')}
                        />
                        <TabButton
                            active={activeTab === 'security'}
                            icon={Shield}
                            label="Privacy & Security"
                            onClick={() => setActiveTab('security')}
                        />
                    </nav>

                    {/* Panel */}
                    <div className="lg:col-span-9">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                            >
                                {activeTab === 'notifications' ? (
                                    <SettingsPanel
                                        title="Notification Preferences"
                                        description="Notification delivery is coming soon."
                                    >
                                        <ToggleRow
                                            title="Push Notifications"
                                            description="Real-time alerts on goals, streaks, and achievements."
                                            checked={pushEnabled}
                                            onChange={setPushEnabled}
                                            comingSoon
                                        />
                                        <Divider />
                                        <ToggleRow
                                            title="Learning Progress Reports"
                                            description="Weekly summary of your completed lessons and quiz scores."
                                            checked={emailReports}
                                            onChange={setEmailReports}
                                            comingSoon
                                        />
                                        <Divider />
                                        <ToggleRow
                                            title="New Content Alerts"
                                            description="Get notified when new lessons or courses are published."
                                            checked={newContentAlerts}
                                            onChange={setNewContentAlerts}
                                            comingSoon
                                        />
                                    </SettingsPanel>
                                ) : (
                                    <div className="space-y-6">
                                        <SettingsPanel
                                            title="Privacy"
                                            description="Control your visibility on the platform."
                                        >
                                            <ToggleRow
                                                title="Public Profile"
                                                description="Show your name and XP on the school leaderboard."
                                                checked={publicProfile}
                                                onChange={setPublicProfile}
                                            />
                                        </SettingsPanel>

                                        <SettingsPanel
                                            title="Change Password"
                                            description="Update your account password."
                                        >
                                            <div className="space-y-4">
                                                <PasswordInput
                                                    label="Current Password"
                                                    value={currentPassword}
                                                    onChange={setCurrentPassword}
                                                    show={showCurrentPw}
                                                    onToggleShow={() => setShowCurrentPw(v => !v)}
                                                />
                                                <PasswordInput
                                                    label="New Password"
                                                    value={newPassword}
                                                    onChange={setNewPassword}
                                                    show={showNewPw}
                                                    onToggleShow={() => setShowNewPw(v => !v)}
                                                />
                                                <PasswordInput
                                                    label="Confirm New Password"
                                                    value={confirmPassword}
                                                    onChange={setConfirmPassword}
                                                    show={showNewPw}
                                                    onToggleShow={() => setShowNewPw(v => !v)}
                                                />
                                                <Button
                                                    onClick={handlePasswordChange}
                                                    disabled={savingPassword}
                                                    className="mt-2 h-11 px-6 bg-slate-950 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-600 transition-all flex items-center gap-2"
                                                >
                                                    {savingPassword
                                                        ? <Loader2 size={15} className="animate-spin" />
                                                        : <><Lock size={14} /><span>Update Password</span></>
                                                    }
                                                </Button>
                                            </div>
                                        </SettingsPanel>

                                        <SettingsPanel
                                            title="Delete Account"
                                            description="Permanently remove your account and all progress data."
                                            danger
                                        >
                                            <p className="text-[11px] font-bold text-rose-600/80 uppercase tracking-wider leading-relaxed mb-6">
                                                This action cannot be undone. All your XP, streaks, and lesson history will be erased forever.
                                            </p>
                                            <Button
                                                variant="destructive"
                                                className="rounded-xl font-black uppercase text-[10px] tracking-widest h-12 px-8 shadow-lg shadow-rose-200"
                                                onClick={async () => {
                                                    if (confirm('Are you sure? All your progress will be permanently lost.')) {
                                                        await deleteStudentAccountAction();
                                                    }
                                                }}
                                            >
                                                Delete My Account
                                            </Button>
                                        </SettingsPanel>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Save bar — only for tabs that have saveable toggles */}
                        <div className="flex items-center justify-end gap-6 pt-8 mt-8 border-t border-slate-100">
                            <AnimatePresence>
                                {saved && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-2 text-emerald-600 font-black uppercase tracking-[0.3em] text-[9px]"
                                    >
                                        <CheckCircle2 size={16} />
                                        Saved
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="h-12 px-8 bg-slate-950 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center gap-3"
                            >
                                {saving
                                    ? <Loader2 size={16} className="animate-spin" />
                                    : <><span>Save</span><ArrowRight size={15} /></>
                                }
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

/* ── Sub-components ── */

function TabButton({ active, icon: Icon, label, onClick }: {
    active: boolean; icon: React.ElementType; label: string; onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2 ${
                active
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-200 lg:translate-x-2'
                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200 hover:text-slate-800 shadow-sm'
            }`}
        >
            <Icon size={17} strokeWidth={active ? 2.5 : 2} />
            <span className="whitespace-nowrap">{label}</span>
        </button>
    );
}

function SettingsPanel({ title, description, children, danger = false }: {
    title: string; description: string; children: React.ReactNode; danger?: boolean;
}) {
    return (
        <section className={`rounded-3xl p-8 border shadow-sm ${danger ? 'bg-rose-50/40 border-rose-100' : 'bg-white border-slate-100'}`}>
            <div className={`border-l-4 pl-5 mb-8 ${danger ? 'border-rose-500' : 'border-indigo-600'}`}>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1.5">{title}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{description}</p>
            </div>
            {children}
        </section>
    );
}

function ToggleRow({ title, description, checked, onChange, comingSoon = false }: {
    title: string; description: string; checked: boolean; onChange: (v: boolean) => void; comingSoon?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-6">
            <div>
                <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-[15px] font-black text-slate-900 uppercase tracking-tight leading-none">{title}</p>
                    {comingSoon && (
                        <span className="text-[7px] font-black uppercase tracking-widest bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200">
                            Coming Soon
                        </span>
                    )}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{description}</p>
            </div>
            <Switch
                checked={checked}
                onCheckedChange={onChange}
                disabled={comingSoon}
                className="flex-shrink-0 scale-110 data-[state=checked]:bg-indigo-600 disabled:opacity-40"
            />
        </div>
    );
}

function PasswordInput({ label, value, onChange, show, onToggleShow }: {
    label: string; value: string; onChange: (v: string) => void; show: boolean; onToggleShow: () => void;
}) {
    return (
        <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full h-11 px-4 pr-11 rounded-xl border-2 border-slate-100 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:border-indigo-400 transition-colors"
                    autoComplete="new-password"
                />
                <button
                    type="button"
                    onClick={onToggleShow}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    tabIndex={-1}
                >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
        </div>
    );
}

function Divider() {
    return <div className="h-px bg-slate-100 my-6" />;
}
