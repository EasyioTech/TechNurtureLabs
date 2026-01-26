'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  School, ArrowRight, BarChart3, Users, BookOpen, 
  Sparkles, Globe, Shield, Check, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SchoolPortalLanding() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-to-b from-blue-600/20 via-cyan-600/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-t from-violet-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <nav className="relative z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <School className="text-white" size={20} />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight">EduQuest</span>
                <span className="text-xs text-cyan-400 block -mt-1">for Schools</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/school-portal/login">
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/school-portal/register">
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 font-semibold">
                  Register School
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
                <School size={16} className="text-blue-400" />
                <span className="text-sm text-blue-300">School Administration Portal</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mb-6">
                Transform your
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  school&apos;s learning
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
                Join EduQuest and bring gamified learning to your students. 
                Track progress, manage courses, and watch engagement soar.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <Link href="/school-portal/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold px-8 h-14 text-lg rounded-2xl shadow-lg shadow-blue-500/25 w-full sm:w-auto">
                  <School className="mr-2" size={20} />
                  Register Your School
                </Button>
              </Link>
              <Link href="/school-portal/login">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-bold px-8 h-14 text-lg rounded-2xl w-full sm:w-auto">
                  Sign In
                  <ArrowRight className="ml-2" size={20} />
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
              title="Real-time Analytics"
              description="Track student progress, engagement metrics, and learning outcomes with powerful dashboards"
              gradient="from-blue-500 to-cyan-600"
            />
            <FeatureCard 
              icon={Users}
              title="Student Management"
              description="Easily manage student enrollment, track performance, and identify students who need support"
              gradient="from-cyan-500 to-teal-600"
            />
            <FeatureCard 
              icon={BookOpen}
              title="Course Administration"
              description="Access common courses or request custom content tailored to your curriculum"
              gradient="from-teal-500 to-emerald-600"
            />
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Why EduQuest?</span>
            <h2 className="text-3xl md:text-4xl font-black mt-4">
              Built for schools, loved by students
            </h2>
          </div>

          <div className="space-y-4">
            {[
              'Gamified learning keeps students engaged and motivated',
              'Detailed analytics help teachers identify learning gaps',
              'White-label solution with your school branding',
              'CBSE, ICSE, and state board curriculum aligned',
              'Secure platform with data privacy compliance',
              '24/7 support from our education experts',
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Check size={16} className="text-emerald-400" />
                </div>
                <span className="text-white/80">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-700 p-12 md:p-16 text-center overflow-hidden"
          >
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black mb-6">
                Ready to get started?
              </h2>
              <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
                Register your school today and transform how your students learn.
              </p>
              <Link href="/school-portal/register">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-white/90 font-bold px-8 h-14 text-lg rounded-2xl">
                  Register School
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <School className="text-white" size={16} />
              </div>
              <span className="font-bold">EduQuest for Schools</span>
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
