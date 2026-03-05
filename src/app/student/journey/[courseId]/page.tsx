'use client';

import React, { useEffect, useState, use } from 'react';
import { motion } from 'framer-motion';
import { getCourseJourneyData } from '@/modules/learning/actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  ArrowLeft, Play, CheckCircle2, Lock, Trophy, FileText,
  Star, Clock, Zap, Flag, MapPin, Sparkles, ChevronRight,
  GraduationCap, BookOpen, Award, Target
} from 'lucide-react';

type Lesson = {
  id: string;
  title: string;
  sequence_index: number;
  content_type: 'video' | 'mcq' | 'ppt';
  content_url: string;
  duration: number;
  xp_reward: number;
  status: 'locked' | 'available' | 'completed';
};

type Course = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
};

export default function JourneyPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getCourseJourneyData(courseId);
        setCourse(data.course as any);
        setLessons(data.lessons as any);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchData();
  }, [courseId]);

  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const totalXP = lessons.filter(l => l.status === 'completed').reduce((acc, l) => acc + l.xp_reward, 0);
  const progress = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-sky-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Sparkles className="w-8 h-8 text-violet-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-emerald-100/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-sky-100/50 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-amber-100/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      <header className="relative z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/student">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                  <ArrowLeft size={18} className="mr-2" />
                  Back
                </Button>
              </Link>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <h1 className="font-bold text-lg text-slate-800">{course?.title || 'Learning Journey'}</h1>
                <p className="text-xs text-slate-500">{lessons.length} lessons • {completedCount} completed</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
                <Star size={14} fill="currentColor" />
                <span className="font-bold text-sm">{totalXP} XP</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-violet-200">
                JD
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
                  <MapPin className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Your Learning Path</h2>
                  <p className="text-sm text-slate-500">Follow the road to mastery</p>
                </div>
              </div>
            </motion.div>

            <div className="relative">
              <RoadPath lessons={lessons} />
            </div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-xl overflow-hidden">
                <div className="h-32 relative overflow-hidden">
                  <img
                    src={course?.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400'}
                    alt={course?.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="px-2 py-0.5 rounded-full bg-white/90 text-[10px] font-bold text-slate-700">
                      {lessons.length} LESSONS
                    </span>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-bold text-lg text-slate-800 mb-2">{course?.title}</h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-3">
                    {course?.description || 'Master the fundamentals with interactive lessons and quizzes.'}
                  </p>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Progress</span>
                      <span className="font-bold text-emerald-600">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-lg">
                <CardContent className="p-5">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Target size={18} className="text-violet-500" />
                    Journey Stats
                  </h4>
                  <div className="space-y-4">
                    <StatRow icon={BookOpen} label="Lessons Completed" value={`${completedCount}/${lessons.length}`} color="emerald" />
                    <StatRow icon={Star} label="XP Earned" value={`${totalXP} XP`} color="amber" />
                    <StatRow icon={Clock} label="Est. Time Left" value={`${(lessons.length - completedCount) * 10}m`} color="sky" />
                    <StatRow icon={Award} label="Badges Earned" value="2" color="violet" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-violet-500 to-indigo-600 border-0 shadow-xl shadow-violet-200/50 text-white overflow-hidden">
                <CardContent className="p-5 relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap size={20} className="text-amber-300" />
                      <span className="font-bold">Keep Going!</span>
                    </div>
                    <p className="text-sm text-white/80 mb-4">
                      Complete {lessons.length - completedCount} more lessons to finish this course and earn a completion badge!
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
                            <Trophy size={14} className="text-amber-300" />
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-white/70">+3 badges waiting</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

function RoadPath({ lessons }: { lessons: Lesson[] }) {
  return (
    <div className="relative pb-20">
      <svg className="absolute left-1/2 top-0 h-full w-24 -translate-x-1/2 pointer-events-none" preserveAspectRatio="none">
        <defs>
          <linearGradient id="roadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>
        {lessons.map((lesson, i) => {
          if (i === lessons.length - 1) return null;
          const y1 = i * 180 + 60;
          const y2 = (i + 1) * 180 + 60;
          const isCompleted = lesson.status === 'completed';
          return (
            <motion.line
              key={`road-${i}`}
              x1="48"
              y1={y1}
              x2="48"
              y2={y2}
              stroke={isCompleted ? 'url(#roadGradient)' : '#e2e8f0'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={isCompleted ? '0' : '12 8'}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            />
          );
        })}
      </svg>

      <div className="relative z-10 space-y-8">
        {lessons.map((lesson, i) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`flex items-center gap-6 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
          >
            <div className={`flex-1 ${i % 2 === 0 ? 'text-right' : 'text-left'}`}>
              <LessonCard lesson={lesson} index={i} align={i % 2 === 0 ? 'right' : 'left'} />
            </div>

            <div className="relative flex-shrink-0">
              <LessonNode lesson={lesson} index={i} />
            </div>

            <div className="flex-1" />
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: lessons.length * 0.1 + 0.2 }}
          className="flex justify-center pt-8"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-200">
              <Flag size={32} className="text-white" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-amber-400/30"
            />
            <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap font-bold text-amber-600">
              Finish Line!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function LessonNode({ lesson, index }: { lesson: Lesson; index: number }) {
  const isLocked = lesson.status === 'locked';
  const isCompleted = lesson.status === 'completed';
  const isAvailable = lesson.status === 'available';

  const Icon = lesson.content_type === 'video' ? Play :
    lesson.content_type === 'mcq' ? Trophy :
      FileText;

  return (
    <div className="relative">
      <motion.div
        whileHover={!isLocked ? { scale: 1.1 } : {}}
        whileTap={!isLocked ? { scale: 0.95 } : {}}
        className={`
          w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg cursor-pointer
          transition-all duration-300 border-2
          ${isCompleted
            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-300 text-white'
            : isLocked
              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-white border-violet-300 text-violet-600 shadow-violet-100'}
        `}
      >
        {isCompleted ? <CheckCircle2 size={28} /> :
          isLocked ? <Lock size={24} /> :
            <Icon size={26} fill={lesson.content_type === 'video' ? 'currentColor' : 'none'} />}
      </motion.div>

      {isAvailable && (
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 rounded-2xl bg-violet-400/30 -z-10"
        />
      )}

      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
        {index + 1}
      </div>
    </div>
  );
}

function LessonCard({ lesson, index, align }: { lesson: Lesson; index: number; align: 'left' | 'right' }) {
  const isLocked = lesson.status === 'locked';
  const isCompleted = lesson.status === 'completed';
  const isAvailable = lesson.status === 'available';

  const typeLabels: Record<string, string> = {
    video: 'Video Lesson',
    mcq: 'Quiz',
    ppt: 'Presentation'
  };

  const content = (
    <Card className={`
      max-w-xs transition-all duration-300 overflow-hidden
      ${isLocked
        ? 'bg-slate-50 border-slate-200 opacity-60'
        : isCompleted
          ? 'bg-emerald-50 border-emerald-200 shadow-lg'
          : 'bg-white border-violet-200 shadow-lg hover:shadow-xl hover:border-violet-300'}
    `}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isCompleted ? 'bg-emerald-100 text-emerald-700' :
            isLocked ? 'bg-slate-200 text-slate-500' :
              'bg-violet-100 text-violet-700'
            }`}>
            {typeLabels[lesson.content_type] || 'Lesson'}
          </span>
          <div className="flex items-center gap-1 text-amber-500">
            <Star size={12} fill="currentColor" />
            <span className="text-xs font-bold">{lesson.xp_reward}</span>
          </div>
        </div>

        <h4 className={`font-bold mb-2 ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
          {lesson.title}
        </h4>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {lesson.duration || 10} min
          </span>
          {isCompleted && (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 size={12} />
              Completed
            </span>
          )}
        </div>

        {isAvailable && (
          <Button
            size="sm"
            className="w-full mt-3 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white border-0 shadow-md"
          >
            Start Lesson
            <ChevronRight size={14} className="ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (isLocked) return content;

  return (
    <Link href={`/student/lesson/${lesson.id}`} className={`block ${align === 'right' ? 'ml-auto' : 'mr-auto'}`}>
      {content}
    </Link>
  );
}

function StatRow({ icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    sky: 'bg-sky-100 text-sky-600',
    violet: 'bg-violet-100 text-violet-600',
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={16} />
        </div>
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="font-bold text-slate-800">{value}</span>
    </div>
  );
}
