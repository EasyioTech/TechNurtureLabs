'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, EyeOff, MonitorOff, ArrowRightLeft, ShieldCheck } from 'lucide-react';

const SHOWN_KEY = (id: string) => `tnl_instructions_${id}`;

interface Props {
  lessonId:        string;
  durationMinutes: number;
  onStart:         () => void;
}

const getRules = (durationMinutes: number) => {
  return [
    {
      icon:  EyeOff,
      title: 'Don\'t switch tabs',
      body:  'Switching to another tab pauses your timer automatically.',
    },
    {
      icon:  MonitorOff,
      title: 'Keep the window visible',
      body:  'Minimising or moving focus away will pause your countdown.',
    },
    {
      icon:  ArrowRightLeft,
      title: 'No skipping allowed',
      body:  'You cannot fast-forward through content — watch it through.',
    },
    {
      icon:  ShieldCheck,
      title: 'Mark Done unlocks automatically',
      body:  'The "Mark Done" button appears only after your ' + durationMinutes + '-minute timer finishes.',
    },
  ];
};

export function LessonInstructionModal({ lessonId, durationMinutes, onStart }: Props) {
  const RULES = getRules(durationMinutes);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(SHOWN_KEY(lessonId))) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [lessonId]);

  function handleStart() {
    try { sessionStorage.setItem(SHOWN_KEY(lessonId), '1'); } catch {}
    setOpen(false);
    onStart();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 64 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 64 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Gradient strip */}
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500" />

            <div className="px-6 pt-6 pb-8 sm:px-8 sm:pt-8 space-y-6">

              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 flex-shrink-0">
                  <Timer size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    Before you start
                  </p>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">
                    {durationMinutes}-Minute Timed Lesson
                  </h2>
                </div>
              </div>

              {/* Rules */}
              <ul className="space-y-3">
                {RULES.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={15} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight">
                        {title}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                        {body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={handleStart}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <Timer size={15} />
                Got it — Start {durationMinutes}m Timer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
