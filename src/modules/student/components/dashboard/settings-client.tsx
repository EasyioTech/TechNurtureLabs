'use client';

import React, { useState } from 'react';
import { 
    Settings, Bell, Shield, Eye, Globe, Moon, Sun,
    ChevronRight, CheckCircle2, Lock, User, CreditCard,
    Loader2, Search, LogOut, ArrowRight, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
    updateNotificationPreferences, 
    updateAppearanceSettings, 
    updatePrivacySettings 
} from '@/modules/student/actions/settings-actions';
import { deleteStudentAccountAction } from '@/modules/student/actions';

type TabType = 'general' | 'notifications' | 'security' | 'appearance' | 'billing';

interface SettingsClientProps {
  initialData: {
    profile: any;
    stats: any;
  }
}

export function SettingsClient({ initialData }: SettingsClientProps) {
    const { signOut } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const { profile: userProfile, stats } = initialData;
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [notifications, setNotifications] = useState(true);
    const [emailUpdates, setEmailUpdates] = useState(true);
    const [newContentAlerts, setNewContentAlerts] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [publicProfile, setPublicProfile] = useState(true);
    
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (activeTab === 'notifications') {
                await updateNotificationPreferences({
                    mobile_push: notifications,
                    email_reports: emailUpdates,
                    new_content: newContentAlerts
                });
            } else if (activeTab === 'appearance') {
                await updateAppearanceSettings({ dark_mode: darkMode });
            } else if (activeTab === 'security') {
                await updatePrivacySettings({ public_profile: publicProfile });
            }
            
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <SettingsSection 
                        title="Account Identity" 
                        description="Manage your student profile and sign-in details."
                    >
                        <div className="space-y-12">
                            <div className="p-10 bg-slate-50/50 rounded-[3rem] border border-slate-100 flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-white text-2xl font-black mb-8 shadow-2xl">
                                    {userProfile?.full_name?.[0].toUpperCase() || 'S'}
                                </div>
                                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">{userProfile?.full_name}</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Level {stats.level} Dedicated Student</p>
                                
                                <Link href="/student/profile">
                                    <Button className="h-16 px-10 bg-white border-2 border-slate-200 text-slate-900 font-black uppercase tracking-widest text-[11px] rounded-[2rem] hover:bg-slate-50 transition-all flex items-center gap-4">
                                        View Full Profile <ArrowRight size={18} />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </SettingsSection>
                );
            case 'notifications':
                return (
                    <SettingsSection 
                        title="Notification Preferences" 
                        description="Configure your activity updates and course alerts."
                    >
                        <div className="space-y-10">
                            <ToggleItem 
                                title="Push Notifications" 
                                description="Get real-time updates on your goals and streaks."
                                checked={notifications} 
                                onChange={setNotifications} 
                            />
                            <div className="h-px bg-slate-50" />
                            <ToggleItem 
                                title="Learning Progress Reports" 
                                description="Receive regular analytical summaries of your progress."
                                checked={emailUpdates} 
                                onChange={setEmailUpdates} 
                            />
                            <div className="h-px bg-slate-50" />
                            <ToggleItem 
                                title="New Content Alerts" 
                                description="Get notified when new lessons or courses are added."
                                checked={newContentAlerts} 
                                onChange={setNewContentAlerts}
                            />
                        </div>
                    </SettingsSection>
                );
            case 'security':
                return (
                    <div className="space-y-12">
                        <SettingsSection 
                            title="Privacy Settings" 
                            description="Control your profile privacy and visibility."
                        >
                            <ToggleItem 
                                title="Public Profile" 
                                description="Show your profile on the leaderboard and in the student directory."
                                checked={publicProfile} 
                                onChange={setPublicProfile}
                            />
                        </SettingsSection>

                        <SettingsSection 
                            title="Account Deletion" 
                            description="Permanently delete your account and all associated data."
                        >
                            <div className="p-10 bg-rose-50/50 rounded-[3rem] border border-rose-100">
                                <h4 className="text-lg font-black text-rose-950 uppercase tracking-tighter mb-3">Delete Account</h4>
                                <p className="text-xs text-rose-600/80 mb-10 font-bold uppercase tracking-widest leading-relaxed">Warning: This action is irreversible. All your progress and achievements will be permanently lost.</p>
                                <Button 
                                    variant="destructive" 
                                    className="rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] h-16 px-12 shadow-xl shadow-rose-200"
                                    onClick={async () => {
                                        if (confirm('Are you sure you want to permanently delete your account? All progress will be lost.')) {
                                            await deleteStudentAccountAction();
                                        }
                                    }}
                                >
                                    Confirm Account Deletion
                                </Button>
                            </div>
                        </SettingsSection>
                    </div>
                );
            case 'appearance':
                return (
                    <SettingsSection 
                        title="App Appearance" 
                        description="Choose your preferred theme for the best reading experience."
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <ThemeCard 
                                active={!darkMode} 
                                onClick={() => setDarkMode(false)} 
                                icon={Sun} 
                                label="Light Mode" 
                                description="Clean and bright appearance for daytime study."
                            />
                            <ThemeCard 
                                active={darkMode} 
                                onClick={() => setDarkMode(true)} 
                                icon={Moon} 
                                label="Dark Mode" 
                                description="Reduced brightness for late-night learning sessions."
                                premium
                            />
                        </div>
                    </SettingsSection>
                );
            case 'billing':
                return (
                    <SettingsSection 
                        title="Subscription & Billing" 
                        description="Manage your current plan and billing status."
                    >
                        <div className="py-24 px-12 text-center border-2 border-dashed border-slate-100 rounded-[4rem] bg-slate-50/50">
                            <div className="w-24 h-24 bg-white border border-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-slate-300 shadow-xl group-hover:scale-110 transition-transform">
                                <CreditCard size={40} />
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">Institutional Billing</h4>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] max-w-sm mx-auto leading-relaxed">Your access is currently managed and funded by your school administration.</p>
                        </div>
                    </SettingsSection>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/10 pb-32 animate-in fade-in duration-700">
            {/* Command Header */}
            <div className="relative bg-white border-b border-slate-100 overflow-hidden py-24 lg:py-32 px-6 lg:px-12">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50/50 rounded-full blur-[150px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
                
                <div className="max-w-[1440px] mx-auto relative z-10 flex flex-col lg:flex-row items-end justify-between gap-16">
                    <div>
                         <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 mb-10 shadow-sm"
                        >
                            <Settings size={18} fill="currentColor" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">App Settings</span>
                        </motion.div>

                        <h1 className="text-6xl lg:text-8xl font-black text-slate-900 uppercase tracking-tighter leading-[0.85] mb-12">
                            Account <br />
                            <span className="text-indigo-600">Settings</span>
                        </h1>
                        
                        <p className="max-w-xl text-slate-500 font-bold text-sm lg:text-base uppercase tracking-[0.2em] leading-relaxed">
                            Customize your app experience and manage your privacy settings.
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                         <div className="relative group hidden xl:block">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search settings..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-80 h-20 bg-slate-50/50 border-2 border-slate-100 rounded-[2.25rem] pl-16 pr-8 text-[11px] font-black uppercase tracking-widest outline-none focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all shadow-xl"
                            />
                        </div>
                        
                        <button 
                            onClick={() => signOut()}
                            className="w-20 h-20 rounded-[2.25rem] bg-rose-50 border-2 border-rose-100 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-xl group active:scale-95"
                        >
                            <LogOut size={28} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1440px] mx-auto px-6 lg:px-12 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
                    {/* Navigation Matrix */}
                    <div className="lg:col-span-3 space-y-4">
                        <NavButton active={activeTab === 'general'} icon={User} label="Profile Info" onClick={() => setActiveTab('general')} />
                        <NavButton active={activeTab === 'notifications'} icon={Bell} label="Notifications" onClick={() => setActiveTab('notifications')} />
                        <NavButton active={activeTab === 'security'} icon={Shield} label="Privacy & Security" onClick={() => setActiveTab('security')} />
                        <NavButton active={activeTab === 'appearance'} icon={Eye} label="Appearance" onClick={() => setActiveTab('appearance')} />
                        <NavButton active={activeTab === 'billing'} icon={CreditCard} label="Billing" onClick={() => setActiveTab('billing')} />
                    </div>

                    {/* Operational Core */}
                    <div className="lg:col-span-9 space-y-12 min-h-[600px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4, ease: "circOut" }}
                            >
                                {renderTabContent()}
                            </motion.div>
                        </AnimatePresence>

                        {/* Tactical Action Bar */}
                        {activeTab !== 'billing' && activeTab !== 'general' && (
                            <div className="flex items-center justify-end gap-10 pt-16 border-t border-slate-100">
                                <AnimatePresence>
                                    {saved && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-4 text-emerald-600 font-black uppercase tracking-[0.4em] text-[10px]"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                                                <CheckCircle2 size={18} />
                                            </div>
                                            Settings Saved
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <Button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="h-24 px-16 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[12px] hover:bg-indigo-600 transition-all shadow-2xl active:scale-95 flex items-center gap-6"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={24} /> : (
                                        <>Save Settings <ArrowRight size={20} /></>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function NavButton({ active, icon: Icon, label, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center justify-between p-8 rounded-[2.5rem] text-sm font-black transition-all group border-2 ${active ? 'bg-indigo-600 text-white border-indigo-500 shadow-2xl shadow-indigo-200 translate-x-4' : 'bg-white text-slate-400 border-slate-50 hover:border-slate-200 hover:text-slate-900 shadow-sm'}`}
        >
            <div className="flex items-center gap-5">
                <Icon size={24} strokeWidth={active ? 2.5 : 2} className={active ? 'text-white' : 'text-slate-300 group-hover:text-indigo-600'} />
                <span className="uppercase tracking-widest text-[11px]">{label}</span>
            </div>
            {active && <ChevronRight size={18} />}
        </button>
    );
}

function SettingsSection({ title, description, children }: any) {
    return (
        <section className="bg-white rounded-[4rem] p-12 lg:p-20 border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="mb-20 relative z-10 border-l-8 border-indigo-600 pl-10">
                <h3 className="text-4xl font-black text-slate-950 uppercase tracking-tighter mb-4 leading-none">{title}</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] max-w-2xl leading-relaxed">{description}</p>
            </div>
            <div className="relative z-10">
                {children}
            </div>
        </section>
    );
}

function ToggleItem({ title, description, checked, onChange }: any) {
    return (
        <div className="flex items-center justify-between gap-12 group/item">
            <div className="space-y-3">
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none group-hover/item:text-indigo-600 transition-colors">{title}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{description}</p>
            </div>
            <Switch 
                checked={checked} 
                onCheckedChange={onChange} 
                className="scale-150 data-[state=checked]:bg-indigo-600"
            />
        </div>
    );
}

function ThemeCard({ active, onClick, icon: Icon, label, description, premium }: any) {
    return (
        <button 
            onClick={onClick}
            className={`flex flex-col text-left p-12 rounded-[3rem] border-4 transition-all duration-500 relative group ${active ? 'border-indigo-600 bg-indigo-50/50 shadow-2xl shadow-indigo-100' : 'border-slate-50 bg-white hover:border-slate-200 shadow-sm'}`}
        >
            <div className={`w-16 h-16 rounded-[1.75rem] flex items-center justify-center mb-8 transition-all ${active ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-300 group-hover:bg-slate-100'}`}>
                <Icon size={32} />
            </div>
            <h4 className={`text-xl font-black uppercase tracking-tight mb-4 ${active ? 'text-slate-900' : 'text-slate-900'}`}>{label}</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed line-clamp-2">{description}</p>
            
            {premium && !active && (
                <div className="absolute top-10 right-10 px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-[0.3em] rounded-lg border border-amber-200">
                    Elite
                </div>
            )}
            
            {active && (
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white border-4 border-white shadow-xl">
                    <CheckCircle2 size={18} fill="currentColor" />
                </div>
            )}
        </button>
    );
}
