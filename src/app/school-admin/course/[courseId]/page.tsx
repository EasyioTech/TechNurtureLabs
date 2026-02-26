'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { fetchSchoolAdminCourseData } from '@/app/school-admin-actions';
import { useAuth } from '@/components/providers/auth-provider';
import {
  ArrowLeft, BookOpen, Users, Clock, Star, Trophy, Flame,
  Play, FileText, Video, ListChecks, Sparkles, BarChart3,
  TrendingUp, Target, Award
} from 'lucide-react';

type Course = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  published: boolean;
  grade: number | null;
  all_grades: boolean;
};

type Lesson = {
  id: string;
  title: string;
  sequence_index: number;
  content_type: string;
  duration: number;
  xp_reward: number;
};

type StudentProgress = {
  student_id: string;
  student_name: string;
  lessons_completed: number;
  total_xp: number;
  avg_score: number;
  last_activity: string | null;
};

export default function SchoolAdminCourseView() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [stats, setStats] = useState({
    totalEnrolled: 0,
    avgCompletion: 0,
    avgScore: 0,
    totalXpEarned: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role === 'school_admin' && user.school_id) {
      if (courseId) fetchCourseData(user.school_id);
    } else if (user) {
      setLoading(false);
    }
  }, [courseId, user]);

  async function fetchCourseData(schoolId: string | null) {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const data = await fetchSchoolAdminCourseData(schoolId, courseId as string);

      if (data.course) setCourse(data.course as any);
      setLessons(data.lessonsData as any[]);

      const studentsData = data.studentsData;
      const progressData = data.progressData;

      if (studentsData && data.lessonsData) {
        const progressByStudent = new Map<string, { completed: number; scores: number[]; lastActivity: string | null }>();

        (progressData || []).forEach(p => {
          if (!progressByStudent.has(p.user_id)) {
            progressByStudent.set(p.user_id, { completed: 0, scores: [], lastActivity: null });
          }
          const entry = progressByStudent.get(p.user_id)!;
          if (p.status === 'completed') entry.completed++;
          if (p.score != null) entry.scores.push(p.score);
          if (!entry.lastActivity || (p.updated_at && p.updated_at > entry.lastActivity)) {
            entry.lastActivity = p.updated_at;
          }
        });

        const studentProgressList: StudentProgress[] = studentsData
          .filter(s => progressByStudent.has(s.id))
          .map(s => {
            const prog = progressByStudent.get(s.id)!;
            return {
              student_id: s.id,
              student_name: s.full_name,
              lessons_completed: prog.completed,
              total_xp: s.total_xp || 0,
              avg_score: prog.scores.length > 0
                ? Math.round(prog.scores.reduce((a, b) => a + b, 0) / prog.scores.length)
                : 0,
              last_activity: prog.lastActivity
            };
          })
          .sort((a, b) => b.lessons_completed - a.lessons_completed);

        setStudentProgress(studentProgressList);

        const totalEnrolled = studentProgressList.length;
        const totalLessons = lessonsData.length;
        const avgCompletion = totalEnrolled > 0 && totalLessons > 0
          ? Math.round((studentProgressList.reduce((a, s) => a + s.lessons_completed, 0) / (totalEnrolled * totalLessons)) * 100)
          : 0;
        const allScores = studentProgressList.flatMap(s => s.avg_score > 0 ? [s.avg_score] : []);
        const avgScore = allScores.length > 0
          ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
          : 0;
        const totalXpEarned = studentProgressList.reduce((a, s) => a + s.total_xp, 0);

        setStats({ totalEnrolled, avgCompletion, avgScore, totalXpEarned });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'youtube': return Play;
      case 'mcq': return ListChecks;
      default: return FileText;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Sparkles className="w-8 h-8 text-violet-500" />
        </motion.div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50">
        <p className="text-slate-500">Course not found</p>
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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/school-admin" className="flex items-center gap-3 text-slate-600 hover:text-violet-600 transition-colors">
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <h1 className="font-bold text-lg text-slate-800">Course Details</h1>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-xl overflow-hidden">
            <div className="relative h-48 overflow-hidden">
              <img
                src={course.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800'}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={course.published ? 'bg-emerald-500 text-white border-0' : 'bg-slate-500 text-white border-0'}>
                    {course.published ? 'Published' : 'Draft'}
                  </Badge>
                  <Badge className="bg-violet-500/80 text-white border-0">
                    {course.all_grades ? 'All Grades' : `Grade ${course.grade}`}
                  </Badge>
                </div>
                <h1 className="text-3xl font-black text-white">{course.title}</h1>
              </div>
            </div>
            <CardContent className="p-6">
              <p className="text-slate-600 mb-6">{course.description || 'No description available'}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Students Enrolled" value={stats.totalEnrolled} color="violet" />
                <StatCard icon={Target} label="Avg Completion" value={`${stats.avgCompletion}%`} color="emerald" />
                <StatCard icon={Award} label="Avg Score" value={`${stats.avgScore}%`} color="amber" />
                <StatCard icon={Star} label="Total XP Earned" value={stats.totalXpEarned.toLocaleString()} color="sky" />
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="text-violet-500" size={20} />
                  Course Curriculum
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lessons.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No lessons in this course yet</p>
                ) : (
                  lessons.map((lesson, index) => {
                    const Icon = getLessonIcon(lesson.content_type);
                    return (
                      <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                          <Icon size={18} className="text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">{lesson.title}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{lesson.duration} min</span>
                            <span>•</span>
                            <span className="text-amber-600">{lesson.xp_reward} XP</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="text-emerald-500" size={20} />
                  Student Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studentProgress.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">No student progress data available</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-3 text-sm font-semibold text-slate-600">Student</th>
                          <th className="text-left p-3 text-sm font-semibold text-slate-600">Progress</th>
                          <th className="text-left p-3 text-sm font-semibold text-slate-600">Avg Score</th>
                          <th className="text-left p-3 text-sm font-semibold text-slate-600">XP</th>
                          <th className="text-left p-3 text-sm font-semibold text-slate-600">Last Active</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentProgress.slice(0, 10).map((student, i) => {
                          const progressPercent = lessons.length > 0
                            ? Math.round((student.lessons_completed / lessons.length) * 100)
                            : 0;
                          return (
                            <tr key={student.student_id} className="hover:bg-slate-50/50">
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xs">
                                    {student.student_name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <span className="font-medium text-slate-800">{student.student_name}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Progress value={progressPercent} className="w-24 h-2" />
                                  <span className="text-sm text-slate-600">{progressPercent}%</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`font-semibold ${student.avg_score >= 80 ? 'text-emerald-600' : student.avg_score >= 60 ? 'text-amber-600' : 'text-slate-600'}`}>
                                  {student.avg_score > 0 ? `${student.avg_score}%` : '-'}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1 text-amber-600">
                                  <Star size={14} fill="currentColor" />
                                  <span className="font-semibold">{student.total_xp}</span>
                                </div>
                              </td>
                              <td className="p-3 text-sm text-slate-500">
                                {student.last_activity
                                  ? new Date(student.last_activity).toLocaleDateString()
                                  : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    violet: 'from-violet-500 to-indigo-500 bg-violet-50',
    emerald: 'from-emerald-500 to-teal-500 bg-emerald-50',
    amber: 'from-amber-500 to-orange-500 bg-amber-50',
    sky: 'from-sky-500 to-blue-500 bg-sky-50',
  };

  return (
    <div className={`p-4 rounded-xl ${colors[color].split(' ')[1]}`}>
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors[color].split(' ')[0]} flex items-center justify-center mb-3 shadow-md`}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-2xl font-black text-slate-800">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
