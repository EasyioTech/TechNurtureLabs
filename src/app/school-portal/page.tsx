'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  School, ArrowRight, BarChart3, Users, BookOpen,
  Sparkles, Globe, Shield, Check, Building2, Landmark, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NeumorphicButton } from '@/components/landing/NeumorphicButton';
import { ScrollReveal } from '@/components/landing/ScrollReveal';

import { getPlatformSettings } from '@/components/landing/actions';
import { useEffect, useState } from 'react';

export default function SchoolPortalLanding() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    getPlatformSettings().then(setSettings);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] select-none pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <nav className="relative z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              {settings?.logo_url ? (
                <div className="w-10 h-10 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                  <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg shadow-slate-900/10">
                  <School className="text-white" size={20} />
                </div>
              )}
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 block leading-none">{settings?.platform_name || 'TechNurture'}</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Institutional Portal</span>
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/school-portal/login" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">Sign In</Link>
              <Link href="/school-portal/register">
                <NeumorphicButton variant="primary" className="!h-10 !px-6 !text-[10px] !bg-slate-900 !rounded-lg !font-black !uppercase !tracking-widest">
                  Partner with Us
                </NeumorphicButton>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative z-10 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 shadow-sm mb-6">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest leading-none">Now Boarding Schools</span>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.85] mb-8 text-slate-900">
                The Future of <br />
                <span className="text-blue-600">Institutional</span> <br />
                Learning.
              </h1>

              <p className="text-lg md:text-xl text-slate-600 max-w-xl mb-10 leading-relaxed font-medium">
                Bridge the gap between traditional curriculum and digital engagement. Empower your staff with data-driven insights and gamified modules.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link href="/school-portal/register" className="w-full sm:w-auto">
                  <NeumorphicButton size="lg" variant="primary" className="w-full !h-14 !px-10 !text-sm !bg-slate-900 !rounded-xl !font-black !uppercase !tracking-widest shadow-2xl shadow-slate-900/20">
                    Register Institution
                    <ArrowRight className="ml-2" size={18} />
                  </NeumorphicButton>
                </Link>
                <div className="flex items-center gap-4 px-6 py-2">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Principal" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Joined by 120+ leading schools</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-blue-500/5 rounded-[3rem] blur-3xl -rotate-6 scale-90" />
              <div className="relative p-4 md:p-8 rounded-[3rem] bg-white border border-slate-200 shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
                <img src="/assets/register-school.svg" alt="School Collaboration" className="w-full h-auto object-contain mix-blend-multiply opacity-90 transition-transform hover:scale-105 duration-700" />
              </div>

              {/* Floating Stat Card */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 max-w-[200px]"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <BarChart3 size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Efficiency</span>
                </div>
                <p className="text-xl font-black text-slate-900">+42% Engagement</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">Platform Capabilities</h2>
            <p className="text-slate-500 font-medium mt-4">Enterprise-grade tools for modern educators.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={BarChart3}
              title="Predictive Analytics"
              description="Identify students falling behind before it happens. Comprehensive performance heatmaps for every grade."
              color="blue"
            />
            <FeatureCard
              icon={Users}
              title="Role-Based Access"
              description="Dedicated portals for Prinicipals, Teachers, and Students with fine-grained permission control."
              color="indigo"
            />
            <FeatureCard
              icon={BookOpen}
              title="Curriculum Engine"
              description="Sync with CBSE, ICSE, or State Board standards. Automate content distribution across the entire campus."
              color="emerald"
            />
          </div>
        </div>
      </section>

      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 relative overflow-hidden text-white group">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 group-hover:bg-blue-600/30 transition-colors duration-700" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <h2 className="text-4xl md:text-6xl font-black mb-8 leading-[0.9]">Ready to upgrade your institution?</h2>
                <div className="space-y-4 mb-10">
                  {[
                    'Custom school branding integration',
                    'Compliant with data privacy standards',
                    'Expert onboarding for your entire staff'
                  ].map((txt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                        <Check size={12} className="text-blue-400" />
                      </div>
                      <span className="text-slate-400 font-medium">{txt}</span>
                    </div>
                  ))}
                </div>
                <Link href="/school-portal/register">
                  <NeumorphicButton variant="primary" className="!h-14 !px-10 !bg-white !text-slate-900 !rounded-xl !font-black !uppercase !tracking-widest">
                    Start Free Trial
                    <Rocket className="ml-2" size={18} />
                  </NeumorphicButton>
                </Link>
              </div>
              <div className="hidden lg:block">
                <img src="/assets/gaming-hero.svg" alt="Gamification" className="w-full h-auto object-contain transition-transform group-hover:scale-105 duration-700" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 py-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              {settings?.logo_url ? (
                <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
                  <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <School className="text-white" size={16} />
                </div>
              )}
              <span className="font-black text-slate-900 tracking-tight">{settings?.platform_name || 'TechNurture'} Institutional</span>
            </div>
            <div className="flex items-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Link href="#" className="hover:text-slate-900 transition-colors">Documentation</Link>
              <Link href="#" className="hover:text-slate-900 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-slate-900 transition-colors">Ethics</Link>
            </div>
            <p className="text-[10px] text-slate-400 font-bold">© {new Date().getFullYear()} {settings?.platform_name || 'TechNurture'}. Secure Institutional Endpoint.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color }: any) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };

  return (
    <ScrollReveal direction="up" className="p-8 rounded-[2.5rem] bg-white border border-slate-200 hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500 border-2 ${(colors as any)[color]}`}>
        <Icon size={28} />
      </div>
      <h3 className="text-2xl font-black mb-3 text-slate-900 tracking-tight">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
      <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 tracking-widest pointer-events-none group-hover:gap-4 transition-all duration-500">
        Learn Capability <ChevronRight size={14} />
      </div>
    </ScrollReveal>
  );
}

function ChevronRight({ size, className }: any) {
  return (
    <svg
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
