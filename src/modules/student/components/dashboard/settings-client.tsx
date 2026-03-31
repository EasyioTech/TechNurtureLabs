'use client';

import React, { useState } from 'react';
import {
    Bell, Shield, CheckCircle2, LogOut, ArrowRight,
    Loader2, User, Lock, Eye, EyeOff,
    Smartphone, Download, Share, Plus, CheckCircle
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
    changeStudentPin
} from '@/modules/student/actions/settings-actions';
import { deleteStudentAccountAction } from '@/modules/student/actions';
import { usePWAInstall } from '@/hooks/use-pwa-install';

type TabType = 'notifications' | 'security' | 'app';

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

    const pwa = usePWAInstall();

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Security PIN change state
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showCurrentPin, setShowCurrentPin] = useState(false);
    const [showNewPin, setShowNewPin] = useState(false);
    const [savingPin, setSavingPin] = useState(false);

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

    const handlePinChange = async () => {
        if (!currentPin || !newPin || !confirmPin) {
            toast.error('Please fill in all PIN fields.');
            return;
        }
        if (newPin !== confirmPin) {
            toast.error('New PINs do not match.');
            return;
        }
        if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
            toast.error('New PIN must be exactly 6 digits.');
            return;
        }
        setSavingPin(true);
        try {
            const result = await changeStudentPin(currentPin, newPin);
            if (result.success) {
                toast.success('Security PIN changed successfully.');
                setCurrentPin('');
                setNewPin('');
                setConfirmPin('');
            } else {
                toast.error(result.error || 'Failed to change PIN.');
            }
        } catch (err) {
            toast.error('An error occurred. Please try again.');
        } finally {
            setSavingPin(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/10 pb-20">

            {/* ── Header ── */}
            <div className="relative bg-white border-b border-slate-100 py-10 md:py-14 px-6 lg:px-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/40 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3" />

                <div className="max-w-[1200px] mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    {/* Identity */}
                    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-3">Account Settings</p>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-[0.9] mb-4">
                            {userProfile?.full_name || 'Student'}
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                            Level {stats?.level ?? 1} · {userProfile?.className || 'Student'}
                        </p>
                    </motion.div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <Link href="/student/profile" className="flex-1 sm:flex-none">
                            <Button variant="outline" className="w-full h-12 px-6 rounded-xl border-2 border-slate-100 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:border-indigo-200 hover:text-indigo-600 transition-all">
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

                    {/* Tab Nav: Optimized for Mobile Horizontal Scroll */}
                    <nav className="lg:col-span-3 -mx-6 px-6 sm:mx-0 sm:px-0 flex flex-row lg:flex-col gap-3 overflow-x-auto pb-4 lg:pb-0 no-scrollbar items-start" aria-label="Settings navigation">
                        <TabButton
                            active={activeTab === 'notifications'}
                            icon={Bell}
                            label="Notifications"
                            onClick={() => setActiveTab('notifications')}
                        />
                        <TabButton
                            active={activeTab === 'security'}
                            icon={Shield}
                            label="Security"
                            onClick={() => setActiveTab('security')}
                        />
                        <TabButton
                            active={activeTab === 'app'}
                            icon={Smartphone}
                            label="App"
                            onClick={() => setActiveTab('app')}
                            badge={!pwa.isInstalled ? 'New' : undefined}
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
                                {activeTab === 'app' ? (
                                    <AppInstallPanel pwa={pwa} />
                                ) : activeTab === 'notifications' ? (
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
                                            title="Change Security PIN"
                                            description="Update your 6-digit security PIN."
                                        >
                                            <div className="space-y-4">
                                                <PasswordInput
                                                    label="Current PIN"
                                                    value={currentPin}
                                                    onChange={setCurrentPin}
                                                    show={showCurrentPin}
                                                    onToggleShow={() => setShowCurrentPin(v => !v)}
                                                />
                                                <PasswordInput
                                                    label="New 6-Digit PIN"
                                                    value={newPin}
                                                    onChange={setNewPin}
                                                    show={showNewPin}
                                                    onToggleShow={() => setShowNewPin(v => !v)}
                                                />
                                                <PasswordInput
                                                    label="Confirm New PIN"
                                                    value={confirmPin}
                                                    onChange={setConfirmPin}
                                                    show={showNewPin}
                                                    onToggleShow={() => setShowNewPin(v => !v)}
                                                />
                                                <Button
                                                    onClick={handlePinChange}
                                                    disabled={savingPin}
                                                    className="mt-2 h-11 px-6 bg-slate-950 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-600 transition-all flex items-center gap-2"
                                                >
                                                    {savingPin
                                                        ? <Loader2 size={15} className="animate-spin" />
                                                        : <><Lock size={14} /><span>Update PIN</span></>
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

                        {/* Save bar — only for tabs that have saveable toggles (not the app install tab) */}
                        {activeTab !== 'app' && <div className="flex items-center justify-end gap-6 pt-8 mt-8 border-t border-slate-100">
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
                        </div>}
                    </div>
                </div>
            </main>
        </div>
    );
}

/* ── Sub-components ── */

function TabButton({ active, icon: Icon, label, onClick, badge }: {
    active: boolean; icon: React.ElementType; label: string; onClick: () => void; badge?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2 shrink-0 min-w-max",
                active
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-200 lg:translate-x-2'
                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200 hover:text-slate-800 shadow-sm'
            )}
        >
            <Icon size={17} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
            <span className="whitespace-nowrap">{label}</span>
            {badge && (
                <span className="ml-2 text-[8px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                    {badge}
                </span>
            )}
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
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={value}
                    onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
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

/* ── PWA Install Panel ── */

function AppInstallPanel({ pwa }: { pwa: ReturnType<typeof usePWAInstall> }) {
    const [installing, setInstalling] = useState(false);
    const [result, setResult] = useState<'accepted' | 'dismissed' | null>(null);

    const handleInstall = async () => {
        setInstalling(true);
        const outcome = await pwa.prompt();
        setInstalling(false);
        if (outcome === 'accepted') {
            setResult('accepted');
            toast.success('App installed! Open it from your home screen.');
        } else if (outcome === 'dismissed') {
            setResult('dismissed');
        }
    };

    // Already running as installed PWA
    if (pwa.isInstalled) {
        return (
            <SettingsPanel
                title="Install App"
                description="Open the app directly from your home screen."
            >
                <div className="flex items-center gap-4 py-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle size={22} className="text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-base font-black text-slate-900 uppercase tracking-tight leading-none mb-1">
                            App Installed
                        </p>
                        <p className="text-[11px] font-medium text-slate-400">
                            You are already using the installed app. Tap its icon on your home screen anytime to open your dashboard directly.
                        </p>
                    </div>
                </div>
            </SettingsPanel>
        );
    }

    // Android / Desktop — browser can prompt natively
    if (pwa.platform === 'android' || pwa.platform === 'desktop') {
        return (
            <SettingsPanel
                title="Install App"
                description="Add this portal to your home screen for instant access."
            >
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                            <Download size={22} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-base font-black text-slate-900 uppercase tracking-tight leading-none mb-2">
                                One-tap install
                            </p>
                            <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                                Install the app on your {pwa.platform === 'android' ? 'phone' : 'computer'} for instant access. No app store required — it opens straight to your dashboard, works like a native app, and keeps you logged in.
                            </p>
                        </div>
                    </div>

                    {result === 'accepted' ? (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                            <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                            <p className="text-xs font-semibold text-emerald-700">Installed! Find the app on your home screen.</p>
                        </div>
                    ) : result === 'dismissed' ? (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-xs font-medium text-slate-500">
                                You dismissed the prompt. You can install later using your browser&apos;s menu (look for <strong>Add to Home Screen</strong> or the install icon in the address bar).
                            </p>
                        </div>
                    ) : pwa.canPrompt ? (
                        <Button
                            onClick={handleInstall}
                            disabled={installing}
                            className="h-12 px-8 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-[0.15em] text-[10px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center gap-3"
                        >
                            {installing
                                ? <><Loader2 size={15} className="animate-spin" /> Installing…</>
                                : <><Download size={15} /> Install App</>
                            }
                        </Button>
                    ) : (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                            <p className="text-xs font-medium text-amber-700 leading-relaxed">
                                Your browser hasn&apos;t offered an install prompt yet — this usually means the app is already installed, or your browser needs a moment. Try refreshing, or look for the <strong>install icon</strong> in your browser&apos;s address bar.
                            </p>
                        </div>
                    )}
                </div>
            </SettingsPanel>
        );
    }

    // iOS Safari — no beforeinstallprompt, must guide manually
    if (pwa.platform === 'ios') {
        return (
            <SettingsPanel
                title="Install App"
                description="Add this portal to your iPhone home screen."
            >
                <div className="space-y-5">
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                        On iPhone and iPad, follow these three steps in Safari to install the app. Once installed, tap its icon to open your dashboard directly — no login page, no browser.
                    </p>

                    <div className="space-y-3">
                        <IOSStep
                            number={1}
                            icon={Share}
                            title='Tap the Share button'
                            description='The box-with-arrow icon at the bottom of Safari (or top on iPad).'
                        />
                        <IOSStep
                            number={2}
                            icon={Plus}
                            title='Tap "Add to Home Screen"'
                            description='Scroll down in the share sheet until you see this option.'
                        />
                        <IOSStep
                            number={3}
                            icon={CheckCircle}
                            title='Tap "Add" to confirm'
                            description='The app icon will appear on your home screen immediately.'
                        />
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                        <Smartphone size={16} className="text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-[10px] font-medium text-blue-700 leading-relaxed">
                            <strong>Must use Safari.</strong> Chrome and other browsers on iPhone do not support Add to Home Screen for web apps.
                        </p>
                    </div>
                </div>
            </SettingsPanel>
        );
    }

    // Fallback for unsupported browsers
    return (
        <SettingsPanel
            title="Install App"
            description="Add this portal to your home screen."
        >
            <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                Your current browser doesn&apos;t support app installation. Try opening this page in <strong>Chrome</strong> (Android / Desktop) or <strong>Safari</strong> (iPhone/iPad) for the best experience.
            </p>
        </SettingsPanel>
    );
}

function IOSStep({ number, icon: Icon, title, description }: {
    number: number;
    icon: React.ElementType;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-100">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                {number}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <Icon size={14} className="text-indigo-600 shrink-0" />
                    <p className="text-sm font-bold text-slate-900 leading-none">{title}</p>
                </div>
                <p className="text-[10px] font-medium text-slate-400 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
