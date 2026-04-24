'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { ArrowLeft, Loader2, Crown, Eye, EyeOff, Shield, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { PrimaryButton } from '@/components/landing/PrimaryButton';
import { ScrollReveal } from '@/components/landing/ScrollReveal';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export default function AdminLoginPage() {
  const { signIn, refreshProfile, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [userIdFor2FA, setUserIdFor2FA] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);

  React.useEffect(() => {
    if (!authLoading && profile?.role === 'super_admin') {
      router.replace('/admin');
    }
  }, [profile, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Identity Credentials Required');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Initializing Super Admin Protocol...');

    try {
      const result = await signIn(email, password, 'super_admin');
      if (result.success) {
        if (result.two_factor_required) {
          toast.success('MFA Verification Required', { id: toastId });
          setTwoFactorRequired(true);
          setUserIdFor2FA(result.userId || '');
          setLoading(false);
        } else {
          toast.success('Credentials Accepted. Entering Mainframe...', { id: toastId });
          router.push('/admin');
        }
      } else {
        toast.error(result.error || 'Identity Rejected. Access Denied.', { id: toastId });
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      toast.error('Access Point Malfunction. System Offline.', { id: toastId });
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpToken.length !== 6) return;

    setVerifying2FA(true);
    const toastId = toast.loading('Decrypting MFA Protocol...');

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userIdFor2FA, token: otpToken })
      });

      const result = await res.json();
      if (result.success) {
        await refreshProfile();
        toast.success('Identity Confirmed. Access Granted.', { id: toastId });
        router.push('/admin');
      } else {
        toast.error(result.error || 'Invalid Identity Token', { id: toastId });
        setVerifying2FA(false);
      }
    } catch (error) {
      setVerifying2FA(false);
      toast.error('MFA Subsystem Failure', { id: toastId });
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 selection:bg-indigo-100 selection:text-indigo-900">

      {/* Background Matrix & Ambient Intensity */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '30px 30px' }}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-100/50 via-white to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-100/30 rounded-full blur-[160px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="w-full max-w-4xl relative z-10 overflow-y-auto my-auto shrink-0 scroll-smooth px-4"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-8 transition-all font-bold group cursor-pointer">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Exit Secure Console
        </Link>

        {/* Pro Glass Card */}
        <div className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row gap-10 items-stretch">

          {/* Left Branding Section */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/80 rounded-3xl border border-slate-100">
            <div className="mb-8">
              <img src="/assets/admin-login.svg" alt="Admin Terminal" className="w-56 h-auto mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3 uppercase">Root Access</h1>
              <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] px-2 leading-relaxed">Secure Infrastructure Management Environment</p>
            </div>
          </div>

          {/* Right Form Section */}
          <div className="flex-1 flex flex-col justify-center py-4 pr-2 hover:bg-transparent">
            {!twoFactorRequired ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold text-xs uppercase tracking-[0.1em] ml-1">Identity Endpoint</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-50 border-slate-200 h-14 px-5 text-slate-900 placeholder:text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl transition-all font-medium text-base shadow-inner"
                    placeholder="your@domain.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold text-xs uppercase tracking-[0.1em] ml-1">Access Protocol</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-50 border-slate-200 h-14 px-5 text-slate-900 placeholder:text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl transition-all font-medium text-base pr-14 shadow-inner"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <PrimaryButton
                    type="submit"
                    disabled={loading}
                    variant="primary"
                    className="w-full !h-16 !text-base !rounded-2xl !bg-slate-900 hover:!bg-slate-800 shadow-xl shadow-slate-900/20 transition-all font-black uppercase tracking-widest cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={24} />
                        Validating...
                      </>
                    ) : (
                      <>
                        Login
                        <Shield size={20} className="ml-2" />
                      </>
                    )}
                  </PrimaryButton>
                </div>
              </form>
            ) : (
              <form onSubmit={handle2FAVerify} className="space-y-8 animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col items-center gap-6">
                  <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-600">
                    <Shield size={32} className="animate-pulse" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Identity Token Required</h2>
                    <p className="text-sm text-slate-500 font-medium mt-1 uppercase tracking-wider text-[10px]">Verification Protocol Active</p>
                  </div>

                  <InputOTP maxLength={6} value={otpToken} onChange={setOtpToken}>
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map(i => (
                        <InputOTPSlot key={i} index={i} className="w-12 h-14 rounded-xl border-2 border-slate-200 font-black text-xl bg-slate-50 focus:border-indigo-500" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>

                  <div className="w-full space-y-3">
                    <Button
                      type="submit"
                      disabled={otpToken.length !== 6 || verifying2FA}
                      className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                    >
                      {verifying2FA ? <Loader2 className="animate-spin mr-2" /> : 'Confirm Identity'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setTwoFactorRequired(false)}
                      className="w-full text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em] transition-colors"
                    >
                      Back to Login
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Security Indicator Footer */}
            <div className="mt-10 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-4">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Lock size={18} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">Encrypted Terminal</p>
                <p className="text-xs text-indigo-700/70 font-medium leading-tight">
                  All activities within this console are tracked via hardware-level logging and encrypted with AES-256.
                </p>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-6 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-indigo-400" /> Layer 7 Security</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-indigo-400" /> Root Authentication</div>
        </div>
      </motion.div>
    </div>
  );
}
