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
import { LogIn, ArrowLeft, Loader2, Sparkles, GraduationCap, Zap, Trophy, CheckCircle2 } from 'lucide-react';
import { NeumorphicButton } from '@/components/landing/NeumorphicButton';
import { ScrollReveal } from '@/components/landing/ScrollReveal';

export default function StudentLoginPage() {
  const { signIn, setTransition } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pinFocused, setPinFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Logging you in...');

    try {
      const result = await signIn(email, password, 'student');
      if (result.success) {
        toast.success('Successfully logged in!', { id: toastId });
        setTransition(true);
        router.push('/student');
      } else {
        toast.error(result.error || 'Invalid email or password', { id: toastId });
        setLoading(false);
      }
    } catch (err: any) {
      setLoading(false);
      toast.error('Something went wrong. Please try again.', { id: toastId });
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
        <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-blue-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-[100px]" />
      </div>

      {/* Left Sidebar: Brand & Emotional Connection */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-white border-r border-slate-200 shadow-2xl z-10">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/50 via-white to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-blue-50/30 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 w-full h-full flex flex-col justify-between p-10">
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-blue-400 opacity-20 blur-[60px] group-hover:blur-[80px] transition-all duration-700" />
            <img src="/assets/forgot-password.svg" alt="Auth Hero" className="w-[380px] h-auto relative drop-shadow-2xl brightness-105 group-hover:scale-105 transition-transform duration-700" />
          </div>

          {/* Value Propositions */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg shadow-slate-900/10">
              <Sparkles className="text-white" size={20} />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">TechNurture</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="max-w-md"
          >
            <div className="mb-4">
              <img
                src="/assets/login-student.svg"
                alt="Learning"
                className="w-full h-auto max-h-[250px] object-contain mix-blend-multiply opacity-80 transition-transform hover:scale-105"
              />
            </div>

            <h2 className="text-3xl font-black mb-4 text-slate-900 leading-[1.1] tracking-tight">
              Welcome back to TechNurture.
            </h2>
            <p className="text-slate-600 text-base font-medium leading-relaxed mb-6">
              Access your courses, track your progress, and continue your learning journey.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                  <Zap size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Streaks</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Growing</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                  <Trophy size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Badges</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rewards</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="text-sm text-slate-400 font-bold uppercase tracking-widest">
            © 2026 TechNurture Labs · v2.4.0
          </div>
        </div>
      </div>

      {/* Right Content: Login Form */}
      <div className="flex-1 flex flex-col items-center p-6 relative z-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="w-full max-w-sm my-auto shrink-0"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-all font-bold group bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:shadow-md w-fit">
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>

          <div className="mb-6 lg:hidden flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10">
              <Sparkles className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">TechNurture</span>
          </div>


          <h1 className="text-3xl font-black mb-2 text-slate-900 tracking-tight leading-tight">Student Login</h1>
          <p className="text-slate-500 font-medium mb-8 text-base">Enter your account details below to sign in.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-slate-600 font-bold text-[10px] ml-1 uppercase tracking-wider">Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-2 border-slate-200 h-14 px-5 text-slate-900 placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 rounded-2xl transition-all font-bold text-lg shadow-sm"
                placeholder="name@school.com"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1">
                <Label className="text-slate-600 font-bold text-[10px] uppercase tracking-wider">6-Digit PIN</Label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onFocus={() => setPinFocused(true)}
                  onBlur={() => setPinFocused(false)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  placeholder=""
                  autoComplete="current-password"
                  required
                />
                <div className="flex justify-between gap-3">
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className={`flex-1 h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-200
                        ${password[i]
                          ? 'border-slate-900 bg-white shadow-md'
                          : (i === password.length && pinFocused)
                            ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-500/10 scale-110'
                            : 'border-slate-200 bg-white'}
                      `}
                    >
                      {password[i] ? (
                        <div className="w-4 h-4 rounded-full bg-slate-900 animate-in zoom-in duration-300" />
                      ) : (
                        <div className={`w-2 h-2 rounded-full transition-colors ${i === password.length && pinFocused ? 'bg-blue-400 animate-pulse' : 'bg-slate-100'}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-1">
                Enter your 6-digit PIN
              </p>
            </div>

            <div className="pt-2">
              <NeumorphicButton
                type="submit"
                disabled={loading}
                variant="primary"
                className="w-full !h-12 !text-sm !rounded-xl !bg-slate-900 hover:!bg-slate-800 shadow-xl shadow-slate-900/10 transition-all font-black uppercase tracking-widest cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={20} />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <LogIn size={18} className="ml-2" />
                  </>
                )}
              </NeumorphicButton>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
            <p className="text-slate-500 font-medium text-center text-sm">
              New to TechNurture Labs?
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

      <style jsx global>{`
        body { background-color: #f8fafc; }
      `}</style>
    </div>
  );
}
