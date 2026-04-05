import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Lock, Shield, CheckCircle, AlertCircle, Loader2, Smartphone, Key } from 'lucide-react';
import { useAdminTheme, t } from '../../../theme-context';

interface SecuritySectionProps {
    twoFactorEnabled: boolean;
    show2FASetup: boolean;
    qrCode: string;
    otpToken: string;
    setOtpToken: (val: string) => void;
    onSetup2FA: () => void;
    onVerify2FA: () => void;
    show2FADisable: boolean;
    setShow2FADisable: (val: boolean) => void;
    disableToken: string;
    setDisableToken: (val: string) => void;
    disabling2FA: boolean;
    onDisable2FA: () => void;
    recoveryCodes: string[];
    currentPassword: string;
    setCurrentPassword: (val: string) => void;
    newPassword: string;
    setNewPassword: (val: string) => void;
    changingPassword: boolean;
    onChangePassword: () => void;
}

export function SecuritySection({
    twoFactorEnabled, show2FASetup, qrCode, otpToken, setOtpToken, onSetup2FA, onVerify2FA,
    show2FADisable, setShow2FADisable, disableToken, setDisableToken, disabling2FA, onDisable2FA,
    recoveryCodes,
    currentPassword, setCurrentPassword, newPassword, setNewPassword, changingPassword, onChangePassword
}: SecuritySectionProps) {
    const { isDark, accent } = useAdminTheme();

    return (
        <div className="space-y-8">
            {/* Password Management Section */}
            <div className={`p-6 md:p-10 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-[#121214]' : 'bg-white'} shadow-xl`}>
                <div className="flex items-center gap-4 mb-8">
                    <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                        <Lock className={accent.text} size={28} />
                    </div>
                    <div>
                        <h2 className={`text-2xl font-black ${t.textPrimary(isDark)} tracking-tight`}>Account Password</h2>
                        <p className={`text-sm ${t.textSecondary(isDark)} font-medium mt-1`}>Update your administrative account password.</p>
                    </div>
                </div>

                <div className="space-y-6 max-w-md">
                    <div className="space-y-4">
                        <Label className={`text-xs font-bold uppercase tracking-wider ${t.textSecondary(isDark)}`}>Current Password</Label>
                        <Input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className={`text-base font-medium h-14 rounded-xl ${isDark ? '!bg-white/[0.04] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="space-y-4">
                        <Label className={`text-xs font-bold uppercase tracking-wider ${t.textSecondary(isDark)}`}>New Password</Label>
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={`text-base font-medium h-14 rounded-xl ${isDark ? '!bg-white/[0.04] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            placeholder="••••••••"
                        />
                    </div>
                    <Button
                        type="button"
                        onClick={onChangePassword}
                        disabled={changingPassword || !currentPassword || !newPassword}
                        className={`h-12 w-full rounded-xl font-bold uppercase tracking-widest ${accent.bg} text-white`}
                    >
                        {changingPassword ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        Change Password
                    </Button>
                </div>
            </div>

            {/* Security & 2FA Section */}
            <div className={`p-6 md:p-10 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-[#121214]' : 'bg-white'} shadow-xl`}>
                <div className="flex items-center gap-4 mb-8">
                    <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                        <Shield className={accent.text} size={28} />
                    </div>
                    <div>
                        <h2 className={`text-2xl font-black ${t.textPrimary(isDark)} tracking-tight`}>Security & MFA</h2>
                        <p className={`text-sm ${t.textSecondary(isDark)} font-medium mt-1`}>Enhance your administrative account security with Two-Factor Authentication.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className={`p-6 md:p-8 rounded-3xl border ${twoFactorEnabled ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : 'border-amber-500/20 bg-amber-500/[0.02]'}`}>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-6">
                            <div className={`p-4 rounded-2xl shrink-0 ${twoFactorEnabled ? 'bg-emerald-500/10 text-emerald-500 shadow-inner' : 'bg-amber-500/10 text-amber-500 shadow-inner'}`}>
                                {twoFactorEnabled ? <CheckCircle size={28} /> : <AlertCircle size={28} />}
                            </div>
                            <div className="flex-1 space-y-2">
                                <h3 className={`font-black uppercase tracking-[0.1em] text-sm ${t.textPrimary(isDark)}`}>
                                    Two-Factor Authentication: <span className={twoFactorEnabled ? 'text-emerald-500' : 'text-amber-500'}>{twoFactorEnabled ? 'PROTECTED' : 'UNSECURED'}</span>
                                </h3>
                                <p className={`text-xs ${t.textSecondary(isDark)} font-medium leading-relaxed max-w-xl`}>
                                    {twoFactorEnabled
                                        ? 'Your account is secured with a secondary verification layer. Unauthorized infrastructure access is severely restricted.'
                                        : 'We strongly recommend enabling 2FA to protect administrative actions and secure platform infrastructure.'}
                                </p>
                            </div>
                            <div className={`w-full md:w-auto mt-6 md:mt-0 pt-6 md:pt-0 border-t ${isDark ? 'border-white/10' : 'border-slate-200'} md:border-0 flex gap-3 shrink-0`}>
                                {!twoFactorEnabled && !show2FASetup && (
                                    <Button type="button" onClick={onSetup2FA} className={`w-full md:w-auto rounded-xl font-black ${accent.bg} text-white px-8 h-12 uppercase tracking-widest text-xs shadow-lg shadow-${accent.name}-500/20 hover:scale-105 transition-all`}>
                                        Secure Now
                                    </Button>
                                )}
                                {twoFactorEnabled && !show2FADisable && (
                                    <Button type="button" variant="outline" onClick={() => setShow2FADisable(true)}
                                        className={`w-full md:w-auto rounded-xl font-black uppercase tracking-widest text-xs px-8 h-12 border-2 transition-all !bg-transparent
                                                ${isDark ? 'border-white/10 hover:!bg-white/5 text-slate-300' : 'border-slate-200 hover:!bg-slate-50 text-slate-700'}
                                            `}>
                                        Disable
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {show2FADisable && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={`p-8 rounded-3xl border-2 ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'} space-y-6 overflow-hidden`}>
                            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 text-rose-500">
                                        <AlertCircle size={20} />
                                        <h4 className="font-black uppercase tracking-widest text-sm">Disable Two-Factor Authentication</h4>
                                    </div>
                                    <p className={`text-xs ${t.textSecondary(isDark)} font-medium leading-relaxed max-w-lg`}>
                                        Warning: Disabling 2FA will remove the extra layer of security on your administrative account. Please enter your authenticator's 6-digit code to confirm this action.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-4 items-center shrink-0 w-full md:w-auto">
                                    <InputOTP maxLength={6} value={disableToken} onChange={setDisableToken}>
                                        <InputOTPGroup className="gap-2">
                                            {[0, 1, 2, 3, 4, 5].map(i => (
                                                <InputOTPSlot key={i} index={i} className={`w-12 h-14 rounded-xl border-2 font-black text-lg ${isDark ? '!bg-white/5 border-white/10 text-white' : '!bg-white border-slate-200 text-slate-900'} shadow-[none!important] outline-none`} />
                                            ))}
                                        </InputOTPGroup>
                                    </InputOTP>
                                    <div className="flex gap-3 w-full">
                                        <Button type="button" variant="outline" onClick={() => setShow2FADisable(false)} className={`flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-xs border-2 !bg-transparent transition-all ${isDark ? 'border-white/10 text-slate-400 hover:text-white hover:!bg-white/5' : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:!bg-slate-50'}`}>
                                            Cancel
                                        </Button>
                                        <Button type="button" onClick={onDisable2FA} disabled={disableToken.length !== 6 || disabling2FA} className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-xs bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20">
                                            {disabling2FA ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                            Confirm
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {show2FASetup && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`p-8 rounded-3xl border-2 ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'} space-y-8`}>
                            <div className="flex flex-col md:flex-row gap-10">
                                <div className="p-4 bg-white rounded-2xl shadow-xl w-fit mx-auto md:mx-0">
                                    {qrCode ? <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" /> : <div className="w-48 h-48 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}
                                </div>
                                <div className="flex-1 space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-indigo-500">
                                            <Smartphone size={18} />
                                            <span className="text-xs font-black uppercase tracking-wider">Step 1: Scan QR</span>
                                        </div>
                                        <p className={`text-sm font-medium ${t.textSecondary(isDark)}`}>
                                            Open your authenticator app (Google Authenticator, Authy, etc.) and scan the QR code on the left.
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-indigo-500">
                                            <Key size={18} />
                                            <span className="text-xs font-black uppercase tracking-wider">Step 2: Verify Token</span>
                                        </div>
                                        <div className="flex flex-col items-center md:items-start gap-4">
                                            <InputOTP maxLength={6} value={otpToken} onChange={setOtpToken}>
                                                <InputOTPGroup className="gap-2">
                                                    {[0, 1, 2, 3, 4, 5].map(i => (
                                                        <InputOTPSlot key={i} index={i} className={`w-12 h-14 rounded-xl border-2 font-black text-lg ${isDark ? '!bg-white/5 border-white/10 text-white' : '!bg-white border-slate-200 text-slate-900'} shadow-[none!important] outline-none`} />
                                                    ))}
                                                </InputOTPGroup>
                                            </InputOTP>
                                            <Button
                                                type="button"
                                                onClick={onVerify2FA}
                                                disabled={otpToken.length !== 6}
                                                className={`h-12 px-10 rounded-xl font-bold uppercase tracking-widest ${accent.bg} text-white`}
                                            >
                                                Finalize Setup
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {recoveryCodes.length > 0 && (
                        <div className={`p-8 rounded-3xl ${isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'} border-2 space-y-6`}>
                            <div className="flex items-center gap-3 text-indigo-500">
                                <Key size={22} className="shrink-0" />
                                <h4 className="text-sm font-black uppercase tracking-[0.15em]">Emergency Recovery Codes</h4>
                            </div>
                            <p className={`text-xs ${t.textMuted(isDark)} font-medium leading-relaxed max-w-2xl`}>
                                Store these codes in a secure, offline location. They can be used to regain access to your administrative account if you lose your authentication device.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                                {recoveryCodes.map(code => (
                                    <div key={code} className={`p-4 rounded-xl border-2 text-center font-mono text-sm font-black tracking-[0.2em] transition-transform hover:scale-105 cursor-default
                                        ${isDark
                                            ? 'bg-white/[0.04] border-white/10 text-indigo-300 hover:border-indigo-400/50 hover:bg-indigo-500/10'
                                            : 'bg-white border-indigo-100 text-indigo-700 hover:border-indigo-300 hover:shadow-md'}
                                    `}>
                                        {code}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
