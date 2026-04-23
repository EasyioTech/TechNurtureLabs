'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield, ArrowRight, BarChart3, Users, Settings,
  Crown, Lock, Database, ShieldCheck, Activity, Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PrimaryButton } from '@/components/landing/PrimaryButton';
import { ScrollReveal } from '@/components/landing/ScrollReveal';

import { getPlatformSettings } from '@/components/landing/actions';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';

export default function AdminPortalLanding() {
  const [settings, setSettings] = useState<any>(null);
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile?.role === 'super_admin') {
      router.replace('/admin');
    }
  }, [profile, loading, router]);

  useEffect(() => {
    getPlatformSettings().then(setSettings);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden font-sans">
      {/* High-Security Background Pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-50/50 rounded-full blur-[120px]" />
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <nav className="relative z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              {settings?.logo_url ? (
                <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105 overflow-hidden">
                  <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10 transition-transform group-hover:scale-105">
                  <Crown className="text-white" size={20} />
                </div>
              )}
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 block leading-none">{settings?.platform_name || 'TechNurture'}</span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">System Console</span>
              </div>
            </Link>
            <Link href="/admin-portal/login">
              <PrimaryButton variant="primary" className="!h-10 !px-8 !text-[10px] !bg-slate-900 !rounded-lg !font-black !uppercase !tracking-widest">
                <Lock size={12} className="mr-2" />
                Secure Login
              </PrimaryButton>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative z-10 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 shadow-sm mb-6">
                <ShieldCheck size={14} className="text-indigo-600" />
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Restricted Access Endpoint</span>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tight leading-[0.85] mb-8 text-slate-900">
                The Core <br />
                <span className="text-indigo-600">Operations</span> <br />
                Engine.
              </h1>

              <p className="text-lg md:text-xl text-slate-600 max-w-xl mb-10 leading-relaxed font-medium">
                Comprehensive system-level orchestration. Oversee institutional networks, curriculum distribution, and global platform health from a single high-security console.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link href="/admin-portal/login" className="w-full sm:w-auto">
                  <PrimaryButton size="lg" variant="primary" className="w-full !h-14 !px-10 !text-sm !bg-slate-900 !rounded-xl !font-black !uppercase !tracking-widest shadow-2xl shadow-indigo-900/10">
                    Initialize Console
                    <Terminal className="ml-2" size={18} />
                  </PrimaryButton>
                </Link>
                <div className="flex items-center gap-3 px-6 py-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Status: Optimal</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="relative"
            >
              <div className="relative p-6 md:p-12 rounded-[3.5rem] bg-white border border-slate-200 shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
                <img src="/assets/admin-login.svg" alt="Admin Controls" className="w-full h-auto object-contain mix-blend-multiply opacity-90 transition-transform hover:scale-105 duration-700" />

                {/* Decorative Code Snippet Card */}
                <div className="absolute top-12 -right-6 bg-slate-900/90 backdrop-blur-xl p-4 rounded-xl border border-white/10 shadow-2xl hidden md:block">
                  <div className="flex gap-1.5 mb-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-[8px] font-mono text-indigo-300">SYSTEM_AUTH: VALIDATED</p>
                  <p className="text-[8px] font-mono text-slate-400">ENCRYPTION: AES-256</p>
                </div>
              </div>

              {/* Security Badge */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-8 right-12 bg-indigo-600 p-5 rounded-3xl shadow-2xl text-white flex items-center gap-4 border border-indigo-400/30"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Real-time Load</p>
                  <p className="text-2xl font-black">99.9% Uptime</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={BarChart3}
              title="Global Analytics"
              description="Platform-wide student engagement metrics and revenue tracking at a granular scale."
              color="indigo"
            />
            <FeatureCard
              icon={Users}
              title="School Orchestration"
              description="Approve new institutional endpoints and manage licensing tiers with automated billing."
              color="violet"
            />
            <FeatureCard
              icon={Database}
              title="Core Content Repo"
              description="Maintain the master syllabus and distribute updates to all connected schools instantly."
              color="pink"
            />
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="p-1 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl">
            <div className="bg-white rounded-[2.4rem] p-8 md:p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Shield size={40} className="text-indigo-600" />
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Authorized Operation Only</h2>
              <p className="text-slate-500 font-medium mb-10 max-w-xl mx-auto">
                Access to this portal is restricted to {settings?.platform_name || 'TechNurture'} system architects.
                Every packet transmitted is audited and encrypted using industry standard protocols.
              </p>
              <Link href="/admin-portal/login">
                <PrimaryButton variant="primary" className="!h-14 !px-12 !bg-slate-900 !rounded-xl !font-black !uppercase !tracking-widest">
                  Enter Command Center
                  <ArrowRight size={20} className="ml-2" />
                </PrimaryButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              {settings?.logo_url ? (
                <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
                  <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <Crown className="text-white" size={16} />
                </div>
              )}
              <span className="font-black text-slate-900 tracking-tight">{settings?.platform_name || 'TechNurture'} Core Console</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">© {new Date().getFullYear()} Platform Operations. Proprietary Infrastructure.</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Developed by <a href="https://easyio.tech/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 transition-colors">Easyio Technologies</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color }: any) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    pink: 'bg-pink-50 text-pink-600 border-pink-100'
  };

  return (
    <ScrollReveal direction="up" className="p-8 rounded-[2.5rem] bg-white border border-slate-200 hover:border-indigo-300 transition-all group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border-2 ${(colors as any)[color]}`}>
        <Icon size={28} />
      </div>
      <h3 className="text-2xl font-black mb-3 text-slate-900 tracking-tight">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
    </ScrollReveal>
  );
}
