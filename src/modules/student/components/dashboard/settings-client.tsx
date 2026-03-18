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
                        <div className="space-y-8 md:space-y-10">
                            <div className="p-8 md:p-10 bg-slate-50/50 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white text-xl md:text-2xl font-black mb-6 md:mb-8 shadow-2xl">
                                    {userProfile?.full_name?.[0].toUpperCase() || 'S'}
                                </div>
                                <h4 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter mb-3 md:mb-4">{userProfile?.full_name}</h4>
                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 md:mb-10">Level {stats.level} Dedicated Student</p>
                                
                                <Link href="/student/profile">
                                    <Button className="h-12 md:h-14 px-8 md:px-10 bg-white border-2 border-slate-200 text-slate-900 font-black uppercase tracking-widest text-[10px] md:text-[11px] rounded-xl md:rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-3">
                                        View Full Profile <ArrowRight size={16} />
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
                        <div className="space-y-8 md:space-y-10">
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
                    <div className="space-y-10 md:space-y-12">
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
                            <div className="p-8 md:p-10 bg-rose-50/50 rounded-[2rem] md:rounded-[2.5rem] border border-rose-100">
                                <h4 className="text-lg font-black text-rose-950 uppercase tracking-tighter mb-2 md:mb-3">Delete Account</h4>
                                <p className="text-[10px] text-rose-600/80 mb-8 md:mb-10 font-bold uppercase tracking-widest leading-relaxed">Warning: This action is irreversible. All your progress and achievements will be permanently lost.</p>
                                <Button 
                                    variant="destructive" 
                                    className="rounded-xl md:rounded-2xl font-black uppercase text-[10px] tracking-widest h-14 md:h-16 px-10 md:px-12 shadow-xl shadow-rose-200"
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
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
                        <div className="py-16 md:py-20 px-8 md:px-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem] md:rounded-[3rem] bg-slate-50/50">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-white border border-slate-100 rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 text-slate-300 shadow-xl group-hover:scale-110 transition-transform">
                                <CreditCard size={28} className="md:w-9 md:h-9" />
                            </div>
                            <h4 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2 md:mb-3">Institutional Billing</h4>
                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] max-w-[280px] md:max-w-sm mx-auto leading-relaxed">Your access is currently managed and funded by your school administration.</p>
                        </div>
                    </SettingsSection>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/10 pb-20 animate-in fade-in duration-700">
            {/* Command Header */}
            <div className="relative bg-white border-b border-slate-100 overflow-hidden py-16 md:py-20 lg:py-24 px-6 lg:px-12">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50/50 rounded-full blur-[150px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
                
                <div className="max-w-[1440px] mx-auto relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-10 lg:gap-16">
                    <div>
                         <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-500 mb-8 shadow-sm"
                        >
                            <Settings size={16} fill="currentColor" />
                            <span className="text-[9px] font-black uppercase tracking-[0.4em]">App Settings</span>
                          </motion.div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-[0.85] mb-6 md:mb-10">
                            Account <br />
                            <span className="text-indigo-600">Settings</span>
                        </h1>
                        
                        <p className="max-w-lg text-slate-500 font-bold text-xs md:text-sm uppercase tracking-[0.15em] md:tracking-[0.2em] leading-relaxed">
                            Customize your app experience and manage your privacy settings.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 md:gap-5">
                         <div className="relative group hidden xl:block">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search settings..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-72 h-14 md:h-16 bg-slate-50/50 border-2 border-slate-100 rounded-xl md:rounded-2xl pl-14 pr-6 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all shadow-xl"
                            />
                        </div>
                        
                        <button 
                            onClick={() => signOut()}
                            className="w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-rose-50 border-2 border-rose-100 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-xl group active:scale-95"
                        >
                            <LogOut size={20} className="md:hidden group-hover:translate-x-1 transition-transform" />
                            <LogOut size={24} className="hidden md:block group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12 md:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                    {/* Navigation Matrix */}
                    <div className="lg:col-span-3 space-y-3.5">
                        <NavButton active={activeTab === 'general'} icon={User} label="Profile Info" onClick={() => setActiveTab('general')} />
                        <NavButton active={activeTab === 'notifications'} icon={Bell} label="Notifications" onClick={() => setActiveTab('notifications')} />
                        <NavButton active={activeTab === 'security'} icon={Shield} label="Privacy & Security" onClick={() => setActiveTab('security')} />
                        <NavButton active={activeTab === 'appearance'} icon={Eye} label="Appearance" onClick={() => setActiveTab('appearance')} />
                        <NavButton active={activeTab === 'billing'} icon={CreditCard} label="Billing" onClick={() => setActiveTab('billing')} />
                    </div>

                    {/* Operational Core */}
                    <div className="lg:col-span-9 space-y-10 min-h-[500px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                {renderTabContent()}
                            </motion.div>
                        </AnimatePresence>

                        {/* Tactical Action Bar */}
                        {activeTab !== 'billing' && activeTab !== 'general' && (
                            <div className="flex items-center justify-end gap-8 pt-12 border-t border-slate-100">
                                <AnimatePresence>
                                    {saved && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-3 text-emerald-600 font-black uppercase tracking-[0.4em] text-[9px]"
                                        >
                                            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
                                                <CheckCircle2 size={16} />
                                            </div>
                                            Settings Saved
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <Button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="h-14 md:h-16 px-8 md:px-12 bg-slate-950 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-[11px] hover:bg-indigo-600 transition-all shadow-2xl active:scale-95 flex items-center gap-4"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={18} /> : (
                                        <>Save Settings <ArrowRight size={16} /></>
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
            className={`w-full flex items-center justify-between p-4 md:p-6 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black transition-all group border-2 ${active ? 'bg-indigo-600 text-white border-indigo-500 shadow-2xl shadow-indigo-200 translate-x-1 md:translate-x-3' : 'bg-white text-slate-400 border-slate-50 hover:border-slate-200 hover:text-slate-900 shadow-sm'}`}
        >
            <div className="flex items-center gap-3 md:gap-4">
                <Icon size={16} strokeWidth={active ? 2.5 : 2} className={`md:hidden ${active ? 'text-white' : 'text-slate-300 group-hover:text-indigo-600'}`} />
                <Icon size={20} strokeWidth={active ? 2.5 : 2} className={`hidden md:block ${active ? 'text-white' : 'text-slate-300 group-hover:text-indigo-600'}`} />
                <span className="uppercase tracking-widest">{label}</span>
            </div>
            {active && <ChevronRight size={14} />}
        </button>
    );
}

function SettingsSection({ title, description, children }: any) {
    return (
        <section className="bg-white rounded-[1.75rem] md:rounded-[2.5rem] p-8 md:p-10 lg:p-14 border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="mb-10 md:mb-14 relative z-10 border-l-4 md:border-l-6 border-indigo-600 pl-5 md:pl-8">
                <h3 className="text-xl md:text-3xl font-black text-slate-950 uppercase tracking-tighter mb-2 md:mb-3 leading-none">{title}</h3>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] max-w-2xl leading-relaxed">{description}</p>
            </div>
            <div className="relative z-10">
                {children}
            </div>
        </section>
    );
}

function ToggleItem({ title, description, checked, onChange }: any) {
    return (
        <div className="flex items-center justify-between gap-6 md:gap-10 group/item">
            <div className="space-y-1.5 md:space-y-2">
                <h4 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter leading-none group-hover/item:text-indigo-600 transition-colors">{title}</h4>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{description}</p>
            </div>
            <Switch 
                checked={checked} 
                onCheckedChange={onChange} 
                className="scale-110 md:scale-125 data-[state=checked]:bg-indigo-600"
            />
        </div>
    );
}

function ThemeCard({ active, onClick, icon: Icon, label, description, premium }: any) {
    return (
        <button 
            onClick={onClick}
            className={`flex flex-col text-left p-6 md:p-10 rounded-[1.75rem] md:rounded-[2.25rem] border-4 transition-all duration-500 relative group ${active ? 'border-indigo-600 bg-indigo-50/50 shadow-2xl shadow-indigo-100' : 'border-slate-50 bg-white hover:border-slate-200 shadow-sm'}`}
        >
            <div className={`w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-5 md:mb-6 transition-all ${active ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-300 group-hover:bg-slate-100'}`}>
                <Icon size={20} className="md:hidden" />
                <Icon size={28} className="hidden md:block" />
            </div>
            <h4 className="text-lg md:text-xl font-black uppercase tracking-tight mb-2 md:mb-3 text-slate-950">{label}</h4>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed line-clamp-2">{description}</p>
            
            {premium && !active && (
                <div className="absolute top-6 right-6 md:top-8 md:right-8 px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-[0.3em] rounded-md border border-amber-200">
                    Elite
                </div>
            )}
            
            {active && (
                <div className="absolute -top-2.5 -right-2.5 w-7 h-7 md:w-9 md:h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white border-2 md:border-4 border-white shadow-xl">
                    <CheckCircle2 size={12} className="md:w-[16px] md:h-[16px]" fill="currentColor" />
                </div>
            )}
        </button>
    );
}

function TacticalStat({ icon: Icon, label, value, color, bg }: any) {
  return (
    <div className="bg-white border border-slate-100 rounded-[1.75rem] md:rounded-[2.25rem] p-6 md:p-8 transition-all hover:border-indigo-100 hover:shadow-xl hover:shadow-slate-100/50 group hover:-translate-y-1.5 duration-500">
      <div className={`w-11 h-11 md:w-12 md:h-12 rounded-xl ${bg} ${color} flex items-center justify-center mb-5 md:mb-6 group-hover:scale-110 transition-all duration-500 shadow-sm shrink-0`}>
        <Icon size={20} className="md:hidden" />
        <Icon size={24} className="hidden md:block" strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-2xl md:text-3xl font-black text-slate-900 leading-none mb-2 tracking-tighter shrink-0">{value}</p>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
      </div>
    </div>
  );
}
