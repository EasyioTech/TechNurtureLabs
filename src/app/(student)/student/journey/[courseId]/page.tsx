'use client';

import React, { useEffect, useState, use } from 'react';
import { getCourseJourneyData } from '@/modules/student/components/learning/actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowLeft, Play, CheckCircle2, Lock, Trophy, FileText,
  Star, Clock, Zap, Flag, MapPin, Sparkles, ChevronRight,
  BookOpen, Award, Target
} from 'lucide-react';
import { handleThumbnailError } from '@/lib/media-client';
import { StudentHeader } from '@/modules/student/components/header';
import { StudentDashboardLoader } from '@/modules/student/components/dashboard-loader';
import { getStudentProfileData } from '@/modules/student/actions/profile-actions';

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
  const [school, setSchool] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ xp: 0, streak: 0, level: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [journeyData, profileData] = await Promise.all([
          getCourseJourneyData(courseId),
          getStudentProfileData()
        ]);

        setCourse(journeyData.course as any);
        setLessons(journeyData.lessons as any);
        setSchool(journeyData.school);
        if (profileData) {
          setProfile(profileData.profile);
          setStats(profileData.stats);
        }
      } catch (err) {
        console.error("Error fetching journey data:", err);
      }
      setLoading(false);
    }
    fetchData();
  }, [courseId]);

  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const totalXP = lessons.filter(l => l.status === 'completed').reduce((acc, l) => acc + l.xp_reward, 0);
  const progress = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  if (loading) {
    return <StudentDashboardLoader message="Navigating learning path..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentHeader profile={profile as any} school={school} stats={stats} />
      <header className="relative z-50 border-b border-slate-200 bg-white sticky top-0 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/student">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 -ml-3">
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="h-4 w-px bg-slate-200" />
              <div>
                <h1 className="font-semibold text-sm text-slate-800">{course?.title || 'Learning Journey'}</h1>
                <p className="text-xs text-slate-500">{lessons.length} lessons • {completedCount} completed</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                <Star size={12} fill="currentColor" />
                <span className="font-medium text-xs">{totalXP} XP</span>
              </div>
              <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                JD
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                  <MapPin className="text-indigo-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Your Learning Path</h2>
                  <p className="text-sm text-slate-500">Follow the path to completion</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <RoadPath lessons={lessons} />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                <div className="h-32 relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800">
                  {course?.thumbnail && (
                    <img
                      src={course.thumbnail}
                      alt={course?.title}
                      decoding="async"
                      onError={handleThumbnailError}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="px-2 py-0.5 rounded bg-white text-[10px] font-bold text-slate-800">
                      {lessons.length} LESSONS
                    </span>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-bold text-slate-900 mb-2">{course?.title}</h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-3">
                    {course?.description || 'Build your foundation with these carefully sequenced lessons.'}
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 font-medium">Progress</span>
                      <span className="font-bold text-indigo-600">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${progress}%` }}
                        className="h-full bg-indigo-500 rounded-full transition-[width] duration-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Target size={18} className="text-slate-400" />
                    Journey Stats
                  </h4>
                  <div className="space-y-4">
                    <StatRow icon={BookOpen} label="Lessons Completed" value={`${completedCount}/${lessons.length}`} color="indigo" />
                    <StatRow icon={Star} label="XP Earned" value={`${totalXP} XP`} color="amber" />
                    <StatRow icon={Clock} label="Est. Time Left" value={`${(lessons.length - completedCount) * 10}m`} color="sky" />
                    <StatRow icon={Award} label="Badges Earned" value="2" color="emerald" />
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
                      Complete {lessons.length - completedCount} more lessons to finish this course and earn a completion badge!
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-white border border-indigo-200 flex items-center justify-center">
                            <Trophy size={10} className="text-amber-500" />
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-indigo-700 font-medium">+3 badges waiting</span>
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

function RoadPath({ lessons }: { lessons: Lesson[] }) {
  return (
    <div className="relative pb-20 mt-8">
      <svg className="absolute left-1/2 top-0 h-full w-24 -translate-x-1/2 pointer-events-none" preserveAspectRatio="none">
        {lessons.map((lesson, i) => {
          if (i === lessons.length - 1) return null;
          const y1 = i * 160 + 50;
          const y2 = (i + 1) * 160 + 50;
          const isCompleted = lesson.status === 'completed';
          return (
            <line
              key={`road-${i}`}
              x1="48"
              y1={y1}
              x2="48"
              y2={y2}
              stroke={isCompleted ? '#6366f1' : '#e2e8f0'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={isCompleted ? '0' : '8 6'}
            />
          );
        })}
      </svg>

      <div className="relative z-10 space-y-6">
        {lessons.map((lesson, i) => (
          <div
            key={lesson.id}
            style={{ height: '160px' }}
            className={`flex items-start justify-center gap-6 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
          >
            <div className={`flex-1 flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <LessonCard lesson={lesson} index={i} align={i % 2 === 0 ? 'right' : 'left'} />
            </div>

            <div className="relative flex-shrink-0 flex justify-center w-16">
              <LessonNode lesson={lesson} index={i} />
            </div>

            <div className="flex-1" />
          </div>
        ))}

        <div className="flex justify-center pt-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center border-2 border-indigo-200 shadow-sm">
              <Flag size={24} className="text-indigo-600" />
            </div>
            <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-bold text-sm text-indigo-600">
              Finish Line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LessonNode({ lesson, index }: { lesson: Lesson; index: number }) {
  const isLocked = lesson.status === 'locked';
  const isCompleted = lesson.status === 'completed';

  const Icon = lesson.content_type === 'video' ? Play :
    lesson.content_type === 'mcq' ? Trophy :
      FileText;

  return (
    <div className="relative">
      <div
        className={`
          w-14 h-14 rounded-xl flex items-center justify-center shadow-sm cursor-pointer
          transition-colors border-2
          ${isCompleted
            ? 'bg-indigo-50 border-indigo-500 text-indigo-600'
            : isLocked
              ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-white border-indigo-400 text-indigo-600 shadow-md hover:border-indigo-500'}
        `}
      >
        {isCompleted ? <CheckCircle2 size={24} /> :
          isLocked ? <Lock size={20} /> :
            <Icon size={22} fill={lesson.content_type === 'video' ? 'currentColor' : 'none'} />}
      </div>

      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 shadow-sm flex items-center justify-center text-xs font-bold text-white border-2 border-white">
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
      w-64 transition-colors overflow-hidden
      ${isLocked
        ? 'bg-slate-50 border-slate-200 opacity-60'
        : isCompleted
          ? 'bg-slate-50/50 border-slate-200'
          : 'bg-white border-indigo-200 shadow-sm hover:border-indigo-300'}
    `}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isCompleted ? 'bg-slate-200 text-slate-600' :
            isLocked ? 'bg-slate-200 text-slate-500' :
              'bg-indigo-100 text-indigo-700'
            }`}>
            {typeLabels[lesson.content_type] || 'Lesson'}
          </span>
          <div className="flex items-center gap-1 text-amber-600">
            <Star size={10} fill="currentColor" />
            <span className="text-[10px] font-bold">{lesson.xp_reward}</span>
          </div>
        </div>

        <h4 className={`font-semibold text-sm mb-2 line-clamp-2 ${isLocked ? 'text-slate-500' : 'text-slate-900'}`}>
          {lesson.title}
        </h4>

        <div className="flex items-center gap-3 text-[11px] text-slate-500">
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
            className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs border-0"
          >
            Start Lesson
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (isLocked) return content;

  return (
    <Link href={`/student/lesson/${lesson.id}`} className="block">
      {content}
    </Link>
  );
}

function StatRow({ icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-sky-50 text-sky-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${colors[color]}`}>
          <Icon size={14} />
        </div>
        <span className="text-xs font-medium text-slate-600">{label}</span>
      </div>
      <span className="font-bold text-sm text-slate-900">{value}</span>
    </div>
  );
}
