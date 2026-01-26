'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Crown, Eye, EyeOff, Shield, Wand2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fillDemoCredentials = () => {
    setEmail('admin@eduquest.com');
    setPassword('admin123');
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
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      localStorage.setItem('adminUser', JSON.stringify(data.admin));
      toast.success('Welcome back, Admin!');
      router.push('/admin');
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-violet-600/15 via-purple-600/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-t from-rose-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Link href="/admin-portal" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors text-sm">
          <ArrowLeft size={16} />
          Back to Admin Portal
        </Link>

        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Crown className="text-white" size={28} />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black mb-2">Super Admin Login</h1>
            <p className="text-white/50 text-sm">Access the EduQuest administration console</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">Admin Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 focus:border-violet-500 focus:ring-violet-500/20"
                placeholder="admin@eduquest.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/70 text-sm">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 focus:border-violet-500 focus:ring-violet-500/20 pr-12"
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
              className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={20} />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield size={18} className="mr-2" />
                  Access Console
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <p className="text-xs text-violet-300 text-center mb-3">
              This login is monitored. Unauthorized access attempts will be logged.
            </p>
            <Button
              type="button"
              onClick={fillDemoCredentials}
              variant="outline"
              className="w-full border-violet-500/30 text-violet-300 hover:bg-violet-500/20 hover:text-violet-200"
            >
              <Wand2 size={16} className="mr-2" />
              Use Demo Credentials
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
