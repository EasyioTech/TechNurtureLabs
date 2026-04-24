'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { ArrowLeft, Loader2, Crown, Eye, EyeOff, Shield, Sparkles, CheckCircle2, Lock, ChevronRight } from 'lucide-react';
import { PrimaryButton } from '@/components/landing/PrimaryButton';
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 0)', backgroundSize: '40px 40px' }}
        />
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-50/60 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Top Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 mb-8 transition-all font-semibold group"
          >
            <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-sm group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-all">
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
            </div>
            <span className="text-sm tracking-tight">Exit Console</span>
          </Link>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-sm overflow-hidden"
        >
          {/* Header Section */}
          <div className="pt-10 pb-6 px-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500" />
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 mb-6 shadow-2xl shadow-slate-900/20"
            >
              <Crown className="text-white" size={32} />
            </motion.div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Root Access</h1>
            <p className="text-slate-500 text-sm font-medium tracking-wide uppercase px-4">
              Secure Admin Infrastructure
            </p>
          </div>

          <div className="px-8 pb-10">
            <AnimatePresence mode="wait">
              {!twoFactorRequired ? (
                <motion.form 
                  key="login-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSubmit} 
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Identity Endpoint
                    </Label>
                    <div className="relative group">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-slate-50/50 border-slate-200 h-13 px-5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 rounded-xl transition-all font-medium text-sm"
                        placeholder="admin@technurture.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Access Protocol
                    </Label>
                    <div className="relative group">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-slate-50/50 border-slate-200 h-13 px-5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 rounded-xl transition-all font-medium text-sm pr-12"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <Shield size={12} className="text-emerald-500" />
                      Encrypted Link
                    </div>
                    <button type="button" className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold uppercase tracking-wider transition-colors">
                      Forgot Access?
                    </button>
                  </div>

                  <PrimaryButton
                    type="submit"
                    disabled={loading}
                    className="w-full !h-14 !text-sm !rounded-xl !bg-slate-900 hover:!bg-slate-800 shadow-xl shadow-slate-900/10 transition-all font-bold uppercase tracking-widest group"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <span className="flex items-center gap-2">
                        Initialize Access
                        <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    )}
                  </PrimaryButton>
                </motion.form>
              ) : (
                <motion.form 
                  key="2fa-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handle2FAVerify} 
                  className="space-y-6"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                      <Lock className="text-indigo-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Verify Identity</h2>
                    <p className="text-sm text-slate-500 mb-8">Enter the 6-digit code from your authenticator</p>

                    <InputOTP maxLength={6} value={otpToken} onChange={setOtpToken}>
                      <InputOTPGroup className="gap-2 sm:gap-3">
                        {[0, 1, 2, 3, 4, 5].map(i => (
                          <InputOTPSlot 
                            key={i} 
                            index={i} 
                            className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl border border-slate-200 font-bold text-lg bg-slate-50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all" 
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>

                    <div className="w-full space-y-4 mt-8">
                      <Button
                        type="submit"
                        disabled={otpToken.length !== 6 || verifying2FA}
                        className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all"
                      >
                        {verifying2FA ? <Loader2 className="animate-spin" size={20} /> : 'Verify Access'}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setTwoFactorRequired(false)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                      >
                        Return to Login
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-6 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-indigo-400" /> 
              AES-256 Valid
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-indigo-400" /> 
              Tier 4 Secure
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium text-center opacity-60">
            Authorized Personnel Only • IP Logged for Security
          </p>
        </motion.div>
      </div>
    </div>
  );
}
