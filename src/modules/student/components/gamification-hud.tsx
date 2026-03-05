'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Star, Trophy } from 'lucide-react';

export function GamificationHUD({ xp = 0, streak = 0, level = 1 }: { xp?: number; streak?: number; level?: number }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-white/20 dark:border-zinc-800 shadow-2xl">
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Flame className="text-orange-500" fill="currentColor" />
        </motion.div>
        <span className="font-bold text-orange-600">{streak}</span>
      </div>

      <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 mx-2" />

      <div className="flex items-center gap-2">
        <Star className="text-yellow-500" fill="currentColor" />
        <motion.span 
          key={xp}
          initial={{ scale: 1.5, color: '#f59e0b' }}
          animate={{ scale: 1, color: 'inherit' }}
          className="font-bold"
        >
          {xp.toLocaleString()} XP
        </motion.span>
      </div>

      <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 mx-2" />

      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Level</span>
          <span className="text-lg font-black text-primary leading-none">{level}</span>
        </div>
      </div>
    </div>
  );
}
