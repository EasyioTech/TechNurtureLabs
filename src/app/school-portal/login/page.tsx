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
import { LogIn, ArrowLeft, Loader2, School, Eye, EyeOff, Sparkles, CheckCircle2, Building2, Globe, Shield, BarChart3 } from 'lucide-react';
import { NeumorphicButton } from '@/components/landing/NeumorphicButton';
import { ScrollReveal } from '@/components/landing/ScrollReveal';

export default function SchoolLoginPage() {
  const { signIn, setTransition } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Logging in to portal...');

    try {
      const result = await signIn(email, password, 'school_admin');
      if (result.success) {
        toast.success('Successfully logged in!', { id: toastId });
        setTransition(true);
        router.push('/school-admin');
      } else {
        toast.error(result.error || 'Invalid credentials', { id: toastId });
        setLoading(false);
      }
    } catch (err: any) {
      setLoading(false);
      toast.error('Connection failed. Please try again.', { id: toastId });
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
        <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-blue-100/40 rounded-full blur-[120px]" />
      </div>

      {/* Left Sidebar: Institution Focus */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-white border-r border-slate-200 shadow-2xl z-10">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-blue-50/40 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 w-full h-full flex flex-col justify-between p-10">
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
                src="/illustrations/business-charts.svg"
                alt="Institutional Data Security"
                className="w-full h-auto max-h-[300px] object-contain mix-blend-multiply opacity-90 transition-transform hover:scale-105"
              />
            </div>

            <h2 className="text-3xl font-black mb-4 text-slate-900 leading-[1.1] tracking-tight">
              Manage your institution.
            </h2>
            <p className="text-slate-600 text-base font-medium leading-relaxed mb-6">
              Access the administrative dashboard to manage courses, students, and overall school performance.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Globe size={16} />, label: "White Label" },
                { icon: <Shield size={16} />, label: "GDPR Safe" },
                { icon: <BarChart3 size={16} />, label: "Live Stats" },
                { icon: <Sparkles size={16} />, label: "AI Assisted" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/50">
                  <div className="text-slate-900">{item.icon}</div>
                  <span className="text-[10px] font-bold text-slate-700 tracking-tight uppercase">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="text-sm text-slate-400 font-bold uppercase tracking-widest">
            Institutional Portal · Security Grade A+
          </div>
        </div>
      </div>

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
            Return to Directory
          </Link>

          <div className="mb-6 lg:hidden flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
              <School className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Schools</span>
          </div>

          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-slate-50/50 shadow-sm mb-4">
            <Building2 size={12} className="text-blue-600" />
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Administrator</span>
          </div>

          <h1 className="text-3xl font-black mb-1 text-slate-900 tracking-tight leading-tight">School Login</h1>
          <p className="text-slate-500 font-medium mb-8 text-base">Sign in to manage your school's dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-slate-600 font-bold text-[10px] ml-1 uppercase tracking-wider">Admin Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-slate-200 h-12 px-5 text-slate-900 placeholder:text-slate-300 focus:border-blue-500 rounded-xl transition-all font-medium text-base shadow-sm"
                placeholder="admin@institution.edu"
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
                  className="bg-white border-slate-200 h-12 px-5 text-slate-900 placeholder:text-slate-300 focus:border-blue-500 rounded-xl transition-all font-medium text-base pr-12 shadow-sm"
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
              <NeumorphicButton
                type="submit"
                disabled={loading}
                variant="primary"
                className="w-full !h-12 !text-sm !rounded-xl !bg-slate-900 hover:!bg-slate-800 shadow-xl shadow-slate-900/10 transition-all font-black uppercase tracking-widest cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={20} />
                    Validating...
                  </>
                ) : (
                  <>
                    Enter Admin Suite
                    <LogIn size={18} className="ml-2" />
                  </>
                )}
              </NeumorphicButton>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
            <p className="text-slate-500 font-medium text-center text-sm">
              New here?
              <Link href="/school-portal/register" className="text-blue-600 hover:text-blue-700 font-black ml-1 cursor-pointer">
                Partner with Us
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
