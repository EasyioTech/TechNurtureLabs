'use client';

import React, { useEffect, useState, use } from 'react';
import { getCourseDetailsData } from '@/components/learning/actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StudentDashboardLoader } from '@/modules/student/components/dashboard-loader';
import Link from 'next/link';
import {
  ArrowLeft, Play, CheckCircle2, Lock, Trophy, FileText,
  Star, Clock, Zap, Users, BookOpen, Award, Target,
  ChevronRight, Sparkles, GraduationCap, BarChart2, Calendar,
  MonitorPlay, HelpCircle
} from 'lucide-react';

type Lesson = {
  id: string;
  title: string;
  sequence_index: number;
  content_type: 'video' | 'ppt' | 'pdf' | 'quiz';
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

  const completedCount = (lessons || []).filter(l => l.status === 'completed').length;
  const totalXP = (lessons || []).reduce((acc, l) => acc + (l.xp_reward || 0), 0);
  const earnedXP = (lessons || []).filter(l => l.status === 'completed').reduce((acc, l) => acc + (l.xp_reward || 0), 0);
  const progress = (lessons || []).length > 0 ? (completedCount / lessons.length) * 100 : 0;
  const totalDuration = (lessons || []).reduce((acc, l) => acc + (l.duration || 10), 0);
  const nextLesson = (lessons || []).find(l => l.status === 'available');

  if (loading) {
    return <StudentDashboardLoader message="Curating course modules..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50/30">
      <header className="sticky top-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-slate-100 lg:px-12 px-6 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/student">
            <button className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div className="h-6 w-px bg-slate-100" />
          <div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-0.5">My Course</p>
            <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate max-w-[200px] sm:max-w-none">
              {course?.title || 'Learning Course'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Module Progress</p>
            <p className="text-xs font-black text-slate-900">{Math.round(progress)}% Complete</p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-slate-50 flex p-0.5">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 lg:px-12 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Side: Course Info & Content */}
          <div className="lg:col-span-8 space-y-16">
            <section>
              <div className="relative group rounded-[3rem] overflow-hidden bg-slate-900 aspect-[21/9] mb-12 shadow-2xl shadow-indigo-900/10 border border-white/5">
                <img
                  src={course?.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200'}
                  alt={course?.title}
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 lg:bottom-12 lg:left-12 lg:right-12">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Badge className="bg-indigo-600/90 text-white border-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                      {course?.all_grades ? 'Universal Course' : `Class ${course?.grade} Level`}
                    </Badge>
                    <Badge className="bg-white/10 text-white border-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                      {enrolledCount} Students Enrolled
                    </Badge>
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase mb-4 leading-none max-w-2xl">
                    {course?.title}
                  </h1>
                  <p className="text-slate-300 text-sm lg:text-base font-medium max-w-2xl line-clamp-2 leading-relaxed opacity-80 uppercase tracking-wide">
                    {course?.description || 'Advanced curriculum designed for technical mastery and analytical thinking.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox icon={BookOpen} label="Lessons" value={lessons.length} color="indigo" />
                <StatBox icon={Clock} label="Total Duration" value={`${totalDuration}m`} color="sky" />
                <StatBox icon={Star} label="Course XP" value={totalXP} color="amber" />
                <StatBox icon={Trophy} label="Course Status" value="Active" color="emerald" />
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                    <Zap size={16} />
                  </div>
                  Curriculum Content
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {lessons.length} Lessons Total
                </p>
              </div>

              <div className="space-y-4">
                {lessons.map((lesson, index) => (
                  <LessonRow key={lesson.id} lesson={lesson} index={index} />
                ))}
              </div>
            </section>
          </div>

          {/* Right Side: Progress & Call to Action */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit space-y-8">
            <div className="bg-white border border-slate-100 rounded-[3rem] p-8 shadow-xl shadow-slate-200/50">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Learning Status</h4>
                <div className={`w-3 h-3 rounded-full ${progress === 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-indigo-500 animate-pulse' : 'bg-slate-200'}`} />
              </div>

              <div className="space-y-8 mb-10">
                <div>
                  <div className="flex items-end justify-between mb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Course Progress</span>
                    <span className="text-indigo-600">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-6 bg-slate-50 rounded-2xl overflow-hidden p-1.5 border border-slate-100/50">
                    <div
                      className="h-full bg-indigo-600 rounded-xl transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3 text-center">
                    {completedCount} of {lessons.length} Lessons Done
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-amber-500 shadow-sm">
                      <Star size={18} fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Acquired XP</p>
                      <p className="text-lg font-black text-slate-900">{earnedXP} XP</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-indigo-500 uppercase">+{totalXP - earnedXP} Left</p>
                </div>
              </div>

              {nextLesson ? (
                <Link href={`/student/lesson/${nextLesson.id}`} className="block">
                  <button className="w-full bg-slate-900 text-white h-20 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-600 hover:shadow-2xl hover:shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                    {completedCount > 0 ? 'Resume Lesson' : 'Start Course'}
                    <ChevronRight size={18} />
                  </button>
                </Link>
              ) : progress === 100 ? (
                <div className="text-center p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100">
                  <Trophy size={48} className="mx-auto text-emerald-500 mb-6" />
                  <h4 className="text-lg font-black text-emerald-900 uppercase tracking-tight mb-2">Course Completed</h4>
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest leading-relaxed mb-8">Great job! You have successfully finished all lessons in this course.</p>
                  <Link href="/student">
                    <button className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-colors">Return Home</button>
                  </Link>
                </div>
              ) : null}
            </div>

            {/* Additional Rewards Placeholder */}
            <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Milestone Rewards</h4>
              <div className="flex gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Award size={20} className="text-indigo-400 opacity-30" />
                  </div>
                ))}
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-6">Unlock upon 100% completion</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const accentColors: Record<string, string> = {
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100/50',
    sky: 'text-sky-600 bg-sky-50 border-sky-100/50',
    amber: 'text-amber-600 bg-amber-50 border-amber-100/50',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100/50',
  };

  return (
    <div className="bg-white border border-slate-100 p-6 rounded-[2rem] hover:border-slate-300 transition-all group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${accentColors[color]}`}>
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <p className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5">{value}</p>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">{label}</p>
    </div>
  );
}

function LessonRow({ lesson, index }: { lesson: Lesson; index: number }) {
  const isLocked = lesson.status === 'locked';
  const isCompleted = lesson.status === 'completed';
  const isAvailable = lesson.status === 'available';

  const Icon =
    lesson.content_type === 'video' ? Play :
      lesson.content_type === 'quiz' ? HelpCircle :
        lesson.content_type === 'ppt' ? MonitorPlay :
          FileText;

  const typeLabels: Record<string, string> = {
    video: 'Video Lesson',
    ppt: 'Slideshow',
    pdf: 'Reading Doc',
    quiz: 'Practice Quiz',
  };

  const content = (
    <div className={`
      flex items-center gap-6 p-5 rounded-[2rem] border transition-all duration-300 group/row relative overflow-hidden
      ${isCompleted
        ? 'bg-emerald-50/20 border-emerald-100'
        : isLocked
          ? 'bg-slate-50/50 border-slate-100 opacity-60 grayscale'
          : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 cursor-pointer'}
    `}>
      <div className={`
        w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 transition-transform group-hover/row:scale-105 duration-300
        ${isCompleted
          ? 'bg-white text-emerald-500 border-emerald-100'
          : isLocked
            ? 'bg-slate-100 text-slate-400 border-slate-200'
            : 'bg-white text-indigo-600 border-indigo-100 shadow-sm shadow-indigo-100'}
      `}>
        {isCompleted ? <CheckCircle2 size={24} /> :
          isLocked ? <Lock size={20} /> :
            <Icon size={24} strokeWidth={2.5} />}
      </div>

      <div className="flex-1 min-w-0 pr-4">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Step {index + 1}</span>
          <span className="text-[8px] px-2 py-0.5 rounded-full bg-slate-900 text-white font-black uppercase tracking-widest">
            {typeLabels[lesson.content_type]}
          </span>
          {isAvailable && (
            <span className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              Next Activity
            </span>
          )}
        </div>
        <h4 className={`text-base font-black truncate tracking-tight uppercase leading-none ${isLocked ? 'text-slate-400' : 'text-slate-900 group-hover/row:text-indigo-600 transition-colors duration-300'}`}>
          {lesson.title}
        </h4>
      </div>

      <div className="flex items-center gap-6 flex-shrink-0">
        <div className="text-right hidden sm:block">
          <div className="flex items-center justify-end gap-1.5 text-amber-500 text-[11px] font-black">
            <Star size={12} fill="currentColor" />
            <span className="uppercase tracking-widest">{lesson.xp_reward} XP</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 font-mono">{lesson.duration || 10} MINS</p>
        </div>

        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isAvailable ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 group-hover/row:translate-x-1' : 'text-slate-200'}`}>
          {isCompleted ? <CheckCircle2 size={20} className="text-emerald-500" /> : <ChevronRight size={20} />}
        </div>
      </div>

      {/* Background Micro-animation line */}
      <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-700 w-0 group-hover/row:w-full" />
    </div>
  );

  if (isLocked) return content;

  return (
    <Link href={`/student/lesson/${lesson.id}`} className="block">
      {content}
    </Link>
  );
}

