import React, { useState, useEffect } from 'react';
import { useSchoolTheme, ts } from '../../theme-context';
import { SchoolStats } from '../../types';
import { Settings, CreditCard, Shield, HelpCircle, CheckCircle2, GraduationCap, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { promoteStudentsAction } from '../../actions';
import { ManageClassesModal } from '../settings/manage-classes-modal';
import { ChangePasswordModal } from '../settings/change-password-modal';
import { EditAdminProfileModal } from '../settings/edit-admin-profile-modal';
import { UpgradePlanModal } from '../settings/upgrade-plan-modal';
import { BillingHistoryModal } from '../settings/billing-history-modal';
import { useAuth } from '@/components/providers/auth-provider';

interface SettingsTabProps {
    stats: SchoolStats;
    schoolId: string;
    classesData: { id: string; name: string }[];
    globalClasses: { id: string; name: string; level: number }[];
    onRefresh: () => void;
    onOpenSchoolProfile?: () => void;
}

export function SchoolSettingsTab({ stats, schoolId, classesData, globalClasses, onRefresh, onOpenSchoolProfile }: SettingsTabProps) {
    const { isDark } = useSchoolTheme();
    const { profile, refreshProfile } = useAuth();

    // Modals state
    const [isClassesModalOpen, setIsClassesModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isAdminProfileModalOpen, setIsAdminProfileModalOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const sections = [
        {
            title: 'Plan & Renewal',
            icon: CreditCard,
            content: (
                <div className="space-y-6">
                    <div className={`p-6 rounded-3xl border ${ts.card(isDark)} bg-gradient-to-br transition-all duration-300 ${isDark ? 'from-indigo-500/5 to-transparent border-white/5' : 'from-indigo-50 to-white border-slate-200 shadow-sm'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
                            <div>
                                <h3 className={`text-xl font-black mb-2 tracking-tight ${ts.textPrimary(isDark)}`}>
                                    {stats.planName || 'Basic'} Plan
                                </h3>
                                <div className={`flex items-center gap-2 text-sm font-bold ${ts.textSecondary(isDark)}`}>
                                    {stats.subscriptionStatus === 'active'
                                        ? <>
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                            <span>Renews on {stats.planExpiry ? new Date(stats.planExpiry).toLocaleDateString() : 'N/A'}</span>
                                        </>
                                        : <span>Plan requires attention</span>
                                    }
                                </div>
                            </div>
                            <div className={`px-4 py-1.5 text-[10px] font-black tracking-wider uppercase rounded-full self-start ${stats.subscriptionStatus === 'active' ? ts.live(isDark) : 'bg-red-500/10 text-red-500'}`}>
                                {stats.subscriptionStatus?.toUpperCase() || 'INACTIVE'}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                onClick={() => setIsUpgradeModalOpen(true)}
                                className={`rounded-2xl h-11 px-6 font-black text-[13px] ${ts.btnPrimary(isDark)}`}
                            >
                                Upgrade Plan
                            </Button>
                            <Button
                                onClick={() => setIsBillingModalOpen(true)}
                                variant="ghost"
                                className={`rounded-2xl h-11 px-6 font-black text-[13px] transition-all border ${isDark ? 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10' : 'border-slate-200 bg-transparent text-slate-800 hover:bg-slate-50'}`}
                            >
                                Billing History
                            </Button>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'School Profile',
            icon: Settings,
            content: (
                <div className="space-y-4">
                    <div className={`p-6 rounded-[28px] border flex flex-col sm:flex-row items-center justify-between gap-6 ${ts.card(isDark)}`}>
                        <div className="text-center sm:text-left">
                            <h4 className={`text-[15px] font-black tracking-tight mb-1 ${ts.textPrimary(isDark)}`}>Institution Information</h4>
                            <p className={`text-[13px] font-medium leading-relaxed max-w-md ${ts.textSecondary(isDark)}`}>Update your school's name, logo, address, and contact details visible to students.</p>
                        </div>
                        <Button
                            onClick={onOpenSchoolProfile}
                            variant="outline"
                            className={`rounded-2xl h-11 px-6 font-black text-[13px] shrink-0 ${isDark ? 'border-white/10' : 'border-slate-200'}`}
                        >
                            Edit Profile
                        </Button>
                    </div>

                    <div className={`p-6 rounded-[28px] border flex flex-col sm:flex-row items-center justify-between gap-6 ${ts.card(isDark)}`}>
                        <div className="text-center sm:text-left">
                            <h4 className={`text-[15px] font-black tracking-tight mb-1 ${ts.textPrimary(isDark)}`}>Academic Classes</h4>
                            <p className={`text-[13px] font-medium leading-relaxed max-w-md ${ts.textSecondary(isDark)}`}>Manage the different class levels (e.g., Grade 1-12) offered by your institution.</p>
                        </div>
                        <Button
                            onClick={() => setIsClassesModalOpen(true)}
                            variant="outline"
                            className={`rounded-2xl h-11 px-6 font-black text-[13px] shrink-0 ${isDark ? 'border-white/10' : 'border-slate-200'}`}
                        >
                            Manage Classes
                        </Button>
                    </div>
                </div>
            )
        },
        {
            title: 'Account & Security',
            icon: Shield,
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-6 rounded-[28px] border flex flex-col justify-between items-start gap-4 ${ts.card(isDark)}`}>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <User size={16} className="text-indigo-500" />
                                <h4 className={`text-[15px] font-black tracking-tight ${ts.textPrimary(isDark)}`}>Administrative Role</h4>
                            </div>
                            <p className={`text-[13px] font-medium leading-relaxed ${ts.textSecondary(isDark)}`}>Update your name and profile settings as an authorized administrator.</p>
                        </div>
                        <Button
                            onClick={() => setIsAdminProfileModalOpen(true)}
                            variant="outline"
                            className={`rounded-2xl h-10 px-5 font-black text-[12px] ${isDark ? 'border-white/10' : 'border-slate-200'}`}
                        >
                            Update Profile
                        </Button>
                    </div>

                    <div className={`p-6 rounded-[28px] border flex flex-col justify-between items-start gap-4 ${ts.card(isDark)}`}>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Shield size={16} className="text-indigo-500" />
                                <h4 className={`text-[15px] font-black tracking-tight ${ts.textPrimary(isDark)}`}>Password & Security</h4>
                            </div>
                            <p className={`text-[13px] font-medium leading-relaxed ${ts.textSecondary(isDark)}`}>Keep your account secure by rotating your password regularly.</p>
                        </div>
                        <Button
                            onClick={() => setIsPasswordModalOpen(true)}
                            variant="outline"
                            className={`rounded-2xl h-10 px-5 font-black text-[12px] ${isDark ? 'border-white/10' : 'border-slate-200'}`}
                        >
                            Change Password
                        </Button>
                    </div>
                </div>
            )
        },
        {
            title: 'Academic Archive',
            icon: GraduationCap,
            content: (
                <div className={`p-8 rounded-[32px] border group transition-all duration-500 hover:border-rose-500/30 ${isDark ? 'bg-rose-500/5 border-white/5 shadow-2xl shadow-rose-500/5' : 'bg-rose-50/30 border-slate-200'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                                    <GraduationCap size={20} />
                                </div>
                                <h4 className={`text-lg font-black text-rose-500 tracking-tight`}>End of Academic Session</h4>
                            </div>
                            <p className={`text-[13px] font-medium leading-relaxed max-w-xl ${ts.textSecondary(isDark)}`}>
                                Finalizing a session will promote all eligible students to their next class level and archive current progress records. This action is critical and should only be performed once per session.
                            </p>
                        </div>
                        <Button
                            onClick={async () => {
                                if (confirm('Are you sure you want to end the current academic session and promote all students? This cannot be undone easily.')) {
                                    try {
                                        const res = await promoteStudentsAction(schoolId, `Session ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
                                        toast.success(res?.message || 'Students have been successfully promoted!');
                                        onRefresh();
                                    } catch (err: any) {
                                        toast.error(err.message || 'Failed to promote students.');
                                    }
                                }
                            }}
                            className={`rounded-2xl h-12 px-8 font-black text-[13px] bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 shrink-0`}>
                            Proceed to Promote
                        </Button>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-0 pb-20">
            <div className="mb-12">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                        <Settings size={24} />
                    </div>
                    <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>Institution Settings</h2>
                </div>
                <p className={`text-[13px] font-bold max-w-xl ${ts.textSecondary(isDark)}`}>
                    Manage your institution's digital footprint, security policies, and administrative lifecycle from one centralized hub.
                </p>
            </div>

            <div className="space-y-12">
                {sections.map((section) => (
                    <div key={section.title}>
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className={`text-[10px] font-black uppercase tracking-[0.25em] ${ts.textMuted(isDark)}`}>{section.title}</h3>
                            <div className={`flex-1 h-px ${ts.divider(isDark)}`} />
                        </div>
                        {section.content}
                    </div>
                ))}
            </div>

            <ManageClassesModal
                schoolId={schoolId}
                currentClasses={classesData}
                globalClasses={globalClasses}
                isOpen={isClassesModalOpen}
                onClose={() => setIsClassesModalOpen(false)}
                onUpdate={onRefresh}
            />

            <ChangePasswordModal
                schoolId={schoolId}
                adminId={profile?.id || ''}
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />

            <EditAdminProfileModal
                schoolId={schoolId}
                adminProfile={{
                    id: profile?.id || '',
                    first_name: profile?.first_name || '',
                    last_name: profile?.last_name || '',
                    email: profile?.email || '',
                    phone: profile?.phone || ''
                }}
                isOpen={isAdminProfileModalOpen}
                onClose={() => setIsAdminProfileModalOpen(false)}
                onUpdate={refreshProfile}
            />

            {/* Upgrade & Billing Modals */}
            <UpgradePlanModal
                schoolId={schoolId}
                currentPlanName={stats.planName}
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                onUpdate={onRefresh}
            />

            <BillingHistoryModal
                schoolId={schoolId}
                isOpen={isBillingModalOpen}
                onClose={() => setIsBillingModalOpen(false)}
            />

            {isMounted && (
                <div className="mt-20 flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 sm:p-8 rounded-[32px] border dashed border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
                            <CheckCircle2 size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className={`text-sm font-black ${ts.textPrimary(isDark)}`}>System Status: Operational</p>
                            <p className={`text-[12px] font-bold ${ts.textMuted(isDark)}`}>All school management services are running smoothly.</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-2xl px-6 font-black h-11 flex items-center justify-center gap-2 w-full sm:w-auto">
                        <HelpCircle size={18} /> Support Center
                    </Button>
                </div>
            )}
        </div>
    );
}
