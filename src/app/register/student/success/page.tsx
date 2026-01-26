'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, LogIn, Mail, Sparkles, Zap, Trophy } from 'lucide-react';

export default function StudentRegistrationSuccess() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-emerald-600/15 via-teal-600/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-t from-cyan-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Sparkles className="text-white" size={20} />
          </div>
          <span className="text-xl font-black">EduQuest</span>
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-8 border border-emerald-500/30"
        >
          <CheckCircle2 className="text-emerald-400" size={48} />
        </motion.div>

        <h1 className="text-3xl font-black mb-3">Welcome Aboard!</h1>
        <p className="text-white/50 mb-8 max-w-sm mx-auto">
          Your account has been created successfully. Get ready to start your learning adventure!
        </p>

        <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Mail size={20} className="text-blue-400" />
            </div>
            <div className="text-left">
              <p className="font-bold">Verify Your Email</p>
              <p className="text-xs text-white/50">Check your inbox for a verification link</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
              <Zap size={20} className="text-amber-400" />
            </div>
            <p className="font-bold text-sm">Earn XP</p>
            <p className="text-xs text-white/40">Complete lessons</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center mx-auto mb-2">
              <Trophy size={20} className="text-violet-400" />
            </div>
            <p className="font-bold text-sm">Unlock Badges</p>
            <p className="text-xs text-white/40">Show your skills</p>
          </div>
        </div>

        <Link href="/login">
          <Button className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
            <LogIn size={18} className="mr-2" />
            Go to Login
          </Button>
        </Link>

        <p className="text-sm text-white/40 mt-6">
          After verifying your email, sign in to start learning
        </p>
      </motion.div>
    </div>
  );
}
