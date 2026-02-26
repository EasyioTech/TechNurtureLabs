'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn, ArrowLeft, Loader2, School, Eye, EyeOff, Wand2 } from 'lucide-react';

export default function SchoolLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fillDemoCredentials = () => {
    setEmail('school@demo.com');
    setPassword('school123');
    toast.success('Demo credentials filled!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'school_admin' })
      });
      const data = await res.json();

      setLoading(false);

      if (!res.ok) {
        toast.error('Login failed: ' + (data.error || 'Unknown error'));
        return;
      }

      toast.success('Welcome back!');
      window.location.href = '/school-admin';
    } catch (err: any) {
      setLoading(false);
      toast.error('Login failed: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-600/15 via-cyan-600/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-t from-teal-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-900/30" />
        <img
          src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80"
          alt="School"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <School className="text-white" size={24} />
              </div>
              <div>
                <span className="text-2xl font-black">EduQuest</span>
                <span className="text-xs text-cyan-400 block">for Schools</span>
              </div>
            </div>
            <h2 className="text-4xl font-black mb-4 leading-tight">
              Manage your
              <br />
              school&apos;s learning
            </h2>
            <p className="text-white/60 text-lg max-w-md">
              Access your dashboard to track student progress, manage courses, and grow engagement.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          <Link href="/school-portal" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors text-sm">
            <ArrowLeft size={16} />
            Back to School Portal
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <School className="text-white" size={20} />
              </div>
              <div>
                <span className="text-xl font-black">EduQuest</span>
                <span className="text-xs text-cyan-400 block">for Schools</span>
              </div>
            </div>

            <h1 className="text-3xl font-black mb-2">School Admin Sign In</h1>
            <p className="text-white/50 mb-8">Access your school administration dashboard</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">Email address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 focus:border-blue-500 focus:ring-blue-500/20"
                  placeholder="admin@school.edu"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white/70 text-sm">Password</Label>
                  <button type="button" className="text-xs text-blue-400 hover:text-blue-300">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 focus:border-blue-500 focus:ring-blue-500/20 pr-12"
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
                className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg shadow-blue-500/25"
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
                className="w-full border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:text-blue-200"
              >
                <Wand2 size={16} className="mr-2" />
                Use Demo Credentials
              </Button>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-center text-white/50 text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/school-portal/register" className="text-blue-400 hover:text-blue-300 font-semibold">
                  Register Your School
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
