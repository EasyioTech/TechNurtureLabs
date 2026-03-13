'use client';

import React, { useState, useEffect } from 'react';
import { 
    Settings, 
    Bell, 
    Shield, 
    Eye, 
    Globe, 
    Moon, 
    Sun,
    ChevronRight,
    CheckCircle2,
    Lock,
    User,
    CreditCard,
    Loader2,
    Search,
    LogOut
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

export default function StudentSettingsPage() {
    const { signOut } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [userProfile, setUserProfile] = useState<any>(null);
    const [stats, setStats] = useState({ xp: 0, level: 1 });
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // ... constants for toggles ...
    const [notifications, setNotifications] = useState(true);
    const [emailUpdates, setEmailUpdates] = useState(true);
    const [newContentAlerts, setNewContentAlerts] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [publicProfile, setPublicProfile] = useState(true);
    
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const { getStudentDashboardData } = await import('@/modules/student/actions');
            try {
                const data = await getStudentDashboardData();
                setUserProfile(data.profile);
                setStats(data.stats);
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            }
        };
        fetchData();
    }, []);

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
                        title="General Account" 
                        description="Manage your basic account identity and contact information."
                    >
                        <div className="space-y-6">
                            <p className="text-slate-500 font-medium">To edit your profile name, bio, or avatar, please visit your profile page.</p>
                            <Button variant="outline" className="h-12 px-6 rounded-xl font-bold" asChild>
                                <a href="/student/profile">Go to Profile</a>
                            </Button>
                        </div>
                    </SettingsSection>
                );
            case 'notifications':
                return (
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
                                checked={newContentAlerts} 
                                onChange={setNewContentAlerts}
                            />
                        </div>
                    </SettingsSection>
                );
            case 'security':
                return (
                    <div className="space-y-8">
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
                                    <Switch checked={publicProfile} onCheckedChange={setPublicProfile} />
                                </div>
                            </div>
                        </SettingsSection>

                        <SettingsSection 
                            title="Danger Zone" 
                            description="Permanent actions related to your account."
                        >
                            <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100">
                                <h4 className="text-sm font-black text-rose-900 uppercase mb-2">Delete Account</h4>
                                <p className="text-xs text-rose-600 mb-6 font-medium">Once you delete your account, there is no going back. Please be certain.</p>
                                <Button 
                                    variant="destructive" 
                                    className="rounded-xl font-black uppercase text-[10px] tracking-widest h-11"
                                    onClick={async () => {
                                        if (confirm('Are you absolutely sure? This cannot be undone.')) {
                                            await deleteStudentAccountAction();
                                        }
                                    }}
                                >
                                    request deletion
                                </Button>
                            </div>
                        </SettingsSection>
                    </div>
                );
            case 'appearance':
                return (
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
                            < ThemeCard 
                                active={darkMode} 
                                onClick={() => setDarkMode(true)} 
                                icon={Moon} 
                                label="Dark Mode" 
                                description="Reduce eye strain and focus better during late-night sessions."
                                premium
                            />
                        </div>
                    </SettingsSection>
                );
            case 'billing':
                return (
                    <SettingsSection 
                        title="Billing & Subscription" 
                        description="View your current plan and billing history."
                    >
                        <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                                <CreditCard size={32} />
                            </div>
                            <h4 className="text-lg font-black text-slate-900 uppercase">No Subscription Found</h4>
                            <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto mb-8 font-medium">Your account is currently managed by your school administrator.</p>
                        </div>
                    </SettingsSection>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-32">
            {/* Header Hero */}
            <div className="relative bg-white border-b border-slate-100 overflow-hidden py-12 md:py-20 px-6 lg:px-12">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] pointer-events-none" />
                
                <div className="max-w-[1400px] mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
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

                        <div className="flex items-center gap-4">
                            <div className="relative group hidden xl:block">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search resources..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-48 xl:w-64 h-12 bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all shadow-sm"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Notification Bell */}
                                <button className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm relative group">
                                    <Bell size={18} />
                                    <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                                </button>

                                <div className="relative">
                                    <button
                                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                        className="flex items-center gap-3 p-1 pr-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 transition-all shadow-sm"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-indigo-200">
                                            {userProfile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
                                        </div>
                                        <div className="text-left hidden min-[1400px]:block">
                                            <p className="text-[10px] font-black text-slate-900 uppercase leading-none mb-1">{userProfile?.full_name?.split(' ')[0]}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lv {stats.level}</p>
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {profileMenuOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 p-2"
                                                >
                                                    <Link href="/student/profile" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:text-indigo-600 rounded-xl hover:bg-slate-50 transition-colors text-[10px] font-black uppercase tracking-widest">
                                                        <User size={16} /> My Profile
                                                    </Link>
                                                    <button onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 w-full px-4 py-3 text-indigo-600 bg-indigo-50 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest">
                                                        <Settings size={16} /> Settings
                                                    </button>
                                                    <div className="h-px bg-slate-50 my-1" />
                                                    <button
                                                        onClick={() => {
                                                            setProfileMenuOpen(false);
                                                            signOut();
                                                        }}
                                                        className="flex items-center gap-3 w-full px-4 py-3 text-rose-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        <LogOut size={16} /> Logout
                                                    </button>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="hidden sm:block w-px h-8 bg-slate-100 mx-1" />

                                <button
                                    onClick={() => signOut()}
                                    className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-all shadow-sm active:scale-95 group"
                                    title="Logout"
                                >
                                    <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-10 md:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
                    
                    {/* Sidebar Nav */}
                    <div className="lg:col-span-3 space-y-2">
                        <SettingsSidebarItem 
                            icon={User} 
                            label="General" 
                            active={activeTab === 'general'} 
                            onClick={() => setActiveTab('general')}
                        />
                        <SettingsSidebarItem 
                            icon={Bell} 
                            label="Notifications" 
                            active={activeTab === 'notifications'} 
                            onClick={() => setActiveTab('notifications')}
                        />
                        <SettingsSidebarItem 
                            icon={Shield} 
                            label="Security" 
                            active={activeTab === 'security'} 
                            onClick={() => setActiveTab('security')}
                        />
                        <SettingsSidebarItem 
                            icon={Eye} 
                            label="Appearance" 
                            active={activeTab === 'appearance'} 
                            onClick={() => setActiveTab('appearance')}
                        />
                        <SettingsSidebarItem 
                            icon={CreditCard} 
                            label="Billing" 
                            active={activeTab === 'billing'} 
                            onClick={() => setActiveTab('billing')}
                        />
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-9 space-y-8 min-h-[500px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {renderTabContent()}
                            </motion.div>
                        </AnimatePresence>

                        {/* Action Bar */}
                        {activeTab !== 'billing' && activeTab !== 'general' && (
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
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function SettingsSidebarItem({ icon: Icon, label, active, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center justify-between p-4 rounded-2xl text-sm font-black transition-all group ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'text-slate-500 hover:bg-white hover:text-slate-900 group'}`}
        >
            <div className="flex items-center gap-3">
                <Icon size={18} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'} />
                <span className="uppercase tracking-tight">{label}</span>
            </div>
            {active && <ChevronRight size={14} />}
        </button>
    );
}

function SettingsSection({ title, description, children }: any) {
    return (
        <section className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="mb-10 relative z-10">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-3">{title}</h3>
                <p className="text-sm font-medium text-slate-400 max-w-2xl">{description}</p>
            </div>
            <div className="relative z-10">
                {children}
            </div>
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
