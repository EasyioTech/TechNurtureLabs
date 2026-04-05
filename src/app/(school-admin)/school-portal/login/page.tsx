'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { LogIn, ArrowLeft, Loader2, School, Eye, EyeOff } from 'lucide-react';
import { PrimaryButton } from '@/components/landing/PrimaryButton';
import { SchoolLoginSidebar } from '@/modules/auth/components/SchoolLoginSidebar';
import { getPlatformSettings } from '@/components/landing/actions';
import { useEffect } from 'react';

export default function SchoolLoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [platformSettings, setPlatformSettings] = useState<any>(null);

  useEffect(() => {
    getPlatformSettings().then(setPlatformSettings);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Signing you in...');

    try {
      const result = await signIn(email, password, 'school_admin');
      if (result.success) {
        toast.success('Signed in successfully', { id: toastId });
        router.push('/school-admin');
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
        <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-slate-100/40 rounded-full blur-[120px]" />
      </div>

      <SchoolLoginSidebar settings={platformSettings} />

      {/* Right Content: School Login Form */}
      <div className="flex-1 flex flex-col items-center p-6 relative z-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="w-full max-w-sm my-auto shrink-0"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-6 transition-all font-bold group cursor-pointer text-sm">
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Back
          </Link>

          <div className="mb-6 lg:hidden flex items-center gap-3">
            {platformSettings?.logo_url ? (
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={platformSettings.logo_url} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <School className="text-white" size={20} />
              </div>
            )}
            <span className="text-xl font-bold tracking-tight text-slate-900">{platformSettings?.platform_name || 'Schools'}</span>
          </div>

          <h1 className="text-3xl font-black mb-1 text-slate-900 tracking-tight leading-tight">Admin Sign In</h1>
          <p className="text-slate-500 font-medium mb-8 text-base">Access your school dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-slate-600 font-bold text-[10px] ml-1 uppercase tracking-wider">School Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-slate-200 h-12 px-5 text-slate-900 placeholder:text-slate-300 focus:border-slate-950 focus:ring-slate-950/5 rounded-xl transition-all font-medium text-base shadow-sm"
                placeholder="admin@school.com"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1">
                <Label className="text-slate-600 font-bold text-[10px] uppercase tracking-wider">Password</Label>
                <button type="button" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest cursor-pointer">
                  Recovery
                </button>
              </div>
              <div className="relative group">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border-slate-200 h-12 px-5 text-slate-900 placeholder:text-slate-300 focus:border-slate-950 focus:ring-slate-950/5 rounded-xl transition-all font-medium text-base pr-12 shadow-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <PrimaryButton
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
              </PrimaryButton>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
            <p className="text-slate-500 font-medium text-center text-sm">
              New here?
              <Link href="/school-portal/register" className="text-slate-950 hover:underline font-black ml-1 cursor-pointer">
                Register School
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
