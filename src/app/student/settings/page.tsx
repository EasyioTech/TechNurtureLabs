'use client';

import React, { useState, useEffect } from 'react';
import { 
    Settings, 
    Bell, 
    Shield, 
    Eye, 
    Smartphone, 
    Globe, 
    Moon, 
    Sun,
    ChevronRight,
    CheckCircle2,
    Lock,
    User,
    CreditCard,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function StudentSettingsPage() {
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [emailUpdates, setEmailUpdates] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }, 1200);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-32">
            {/* Header Hero */}
            <div className="relative bg-white border-b border-slate-100 overflow-hidden py-12 md:py-20 px-6 lg:px-12">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] pointer-events-none" />
                
                <div className="max-w-[1400px] mx-auto relative z-10">
                    <div className="mb-6">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Preferences</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-6">
                        Account <span className="text-indigo-600">Settings</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm md:text-lg max-w-lg">
                        Customize your learning experience and manage your security preferences.
                    </p>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-10 md:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
                    
                    {/* Sidebar Nav */}
                    <div className="lg:col-span-3 space-y-2">
                        <SettingsSidebarItem icon={User} label="General" active />
                        <SettingsSidebarItem icon={Bell} label="Notifications" />
                        <SettingsSidebarItem icon={Shield} label="Security" />
                        <SettingsSidebarItem icon={Eye} label="Appearance" />
                        <SettingsSidebarItem icon={CreditCard} label="Billing" />
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-9 space-y-8">
                        
                        {/* Notification Settings */}
                        <SettingsSection 
                            title="Notification Preferences" 
                            description="Decide how and when you want to be notified about your learning progress."
                        >
                            <div className="space-y-6">
                                <ToggleItem 
                                    title="Mobile Push Notifications" 
                                    description="Receive real-time alerts for streak goals and challenges."
                                    checked={notifications} 
                                    onChange={setNotifications} 
                                />
                                <div className="h-px bg-slate-100" />
                                <ToggleItem 
                                    title="Email Progress Reports" 
                                    description="Weekly summaries of your academic achievements and XP gains."
                                    checked={emailUpdates} 
                                    onChange={setEmailUpdates} 
                                />
                                <div className="h-px bg-slate-100" />
                                <ToggleItem 
                                    title="New Content Alerts" 
                                    description="Get notified when new lessons or courses are added to your library."
                                    checked={true} 
                                />
                            </div>
                        </SettingsSection>

                        {/* Appearance Settings */}
                        <SettingsSection 
                            title="Display & Theme" 
                            description="Adjust the interface visual styles to match your focus environment."
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ThemeCard 
                                    active={!darkMode} 
                                    onClick={() => setDarkMode(false)} 
                                    icon={Sun} 
                                    label="Light Mode" 
                                    description="Best for bright environments and daylight reading."
                                />
                                <ThemeCard 
                                    active={darkMode} 
                                    onClick={() => setDarkMode(true)} 
                                    icon={Moon} 
                                    label="Dark Mode" 
                                    description="Reduce eye strain and focus better during late-night sessions."
                                    premium
                                />
                            </div>
                        </SettingsSection>

                        {/* Privacy & Visibility */}
                        <SettingsSection 
                            title="Learning Privacy" 
                            description="Manage your visibility on leaderboard and peer-to-peer stats."
                        >
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-indigo-200 transition-all">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-800 shadow-sm border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <Globe size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Public Profile</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Visible to other students in the community</p>
                                        </div>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            </div>
                        </SettingsSection>

                        {/* Action Bar */}
                        <div className="flex items-center justify-end gap-4 pt-8">
                             <AnimatePresence>
                                {saved && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-2 text-emerald-600 font-black uppercase tracking-widest text-[10px]"
                                    >
                                        <CheckCircle2 size={14} /> Changes Synchronized
                                    </motion.div>
                                )}
                             </AnimatePresence>
                             <Button 
                                onClick={handleSave}
                                disabled={saving}
                                className="h-16 px-10 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
                             >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                             </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function SettingsSidebarItem({ icon: Icon, label, active }: any) {
    return (
        <button className={`w-full flex items-center justify-between p-4 rounded-2xl text-sm font-black transition-all group ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}>
            <div className="flex items-center gap-3">
                <Icon size={18} />
                <span className="uppercase tracking-tight">{label}</span>
            </div>
            {active && <ChevronRight size={14} />}
        </button>
    );
}

function SettingsSection({ title, description, children }: any) {
    return (
        <section className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 border border-slate-100 shadow-sm">
            <div className="mb-10">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-3">{title}</h3>
                <p className="text-sm font-medium text-slate-400 max-w-2xl">{description}</p>
            </div>
            {children}
        </section>
    );
}

function ToggleItem({ title, description, checked, onChange }: any) {
    return (
        <div className="flex items-center justify-between gap-6 py-2">
            <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{title}</h4>
                <p className="text-xs font-medium text-slate-400">{description}</p>
            </div>
            <Switch checked={checked} onCheckedChange={onChange} />
        </div>
    );
}

function ThemeCard({ active, onClick, icon: Icon, label, description, premium }: any) {
    return (
        <button 
            onClick={onClick}
            className={`flex flex-col text-left p-8 rounded-[2rem] border-2 transition-all duration-300 relative group ${active ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}
        >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                <Icon size={24} />
            </div>
            <h4 className={`text-sm font-black uppercase tracking-tight mb-2 ${active ? 'text-indigo-900' : 'text-slate-900'}`}>{label}</h4>
            <p className="text-[11px] font-medium text-slate-500 leading-relaxed">{description}</p>
            
            {premium && (
                <div className="absolute top-6 right-6 px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-widest rounded-md border border-amber-200">
                    Premium
                </div>
            )}
            
            {active && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white border-4 border-white">
                    <CheckCircle2 size={12} fill="currentColor" />
                </div>
            )}
        </button>
    );
}
