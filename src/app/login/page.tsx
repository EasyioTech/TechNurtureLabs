'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { LogIn, ArrowLeft, Loader2, Sparkles, GraduationCap, Eye, EyeOff, Zap, Trophy, Wand2 } from 'lucide-react';

export default function StudentLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fillDemoCredentials = () => {
    setEmail('student@demo.com');
    setPassword('student123');
    toast.success('Demo credentials filled!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error('Login failed: ' + error.message);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role !== 'student') {
        toast.error('Access denied. This login is for students only.');
        await supabase.auth.signOut();
        return;
      }

      toast.success('Welcome back!');
      router.push('/student');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-emerald-600/15 via-teal-600/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-t from-cyan-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-900/30" />
        <img 
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80" 
          alt="Students"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Sparkles className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black">EduQuest</span>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-black mb-4 leading-tight">
              Continue your
              <br />
              learning adventure
            </h2>
            <p className="text-white/60 text-lg max-w-md mb-8">
              Pick up where you left off. Your courses, achievements, and progress are waiting for you.
            </p>
            
            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Zap size={20} className="text-amber-400" />
                </div>
                <div>
                  <p className="font-bold">Earn XP</p>
                  <p className="text-xs text-white/50">Level up daily</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Trophy size={20} className="text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold">Achievements</p>
                  <p className="text-xs text-white/50">Unlock badges</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors text-sm">
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <GraduationCap className="text-white" size={20} />
              </div>
              <span className="text-xl font-black">EduQuest</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <GraduationCap size={14} className="text-emerald-400" />
              <span className="text-xs text-emerald-300 font-medium">Student Login</span>
            </div>

            <h1 className="text-3xl font-black mb-2">Welcome back</h1>
            <p className="text-white/50 mb-8">Sign in to continue your learning journey</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">Email address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 focus:border-emerald-500 focus:ring-emerald-500/20"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white/70 text-sm">Password</Label>
                  <button type="button" className="text-xs text-emerald-400 hover:text-emerald-300">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 focus:border-emerald-500 focus:ring-emerald-500/20 pr-12"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={20} />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={18} className="mr-2" />
                    Sign In
                  </>
                )}
</Button>
              </form>

              <div className="mt-4">
                <Button
                  type="button"
                  onClick={fillDemoCredentials}
                  variant="outline"
                  className="w-full border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200"
                >
                  <Wand2 size={16} className="mr-2" />
                  Use Demo Credentials
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-center text-white/50 text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/register/student" className="text-emerald-400 hover:text-emerald-300 font-semibold">
                  Register as Student
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
