'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  GraduationCap, School, ArrowRight, Zap, Trophy, Users, 
  BookOpen, Sparkles, Play, Star, ChevronRight, Check,
  Globe, Shield, BarChart3, Gamepad2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-to-b from-violet-600/20 via-purple-600/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-t from-cyan-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-gradient-to-r from-rose-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <nav className="relative z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="text-white" size={20} />
              </div>
              <span className="text-xl font-black tracking-tight">EduQuest</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-white/60 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-white/60 hover:text-white transition-colors">How it Works</a>
              <a href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/register/student">
                <Button className="bg-white text-black hover:bg-white/90 font-semibold">
                  Get Started
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-sm text-white/70">Now enrolling schools across India</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6">
                Learning that
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  feels like play
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
                Transform your school with gamified learning experiences. XP, streaks, 
                achievements, and interactive journeys that keep students engaged.
              </p>
            </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
              >
                <Link href="/register/student">
                  <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-8 h-14 text-lg rounded-2xl shadow-lg shadow-emerald-500/25 w-full sm:w-auto">
                    <GraduationCap className="mr-2" size={20} />
                    Start Learning Now
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-bold px-8 h-14 text-lg rounded-2xl w-full sm:w-auto">
                    Already have an account?
                  </Button>
                </Link>
              </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent z-10 pointer-events-none" />
              <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-2 shadow-2xl">
                <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
                  <img 
                    src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80" 
                    alt="Students learning"
                    className="w-full h-[400px] md:h-[500px] object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30"
                    >
                      <Play size={32} className="text-white ml-1" fill="white" />
                    </motion.button>
                  </div>
                </div>
              </div>
              
              <div className="absolute -left-4 top-1/4 hidden lg:block">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <Trophy size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Achievement Unlocked!</p>
                      <p className="text-xs text-white/50">First Lesson Complete</p>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              <div className="absolute -right-4 bottom-1/4 hidden lg:block">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                      <Zap size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-black">+250 XP</p>
                      <p className="text-xs text-white/50">Keep it up!</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-16 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value="500+" label="Schools" />
            <StatItem value="1M+" label="Students" />
            <StatItem value="10K+" label="Courses" />
            <StatItem value="98%" label="Satisfaction" />
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-sm font-bold text-violet-400 uppercase tracking-wider">Features</span>
              <h2 className="text-4xl md:text-5xl font-black mt-4 mb-6">
                Everything you need to
                <br />
                <span className="text-white/50">transform education</span>
              </h2>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Gamepad2}
              title="Gamified Learning"
              description="XP points, streaks, badges, and leaderboards that make learning addictive"
              gradient="from-violet-500 to-purple-600"
            />
            <FeatureCard 
              icon={BookOpen}
              title="Interactive Courses"
              description="Video lessons, quizzes, and hands-on activities designed for engagement"
              gradient="from-cyan-500 to-blue-600"
            />
            <FeatureCard 
              icon={BarChart3}
              title="Progress Analytics"
              description="Real-time insights into student performance and learning patterns"
              gradient="from-emerald-500 to-teal-600"
            />
            <FeatureCard 
              icon={Globe}
              title="Multi-tenant Platform"
              description="White-labeled solution for schools with custom branding"
              gradient="from-amber-500 to-orange-600"
            />
            <FeatureCard 
              icon={Shield}
              title="Secure & Private"
              description="Enterprise-grade security with data privacy compliance"
              gradient="from-rose-500 to-pink-600"
            />
            <FeatureCard 
              icon={Users}
              title="Collaborative Tools"
              description="Group projects, discussions, and peer learning features"
              gradient="from-indigo-500 to-violet-600"
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative z-10 py-24 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-cyan-400 uppercase tracking-wider">How it Works</span>
            <h2 className="text-4xl md:text-5xl font-black mt-4">
              Get started in minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard 
              number="01"
              title="Register Your School"
              description="Sign up with your school details and UDISE code. Our team will verify and approve within 24 hours."
            />
            <StepCard 
              number="02"
              title="Onboard Students"
              description="Students can register with their school code and start their learning journey immediately."
            />
            <StepCard 
              number="03"
              title="Track & Grow"
              description="Monitor progress with detailed analytics while students earn XP and unlock achievements."
            />
          </div>
        </div>
      </section>

      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 p-12 md:p-16 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoMnY0aC0yem0tNiAydi0yaDR2MmgtNHptMC00di0yaDR2MmgtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black mb-6">
                Ready to transform
                <br />
                your school?
              </h2>
              <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
                Join hundreds of schools already using EduQuest to make learning fun and effective.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/register/student">
                    <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90 font-bold px-8 h-14 text-lg rounded-2xl w-full sm:w-auto">
                      Start Learning
                      <ArrowRight className="ml-2" size={20} />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold px-8 h-14 text-lg rounded-2xl w-full sm:w-auto">
                      Sign In
                    </Button>
                  </Link>
                </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="text-white" size={20} />
              </div>
              <span className="text-xl font-black tracking-tight">EduQuest</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-white/50">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
            <p className="text-sm text-white/30">© 2025 EduQuest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">{value}</p>
      <p className="text-sm text-white/40 mt-1">{label}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, gradient }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/[0.07]"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
        <Icon size={24} className="text-white" />
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative p-8 rounded-2xl bg-white/5 border border-white/10"
    >
      <span className="text-6xl font-black text-white/5 absolute top-4 right-6">{number}</span>
      <div className="relative z-10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-6">
          <Check size={20} className="text-white" />
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-white/50 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}
