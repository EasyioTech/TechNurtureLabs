'use client';

import React, { useEffect, useState, use } from 'react';
import { getCourseDetailsData } from '@/modules/learning/actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const totalXP = lessons.reduce((acc, l) => acc + l.xp_reward, 0);
  const earnedXP = lessons.filter(l => l.status === 'completed').reduce((acc, l) => acc + l.xp_reward, 0);
  const progress = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;
  const totalDuration = lessons.reduce((acc, l) => acc + (l.duration || 10), 0);
  const nextLesson = lessons.find(l => l.status === 'available');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="relative z-50 border-b border-slate-200 bg-white sticky top-0 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/student">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 -ml-3">
                <ArrowLeft size={16} className="mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <h1 className="font-semibold text-sm text-slate-800">Course Details</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                <div className="h-48 sm:h-64 relative overflow-hidden bg-slate-100">
                  <img
                    src={course?.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800'}
                    alt={course?.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <CardContent className="p-6">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold px-2 py-0.5 rounded-md hover:bg-indigo-100 transition-colors">
                        {course?.all_grades ? 'All Grades' : `Grade ${course?.grade}`}
                      </Badge>
                      {progress === 100 && (
                        <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2 py-0.5 rounded-md">
                          <CheckCircle2 size={12} className="mr-1" /> Completed
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{course?.title}</h2>
                    <p className="text-slate-600 font-medium text-sm leading-relaxed">{course?.description}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatBox icon={BookOpen} label="Lessons" value={lessons.length} color="indigo" />
                    <StatBox icon={Clock} label="Duration" value={`${totalDuration}m`} color="sky" />
                    <StatBox icon={Star} label="Total XP" value={totalXP} color="amber" />
                    <StatBox icon={Users} label="Students" value={enrolledCount} color="emerald" />
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 font-medium">Your Progress</span>
                      <span className="font-bold text-indigo-600">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-slate-100 [&>div]:bg-indigo-600" />
                    <p className="text-xs text-slate-500">{completedCount} of {lessons.length} lessons completed • {earnedXP} XP earned</p>
                  </div>

                  {nextLesson ? (
                    <Link href={`/student/lesson/${nextLesson.id}`}>
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-0 h-12 text-base">
                        {completedCount > 0 ? 'Continue Learning' : 'Start Course'}
                        <ChevronRight size={18} className="ml-2" />
                      </Button>
                    </Link>
                  ) : progress === 100 ? (
                    <Link href={`/student/journey/${courseId}`}>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0 h-12 text-base">
                        <Trophy size={18} className="mr-2" />
                        Review Course
                      </Button>
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <BookOpen className="text-slate-400" size={20} />
                      Course Content
                    </h2>
                    <Link href={`/student/journey/${courseId}`}>
                      <Button variant="outline" size="sm" className="text-slate-600">
                        View Map
                        <ChevronRight size={14} className="ml-1" />
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
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Target size={18} className="text-slate-400" />
                    Your Progress
                  </h4>
                  <div className="space-y-4">
                    <ProgressRow icon={BookOpen} label="Lessons" value={`${completedCount}/${lessons.length}`} progress={progress} color="indigo" />
                    <ProgressRow icon={Star} label="XP Earned" value={`${earnedXP}/${totalXP}`} progress={(earnedXP / totalXP) * 100 || 0} color="amber" />
                    <ProgressRow icon={HelpCircle} label="Quizzes" value="0/0" progress={0} color="emerald" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="bg-indigo-50 border-indigo-100 shadow-sm overflow-hidden">
                <CardContent className="p-5">
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap size={18} className="text-indigo-600" />
                      <span className="font-bold text-indigo-900">Keep Going!</span>
                    </div>
                    <p className="text-sm text-indigo-800 mb-4">
                      {progress === 100
                        ? "Congratulations! You've completed this course!"
                        : `Complete ${lessons.length - completedCount} more lessons to finish this course and earn a completion badge!`}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-white border border-indigo-200 flex items-center justify-center">
                            <Award size={10} className="text-amber-500" />
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-indigo-700 font-medium">Rewards available</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BarChart2 size={18} className="text-slate-400" />
                    Course Info
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Grade Level</span>
                      <span className="font-medium text-slate-900">{course?.all_grades ? 'All Grades' : `Grade ${course?.grade}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Duration</span>
                      <span className="font-medium text-slate-900">{totalDuration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">XP Available</span>
                      <span className="font-medium text-slate-900">{totalXP} XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>
                      <Badge variant="outline" className={`border-0 font-medium ${progress === 100 ? 'bg-emerald-50 text-emerald-700' : progress > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                        {progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    sky: 'bg-sky-50 text-sky-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="text-center p-3 rounded-lg bg-slate-50 border border-slate-100">
      <div className={`w-8 h-8 rounded-md mx-auto mb-2 flex items-center justify-center ${colors[color]}`}>
        <Icon size={16} />
      </div>
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mt-0.5">{label}</p>
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
          FileText; // pdf

  const typeLabels: Record<string, string> = {
    video: 'Video',
    ppt: 'Slides',
    pdf: 'Document',
    quiz: 'Assessment',
  };

  const content = (
    <div className={`
      flex items-center gap-4 p-3 rounded-lg border transition-colors
      ${isCompleted
        ? 'bg-slate-50/50 border-slate-200'
        : isLocked
          ? 'bg-slate-50/30 border-slate-100 opacity-70'
          : 'bg-white border-indigo-100 hover:border-indigo-300 hover:shadow-sm cursor-pointer'}
    `}>
      <div className={`
        w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0
        ${isCompleted
          ? 'bg-emerald-50 text-emerald-600'
          : isLocked
            ? 'bg-slate-100 text-slate-400'
            : 'bg-indigo-50 text-indigo-600'}
      `}>
        {isCompleted ? <CheckCircle2 size={18} /> :
          isLocked ? <Lock size={16} /> :
            <Icon size={18} fill={lesson.content_type === 'video' ? 'currentColor' : 'none'} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lesson {index + 1}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 font-medium">
            {typeLabels[lesson.content_type]}
          </span>
        </div>
        <h4 className={`font-semibold text-sm truncate ${isLocked ? 'text-slate-500' : 'text-slate-900'}`}>
          {lesson.title}
        </h4>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="text-right hidden sm:block">
          <div className="flex items-center justify-end gap-1 text-amber-600 text-[11px] font-semibold">
            <Star size={10} fill="currentColor" />
            <span>{lesson.xp_reward}</span>
          </div>
          <span className="text-[10px] text-slate-400">{lesson.duration || 10} min</span>
        </div>
        {isAvailable && <ChevronRight size={16} className="text-indigo-400" />}
        {isCompleted && <CheckCircle2 size={16} className="text-emerald-500" />}
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
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
  };
  const colorClass = colorMap[color] || 'bg-slate-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">{label}</span>
        </div>
        <span className="text-xs font-bold text-slate-900">{value}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${colorClass}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
