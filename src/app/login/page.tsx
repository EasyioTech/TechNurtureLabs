'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { LogIn, ArrowLeft, Loader2, GraduationCap, CheckCircle2 } from 'lucide-react';
import { NeumorphicButton } from '@/components/landing/NeumorphicButton';
import { StudentLoginSidebar } from '@/components/registration/StudentLoginSidebar';
import { getPlatformSettings } from '@/components/landing/actions';

export default function StudentLoginPage() {
  const { signIn, setTransition } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pinFocused, setPinFocused] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [platformSettings, setPlatformSettings] = useState<any>(null);

  useEffect(() => {
    getPlatformSettings().then(setPlatformSettings);
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';

    if (password.length === 0) newErrors.password = 'PIN is required';
    else if (password.length < 6) newErrors.password = 'PIN must be 6 digits';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors to continue');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Signing you in...');

    try {
      const result = await signIn(email, password, 'student');
      if (result.success) {
        toast.success('Signed in successfully', { id: toastId });
        setTransition(true);
        router.push('/student');
      } else {
        toast.error(result.error || 'Invalid credentials', { id: toastId });
        setLoading(false);
      }
    } catch (err: any) {
      setLoading(false);
      toast.error('Connection failure. Try again.', { id: toastId });
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

          <div className="mb-6 lg:hidden flex items-center gap-3">
            {platformSettings?.logo_url ? (
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center p-1 shadow-lg shadow-slate-900/5">
                <img src={platformSettings.logo_url} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10">
                <GraduationCap className="text-white" size={20} />
              </div>
            )}
            <span className="text-xl font-bold tracking-tight text-slate-900">{platformSettings?.platform_name || 'TechNurture'}</span>
          </div>

          <h1 className="text-3xl font-black mb-2 text-slate-900 tracking-tight leading-tight">Sign In</h1>
          <p className="text-slate-500 font-medium mb-8 text-base">Access your student account.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label className={`text-[10px] ml-1 uppercase tracking-wider font-bold transition-colors ${errors.email ? 'text-rose-500' : 'text-slate-600'}`}>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                className={`bg-white h-14 px-5 text-slate-900 placeholder:text-slate-300 focus:ring-4 rounded-2xl transition-all font-bold text-lg shadow-sm border-2 ${errors.email ? 'border-rose-400 ring-rose-500/10 focus:border-rose-500' : 'border-slate-200 focus:border-slate-950 focus:ring-slate-950/5'
                  }`}
                placeholder="name@school.com"
              />
              {errors.email && <p className="text-[10px] text-rose-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1">
                <Label className={`text-[10px] uppercase tracking-wider font-bold transition-colors ${errors.password ? 'text-rose-500' : 'text-slate-600'}`}>Account PIN</Label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  onFocus={() => setPinFocused(true)}
                  onBlur={() => setPinFocused(false)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                  autoComplete="current-password"
                />
                <div className="flex justify-between gap-3">
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className={`flex-1 h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-200
                        ${password[i]
                          ? errors.password ? 'border-rose-400 bg-rose-50/20' : 'border-slate-900 bg-white shadow-md'
                          : (i === password.length && pinFocused)
                            ? 'border-slate-950 bg-slate-50 ring-4 ring-slate-950/5 scale-110'
                            : errors.password ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200 bg-white'}
                      `}
                    >
                      {password[i] ? (
                        <div className={`w-4 h-4 rounded-full animate-in zoom-in duration-300 ${errors.password ? 'bg-rose-500' : 'bg-slate-900'}`} />
                      ) : (
                        <div className={`w-2 h-2 rounded-full transition-colors ${i === password.length && pinFocused ? 'bg-slate-400 animate-pulse' : errors.password ? 'bg-rose-200' : 'bg-slate-100'}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ml-1 ${errors.password ? 'text-rose-500' : 'text-slate-400'}`}>
                {errors.password || 'Enter your security PIN'}
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
                    Signing In...
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

    </div>
  );
}
