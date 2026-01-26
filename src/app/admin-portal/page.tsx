'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Shield, ArrowRight, BarChart3, Users, Settings, 
  Crown, Lock, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminPortalLanding() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-to-b from-violet-600/20 via-purple-600/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-t from-rose-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <nav className="relative z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Crown className="text-white" size={20} />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight">EduQuest</span>
                <span className="text-xs text-violet-400 block -mt-1">Admin Portal</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin-portal/login">
                <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 font-semibold">
                  <Lock size={16} className="mr-2" />
                  Admin Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative z-10 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-8">
                <Shield size={16} className="text-violet-400" />
                <span className="text-sm text-violet-300">System Administration</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mb-6">
                EduQuest
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Super Admin
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
                Manage the entire EduQuest platform. Schools, courses, users, 
                payments, and analytics - all in one place.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center mb-16"
            >
              <Link href="/admin-portal/login">
                <Button size="lg" className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold px-8 h-14 text-lg rounded-2xl shadow-lg shadow-violet-500/25">
                  <Lock className="mr-2" size={20} />
                  Access Admin Console
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={BarChart3}
              title="Platform Analytics"
              description="Monitor platform-wide metrics, user engagement, and revenue in real-time"
              gradient="from-violet-500 to-purple-600"
            />
            <FeatureCard 
              icon={Users}
              title="School & User Management"
              description="Approve schools, manage users, and oversee the entire platform ecosystem"
              gradient="from-purple-500 to-pink-600"
            />
            <FeatureCard 
              icon={Database}
              title="Course & Content Control"
              description="Create and manage common courses, lessons, and educational content"
              gradient="from-pink-500 to-rose-600"
            />
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
              <Shield size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Authorized Access Only</h3>
            <p className="text-white/50 text-sm mb-6">
              This portal is restricted to EduQuest system administrators.
              Unauthorized access attempts are logged and monitored.
            </p>
            <Link href="/admin-portal/login">
              <Button className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                <Lock size={16} className="mr-2" />
                Login to Console
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Crown className="text-white" size={16} />
              </div>
              <span className="font-bold">EduQuest Admin</span>
            </div>
            <p className="text-sm text-white/30">© 2025 EduQuest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, gradient }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5`}>
        <Icon size={24} className="text-white" />
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{description}</p>
    </motion.div>
  );
}
