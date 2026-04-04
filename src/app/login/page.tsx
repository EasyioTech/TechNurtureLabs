'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { LogIn, ArrowLeft, Loader2, GraduationCap, CheckCircle2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { PrimaryButton } from '@/components/landing/PrimaryButton';
import { StudentLoginSidebar } from '@/components/registration/StudentLoginSidebar';
import { GlobalLogo } from '@/modules/shared/components/global-logo';
import { getPlatformSettings } from "@/components/landing/actions";

export default function StudentLoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pinFocused, setPinFocused] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [platformSettings, setPlatformSettings] = useState<any>(null);

  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    getPlatformSettings().then(setPlatformSettings);
  }, []);

  const validateIdentifier = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = 'Email or Phone is required';
    else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const isPhone = /^\+?[1-9]\d{1,14}$/.test(email.replace(/[-\s]/g, ''));
      if (!isEmail && !isPhone) newErrors.email = 'Invalid email or phone format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validateIdentifier()) return;
    
    setEmailCheckLoading(true);
    try {
      const { checkIdentifierExists } = await import('@/modules/auth/register-actions');
      const result = await checkIdentifierExists(email, 'student');
      
      if (result.exists) {
        setStep(2);
        setErrors({});
      } else {
        // Double check if it's an admin trying to login here
        const adminCheck = await checkIdentifierExists(email);
        if (adminCheck.exists && (adminCheck.role === 'school_admin' || adminCheck.role === 'super_admin')) {
          setErrors({ email: 'This is a student dashboard. Admins please use the school portal.' });
          toast.error('Admin account detected');
        } else {
          setErrors({ email: 'We couldn\'t find a student account with this info' });
          toast.error('Account not found');
        }
      }
    } catch (err) {
      toast.error('Verification failed. Try again.');
    } finally {
      setEmailCheckLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrors({ password: 'PIN must be 6 digits' });
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Opening secure gateway...');

    try {
      const result = await signIn(email, password, 'student');
      if (result.success) {
        toast.success('Access granted!', { id: toastId });
        router.push('/student');
      } else {
        toast.error(result.error || 'Invalid PIN provided', { id: toastId });
        setLoading(false);
      }
    } catch (err: any) {
      setLoading(false);
      toast.error('Session authentication failed', { id: toastId });
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900 flex font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* Background Grid & Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-slate-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-slate-100/30 rounded-full blur-[100px]" />
      </div>

      <StudentLoginSidebar settings={platformSettings} />

      {/* Right Content: Login Form */}
      <div className="flex-1 flex flex-col items-center p-6 relative z-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="w-full max-w-sm my-auto shrink-0"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-all font-bold group px-4 py-2 rounded-xl w-fit">
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Back
          </Link>

          <div className="mb-8 lg:hidden">
            <GlobalLogo settings={platformSettings} size="auto" />
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <h1 className="text-4xl font-black mb-3 text-slate-950 tracking-tight leading-tight uppercase">Let&apos;s get <span className="text-indigo-600">started</span></h1>
                <p className="text-slate-500 font-medium mb-10 text-base">Enter your account details to access the portal.</p>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className={`text-[10px] ml-1 uppercase tracking-[0.2em] font-black transition-colors ${errors.email ? 'text-rose-500' : 'text-slate-500'}`}>Email or Phone</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        autoFocus
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                        }}
                        className={`bg-white h-16 px-6 rounded-2xl transition-all font-bold text-lg shadow-sm border-2 ${errors.email ? 'border-rose-400 focus:border-rose-500 ring-rose-500/10 focus:ring-4' : 'border-slate-200 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5'}`}
                        placeholder="Phone or Email"
                      />
                    </div>
                    {errors.email && <p className="text-[10px] text-rose-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{errors.email}</p>}
                  </div>

                  <PrimaryButton
                    type="button"
                    onClick={handleContinue}
                    disabled={emailCheckLoading}
                    variant="primary"
                    className="w-full !h-16 !text-base !rounded-2xl !bg-slate-950 hover:!bg-slate-900 shadow-xl shadow-slate-950/10 transition-all font-black uppercase tracking-widest cursor-pointer flex items-center justify-center gap-3"
                  >
                    {emailCheckLoading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        Continue to Access
                        <ArrowRight size={18} />
                      </>
                    )}
                  </PrimaryButton>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <button type="button" onClick={() => setStep(1)} className="text-[10px] font-black text-slate-400 hover:text-slate-950 transition-colors uppercase tracking-[0.3em] flex items-center gap-2 mb-6 cursor-pointer">
                  <ArrowLeft size={16} /> Back to Identifier
                </button>

                <h1 className="text-4xl font-black mb-3 text-slate-950 tracking-tight leading-tight uppercase">Confirm <span className="text-indigo-600">Access</span></h1>
                <p className="text-slate-500 font-medium mb-10 text-base">Protecting your learning journey.</p>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <Label className={`text-[10px] uppercase tracking-[0.2em] font-black transition-colors ${errors.password ? 'text-rose-500' : 'text-slate-500'}`}>Security PIN</Label>
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="text-slate-400 hover:text-slate-950 transition-colors cursor-pointer"
                      >
                        {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <div className="relative group">
                      <input
                        type={showPin ? "text" : "password"}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoFocus
                        maxLength={6}
                        value={password}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setPassword(val);
                          if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                        }}
                        onFocus={() => setPinFocused(true)}
                        onBlur={() => setPinFocused(false)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                        autoComplete="current-password"
                      />
                      <div className="flex justify-between gap-2 md:gap-3">
                        {[0, 1, 2, 3, 4, 5].map(i => (
                          <div
                            key={i}
                            className={`flex-1 h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-300
                              ${password[i]
                                ? errors.password ? 'border-rose-400 bg-rose-50/20' : 'border-slate-950 bg-white shadow-md scale-105'
                                : (i === password.length && pinFocused)
                                  ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-500/10 transition-all'
                                  : errors.password ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200 bg-white'}
                            `}
                          >
                            {password[i] ? (
                              <div className={`w-full h-full flex items-center justify-center animate-in zoom-in duration-300 ${errors.password ? 'text-rose-500' : 'text-slate-950'}`}>
                                {showPin ? <span className="text-xl font-black">{password[i]}</span> : <div className={`w-4 h-4 rounded-full ${errors.password ? 'bg-rose-500' : 'bg-slate-950'}`} />}
                              </div>
                            ) : (
                              <div className={`w-2 h-2 rounded-full transition-colors ${i === password.length && pinFocused ? 'bg-indigo-400 animate-pulse' : errors.password ? 'bg-rose-200' : 'bg-slate-200'}`} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    {errors.password && <p className="text-[10px] text-rose-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{errors.password}</p>}
                    <div className="flex justify-end pr-1 pt-1">
                      <Link 
                        href={`/forgot-password/student?identifier=${encodeURIComponent(email)}`} 
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all cursor-pointer"
                      >
                        Help! I forgot my PIN
                      </Link>
                    </div>
                  </div>

                  <PrimaryButton
                    type="submit"
                    disabled={loading}
                    variant="primary"
                    className="w-full !h-16 !text-base !rounded-2xl !bg-slate-950 hover:!bg-slate-900 shadow-2xl shadow-slate-950/20 transition-all font-black uppercase tracking-widest cursor-pointer flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        Sign In to Dashboard
                        <LogIn size={20} />
                      </>
                    )}
                  </PrimaryButton>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
            <p className="text-slate-500 font-medium text-center text-sm">
              New to {platformSettings?.platform_name || 'TechNurture'}?
              <Link href="/register/student" className="text-blue-600 hover:text-blue-700 font-black ml-1 cursor-pointer">
                Sign Up
              </Link>
            </p>

            <div className="flex items-center gap-6 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Secure Login</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Student Data Privacy</div>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
