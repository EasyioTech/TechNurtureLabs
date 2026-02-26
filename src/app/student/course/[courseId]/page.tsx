'use client';

import React, { useEffect, useState, use } from 'react';
import { motion } from 'framer-motion';
import { getCourseDetailsData } from '@/app/course-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import {
  ArrowLeft, Play, CheckCircle2, Lock, Trophy, FileText,
  Star, Clock, Zap, Users, BookOpen, Award, Target,
  ChevronRight, Sparkles, GraduationCap, BarChart2, Calendar
} from 'lucide-react';

type Lesson = {
  id: string;
  title: string;
  sequence_index: number;
  content_type: 'video' | 'mcq' | 'ppt';
  duration: number;
  xp_reward: number;
  status: 'locked' | 'available' | 'completed';
};

type Course = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  grade: number | null;
  all_grades: boolean;
  published: boolean;
  created_at: string;
};

export default function CourseDetailsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [enrolledCount, setEnrolledCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getCourseDetailsData(courseId);
        setCourse(data.course as any);
        setLessons(data.lessons as any);
        setEnrolledCount(data.enrolledCount);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchData();
  }, [courseId]);

  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const totalXP = lessons.reduce((acc, l) => acc + l.xp_reward, 0);
  const earnedXP = lessons.filter(l => l.status === 'completed').reduce((acc, l) => acc + l.xp_reward, 0);
  const progress = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;
  const totalDuration = lessons.reduce((acc, l) => acc + (l.duration || 10), 0);
  const nextLesson = lessons.find(l => l.status === 'available');

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-violet-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-3xl" />
      </div>

      <header className="relative z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/student">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                <ArrowLeft size={18} className="mr-2" />
                Back
              </Button>
            </Link>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <h1 className="font-bold text-lg text-slate-800">Course Details</h1>
              <p className="text-xs text-slate-500">{lessons.length} lessons</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-xl overflow-hidden">
                <div className="h-64 relative overflow-hidden">
                  <img
                    src={course?.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800'}
                    alt={course?.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-violet-500 text-white border-0">
                        {course?.all_grades ? 'All Grades' : `Grade ${course?.grade}`}
                      </Badge>
                      {progress === 100 && (
                        <Badge className="bg-emerald-500 text-white border-0">
                          <CheckCircle2 size={12} className="mr-1" /> Completed
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2">{course?.title}</h1>
                    <p className="text-white/80 line-clamp-2">{course?.description}</p>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatBox icon={BookOpen} label="Lessons" value={lessons.length} color="violet" />
                    <StatBox icon={Clock} label="Duration" value={`${totalDuration}m`} color="sky" />
                    <StatBox icon={Star} label="Total XP" value={totalXP} color="amber" />
                    <StatBox icon={Users} label="Students" value={enrolledCount} color="emerald" />
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Your Progress</span>
                      <span className="font-bold text-violet-600">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <p className="text-xs text-slate-500">{completedCount} of {lessons.length} lessons completed • {earnedXP} XP earned</p>
                  </div>

                  {nextLesson ? (
                    <Link href={`/student/lesson/${nextLesson.id}`}>
                      <Button className="w-full bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white border-0 shadow-lg shadow-violet-200 h-12 text-base">
                        {completedCount > 0 ? 'Continue Learning' : 'Start Course'}
                        <ChevronRight size={20} className="ml-2" />
                      </Button>
                    </Link>
                  ) : progress === 100 ? (
                    <Link href={`/student/journey/${courseId}`}>
                      <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-lg shadow-emerald-200 h-12 text-base">
                        <Trophy size={20} className="mr-2" />
                        Review Course
                      </Button>
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <BookOpen className="text-violet-500" size={22} />
                      Course Content
                    </h2>
                    <Link href={`/student/journey/${courseId}`}>
                      <Button variant="outline" size="sm">
                        View Journey Map
                        <ChevronRight size={16} className="ml-1" />
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {lessons.map((lesson, index) => (
                      <LessonRow key={lesson.id} lesson={lesson} index={index} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-lg">
                <CardContent className="p-5">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Target size={18} className="text-violet-500" />
                    Your Progress
                  </h4>
                  <div className="space-y-4">
                    <ProgressRow icon={BookOpen} label="Lessons" value={`${completedCount}/${lessons.length}`} progress={progress} color="violet" />
                    <ProgressRow icon={Star} label="XP Earned" value={`${earnedXP}/${totalXP}`} progress={(earnedXP / totalXP) * 100 || 0} color="amber" />
                    <ProgressRow icon={Trophy} label="Quizzes" value="0/0" progress={0} color="emerald" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
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
                      {progress === 100
                        ? "Congratulations! You've completed this course!"
                        : `Complete ${lessons.length - completedCount} more lessons to finish this course and earn a completion badge!`}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
                            <Award size={14} className="text-amber-300" />
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-white/70">Completion rewards</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-lg">
                <CardContent className="p-5">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart2 size={18} className="text-sky-500" />
                    Course Info
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Grade Level</span>
                      <span className="font-medium text-slate-700">{course?.all_grades ? 'All Grades' : `Grade ${course?.grade}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Duration</span>
                      <span className="font-medium text-slate-700">{totalDuration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">XP Available</span>
                      <span className="font-medium text-slate-700">{totalXP} XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>
                      <Badge className={progress === 100 ? 'bg-emerald-100 text-emerald-700' : progress > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}>
                        {progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'}
                      </Badge>
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

function StatBox({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    violet: 'bg-violet-100 text-violet-600',
    sky: 'bg-sky-100 text-sky-600',
    amber: 'bg-amber-100 text-amber-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  };

  return (
    <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-lg font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function LessonRow({ lesson, index }: { lesson: Lesson; index: number }) {
  const isLocked = lesson.status === 'locked';
  const isCompleted = lesson.status === 'completed';
  const isAvailable = lesson.status === 'available';

  const Icon = lesson.content_type === 'video' ? Play :
    lesson.content_type === 'mcq' ? Trophy :
      FileText;

  const typeLabels: Record<string, string> = {
    video: 'Video',
    mcq: 'Quiz',
    ppt: 'Slides'
  };

  const content = (
    <div className={`
      flex items-center gap-4 p-4 rounded-xl border transition-all
      ${isCompleted
        ? 'bg-emerald-50 border-emerald-200'
        : isLocked
          ? 'bg-slate-50 border-slate-200 opacity-60'
          : 'bg-white border-violet-200 hover:border-violet-300 hover:shadow-md cursor-pointer'}
    `}>
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
        ${isCompleted
          ? 'bg-emerald-500 text-white'
          : isLocked
            ? 'bg-slate-200 text-slate-400'
            : 'bg-violet-100 text-violet-600'}
      `}>
        {isCompleted ? <CheckCircle2 size={24} /> :
          isLocked ? <Lock size={20} /> :
            <Icon size={22} fill={lesson.content_type === 'video' ? 'currentColor' : 'none'} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-slate-400">Lesson {index + 1}</span>
          <Badge variant="outline" className="text-[10px] h-5">
            {typeLabels[lesson.content_type]}
          </Badge>
        </div>
        <h4 className={`font-semibold truncate ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
          {lesson.title}
        </h4>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="text-right">
          <div className="flex items-center gap-1 text-amber-500 text-sm">
            <Star size={14} fill="currentColor" />
            <span className="font-bold">{lesson.xp_reward}</span>
          </div>
          <span className="text-xs text-slate-400">{lesson.duration || 10} min</span>
        </div>
        {isAvailable && <ChevronRight size={20} className="text-violet-400" />}
        {isCompleted && <CheckCircle2 size={20} className="text-emerald-500" />}
      </div>
    </div>
  );

  if (isLocked) return content;

  return (
    <Link href={`/student/lesson/${lesson.id}`}>
      {content}
    </Link>
  );
}

function ProgressRow({ icon: Icon, label, value, progress, color }: { icon: any; label: string; value: string; progress: number; color: string }) {
  const colors: Record<string, string> = {
    violet: 'bg-violet-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-slate-400" />
          <span className="text-sm text-slate-600">{label}</span>
        </div>
        <span className="text-sm font-bold text-slate-700">{value}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${colors[color]}`}
        />
      </div>
    </div>
  );
}
