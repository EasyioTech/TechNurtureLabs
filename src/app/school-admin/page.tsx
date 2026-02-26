'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { getSchoolAdminDashboardData, updateSchoolBranding, promoteStudentsAction } from '@/app/school-admin-actions';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  GraduationCap, Settings, Users, Palette, Zap, BookOpen,
  TrendingUp, Award, Calendar, Bell, Search, Filter,
  MoreVertical, ChevronRight, ArrowUpRight, ArrowDownRight,
  Activity, Clock, Target, Star, Trophy, Flame,
  BarChart3, PieChart, LineChart, Sparkles, School,
  UserPlus, Upload, RefreshCw,
  CheckCircle2, XCircle, AlertCircle, Eye, Edit, Trash2, LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type Student = {
  id: string;
  full_name: string;
  total_xp: number;
  current_streak: number;
  level: number;
  class_id: string;
  class_name?: string;
  last_activity_date: string | null;
  progress?: number;
  status: 'active' | 'inactive' | 'graduating';
};

type Course = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  published: boolean;
  lesson_count: number;
  enrolled_count: number;
};

type ClassData = {
  id: string;
  name: string;
  level_index: number;
  student_count: number;
};

type StatsData = {
  totalStudents: number;
  activeStudents: number;
  totalCourses: number;
  totalLessons: number;
  avgProgress: number;
  totalXpEarned: number;
};

type RecentActivity = {
  id: string;
  action: string;
  user: string;
  time: string;
  icon: any;
  color: string;
};

type ClassProgressData = {
  name: string;
  progress: number;
  studentCount: number;
};

export default function SchoolAdminDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalStudents: 0,
    activeStudents: 0,
    totalCourses: 0,
    totalLessons: 0,
    avgProgress: 0,
    totalXpEarned: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [promoting, setPromoting] = useState(false);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [classProgressData, setClassProgressData] = useState<ClassProgressData[]>([]);
  const [adminProfile, setAdminProfile] = useState<any>(null);

  const handleLogout = async () => {
    await signOut();
  };

  useEffect(() => {
    const authUser = user as any;
    if (authUser && authUser.role === 'school_admin' && authUser.school_id) {
      setAdminProfile(authUser);
      fetchAllData(authUser.school_id);
    } else if (authUser) {
      setLoading(false);
    }
  }, [user]);

  async function fetchAllData(schoolId: string | null) {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const data = await getSchoolAdminDashboardData(schoolId);

    const studentsData = data.students || [];
    const coursesData = (data.coursesData as any[]) || [];
    const classesData = data.classesData || [];
    const lessonsData = data.lessonsData || [];
    const progressData = data.progressData || [];

    const classMap = new Map(classesData.map(c => [c.id, c.name]));
    const studentMap = new Map(studentsData.map(s => [s.id, s.full_name]));
    const lessonMap = new Map(lessonsData.map(l => [l.id, l.title]));
    const schoolStudentIds = new Set(studentsData.map(s => s.id));

    const formattedStudents: Student[] = studentsData.map(s => {
      // Calculate real progress for this student
      const studentCompletedLessons = progressData.filter(p =>
        p.user_id === s.id && p.status === 'completed'
      ).length;
      const totalSchoolLessons = lessonsData.filter(l =>
        coursesData.some(c => c.id === l.course_id)
      ).length;
      const realProgress = totalSchoolLessons > 0
        ? Math.round((studentCompletedLessons / totalSchoolLessons) * 100)
        : 0;

      const lastActivityTime = progressData
        .filter(p => p.user_id === s.id)
        .reduce((latest, p) => {
          const pDate = p.updated_at ? new Date(p.updated_at).getTime() : 0;
          return pDate > latest ? pDate : latest;
        }, 0) || null;

      return {
        ...s,
        class_id: s.class_id || '',
        class_name: classMap.get(s.class_id || '') || 'Unassigned',
        progress: realProgress,
        last_activity_date: lastActivityTime ? new Date(lastActivityTime).toISOString() : null,
        status: lastActivityTime && lastActivityTime > Date.now() - 7 * 24 * 60 * 60 * 1000
          ? 'active' : 'inactive'
      };
    });

    const formattedCourses: Course[] = coursesData.map(c => {
      const courseLessonIds = lessonsData.filter(l => l.course_id === c.id).map(l => l.id);
      const uniqueEnrolledUsers = new Set(
        progressData
          .filter(p => courseLessonIds.includes(p.lesson_id) && schoolStudentIds.has(p.user_id))
          .map(p => p.user_id)
      );
      return {
        ...c,
        lesson_count: courseLessonIds.length,
        enrolled_count: uniqueEnrolledUsers.size
      };
    });

    const formattedClasses: ClassData[] = classesData.map(c => ({
      ...c,
      student_count: studentsData.filter(s => s.class_id === c.id).length
    }));

    // Format recent activities from real progress data
    const relevantProgress = progressData.filter(p => schoolStudentIds.has(p.user_id) && p.status === 'completed');

    const activities: RecentActivity[] = relevantProgress.slice(0, 6).map((p, i) => {
      const studentName = studentMap.get(p.user_id) || 'Unknown Student';
      const lessonTitle = lessonMap.get(p.lesson_id) || 'a lesson';
      const completedAt = p.completed_at ? new Date(p.completed_at) : new Date();
      const now = new Date();
      const diffMs = now.getTime() - completedAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let timeAgo = '';
      if (diffDays > 0) timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      else if (diffHours > 0) timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      else if (diffMins > 0) timeAgo = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      else timeAgo = 'Just now';

      return {
        id: `${p.user_id}-${p.lesson_id}`,
        action: `Completed lesson "${lessonTitle}"`,
        user: studentName,
        time: timeAgo,
        icon: CheckCircle2,
        color: 'emerald'
      };
    });

    // Add some variety if we have achievements data
    if (activities.length < 4) {
      const topStudents = [...formattedStudents].sort((a, b) => b.current_streak - a.current_streak).slice(0, 2);
      topStudents.forEach((s, i) => {
        if (s.current_streak >= 3 && activities.length < 6) {
          activities.push({
            id: `streak-${s.id}`,
            action: `Achieved ${s.current_streak}-day streak`,
            user: s.full_name,
            time: 'Recently',
            icon: Flame,
            color: 'orange'
          });
        }
      });
    }

    setRecentActivities(activities);
    setStudents(formattedStudents);
    setCourses(formattedCourses);
    setClasses(formattedClasses);

    // Calculate real class progress from database
    const schoolLessonIds = new Set(lessonsData.filter(l => coursesData.some(c => c.id === l.course_id)).map(l => l.id));
    const totalLessonsForSchool = schoolLessonIds.size;

    const classProgressChart: ClassProgressData[] = classesData.map(cls => {
      const classStudents = studentsData.filter(s => s.class_id === cls.id);
      const classStudentIds = new Set(classStudents.map(s => s.id));

      // Count completed lessons for this class
      const completedLessonsForClass = progressData.filter(p =>
        classStudentIds.has(p.user_id) &&
        schoolLessonIds.has(p.lesson_id) &&
        p.status === 'completed'
      );

      // Calculate progress: (completed lessons) / (total lessons * student count)
      const maxPossible = totalLessonsForSchool * classStudents.length;
      const progress = maxPossible > 0
        ? Math.round((completedLessonsForClass.length / maxPossible) * 100)
        : 0;

      return {
        name: cls.name,
        progress,
        studentCount: classStudents.length
      };
    });

    setClassProgressData(classProgressChart);
    setStats({
      totalStudents: studentsData.length,
      activeStudents: formattedStudents.filter(s => s.status === 'active').length,
      totalCourses: coursesData.length,
      totalLessons: lessonsData.length,
      avgProgress: formattedStudents.length > 0
        ? Math.round(formattedStudents.reduce((a, s) => a + (s.progress || 0), 0) / formattedStudents.length)
        : 0,
      totalXpEarned: studentsData.reduce((a, s) => a + (s.total_xp || 0), 0)
    });

    setLoading(false);
  }

  const updateBranding = async () => {
    if (!adminProfile?.school_id) return;
    try {
      await updateSchoolBranding(adminProfile.school_id, primaryColor);
      toast.success('Branding updated!');
      document.documentElement.style.setProperty('--primary', primaryColor);
    } catch (err) {
      toast.error('Failed to update branding');
    }
  };

  const handlePromote = async () => {
    if (!adminProfile?.school_id) return;
    setPromoting(true);
    try {
      await promoteStudentsAction(adminProfile.school_id);
      toast.success('All students promoted!');
      fetchAllData(adminProfile.school_id);
    } catch (error: any) {
      toast.error('Promotion failed: ' + error.message);
    } finally {
      setPromoting(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Sparkles className="w-8 h-8 text-sky-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-sky-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl" />
      </div>

      <header className="relative z-50 border-b border-stone-200 bg-white/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-200">
                <School className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800">EduQuest Admin</h1>
                <p className="text-sm text-slate-500">Manage students, courses & settings</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-800">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">3</span>
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-800">
                <Settings size={20} />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" className="text-slate-500 hover:text-slate-800">
                <LogOut size={20} />
              </Button>
              <Avatar className="w-10 h-10 border-2 border-sky-200">
                <AvatarFallback className="bg-sky-100 text-sky-600 font-bold">
                  {adminProfile?.full_name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>


      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-stone-200 p-1.5 rounded-2xl shadow-sm flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="overview" className="rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 font-medium transition-all text-sm sm:text-base">
              <BarChart3 size={16} className="sm:mr-2" /><span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 font-medium transition-all text-sm sm:text-base">
              <Users size={16} className="sm:mr-2" /><span className="hidden sm:inline">Students</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 font-medium transition-all text-sm sm:text-base">
              <BookOpen size={16} className="sm:mr-2" /><span className="hidden sm:inline">Courses</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 font-medium transition-all text-sm sm:text-base">
              <Settings size={16} className="sm:mr-2" /><span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Total Students"
                value={stats.totalStudents}
                change="+12%"
                trend="up"
                color="sky"
              />
              <StatCard
                icon={Activity}
                label="Active Today"
                value={stats.activeStudents}
                change={`${Math.round((stats.activeStudents / stats.totalStudents) * 100) || 0}%`}
                trend="up"
                color="emerald"
              />
              <StatCard
                icon={BookOpen}
                label="Total Courses"
                value={stats.totalCourses}
                change="+3"
                trend="up"
                color="amber"
              />
              <StatCard
                icon={Star}
                label="Total XP Earned"
                value={stats.totalXpEarned.toLocaleString()}
                change="+2.4k"
                trend="up"
                color="rose"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 h-full bg-white border-stone-200 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                      <TrendingUp className="text-sky-500" size={20} />
                      Learning Progress by Grade
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">Real-time data</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {classProgressData.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <TrendingUp className="mx-auto mb-2 text-slate-300" size={32} />
                      <p className="text-sm">No classes found. Add classes to see progress.</p>
                    </div>
                  ) : (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={classProgressData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            interval={0}
                            height={60}
                          />
                          <YAxis
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload as ClassProgressData;
                                return (
                                  <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                                    <p className="font-semibold text-slate-800">{data.name}</p>
                                    <p className="text-sm text-violet-600">Progress: {data.progress}%</p>
                                    <p className="text-xs text-slate-500">{data.studentCount} students</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
                            {classProgressData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.progress >= 70 ? '#10b981' : entry.progress >= 40 ? '#f59e0b' : '#8b5cf6'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="h-full">
                <Card className="h-full bg-white border-stone-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                      <Trophy className="text-amber-500" size={20} />
                      Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {students.sort((a, b) => b.total_xp - a.total_xp).slice(0, 5).map((s, i) => (
                        <TopPerformerRow key={s.id} student={s} rank={i + 1} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="bg-white border-stone-200 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                    <Activity className="text-emerald-500" size={20} />
                    Recent Activity
                  </CardTitle>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity) => (
                      <ActivityRow key={activity.id} {...activity} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Activity className="mx-auto mb-2 text-slate-300" size={32} />
                      <p className="text-sm">No recent activity. Student progress will appear here.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-white/80 border-slate-200"
                  />
                </div>
                <Button variant="outline" className="bg-white border-stone-200">
                  <Filter size={16} className="mr-2" />Filters
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="bg-white border-stone-200">
                  <Upload size={16} className="mr-2" />Import
                </Button>
                <Button className="bg-sky-500 hover:bg-sky-600 text-white">
                  <UserPlus size={16} className="mr-2" />Add Student
                </Button>
              </div>
            </div>

            <Card className="bg-white border-stone-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="text-left p-4 text-sm font-semibold text-slate-600">Student</th>
                      <th className="text-left p-4 text-sm font-semibold text-slate-600">Class</th>
                      <th className="text-left p-4 text-sm font-semibold text-slate-600">Level</th>
                      <th className="text-left p-4 text-sm font-semibold text-slate-600">XP</th>
                      <th className="text-left p-4 text-sm font-semibold text-slate-600">Streak</th>
                      <th className="text-left p-4 text-sm font-semibold text-slate-600">Progress</th>
                      <th className="text-left p-4 text-sm font-semibold text-slate-600">Status</th>
                      <th className="text-left p-4 text-sm font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student, i) => (
                      <StudentTableRow key={student.id} student={student} index={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Courses</h2>
                <p className="text-slate-500">View assigned courses (managed by LMS Admin)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border-stone-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Palette className="text-sky-500" size={20} />
                    School Branding
                  </CardTitle>
                  <CardDescription className="text-slate-500">Customize your school&apos;s appearance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Primary Color</Label>
                    <div className="flex gap-3">
                      <div className="relative">
                        <Input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-14 h-14 p-1 cursor-pointer rounded-xl"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="font-mono"
                        />
                        <div className="flex gap-2">
                          {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                            <button
                              key={color}
                              onClick={() => setPrimaryColor(color)}
                              className="w-8 h-8 rounded-lg shadow-sm border-2 border-white hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <p className="text-sm font-medium text-slate-600 mb-3">Preview</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: primaryColor }}>
                        <School size={20} />
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: primaryColor }}>EduQuest</p>
                        <p className="text-xs text-slate-500">Learning Platform</p>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full" onClick={updateBranding} style={{ backgroundColor: primaryColor }}>
                    Apply Changes
                  </Button>
                </CardContent>

              </Card>

              <div className="space-y-6">
                <Card className="bg-white border-stone-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                      <Calendar className="text-sky-500" size={20} />
                      Academic Session
                    </CardTitle>
                    <CardDescription className="text-slate-500">Manage academic year settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-sky-700">Current Session</span>
                        <Badge className="bg-sky-500 text-white">Active</Badge>
                      </div>
                      <p className="text-2xl font-bold text-sky-900">2024-2025</p>
                    </div>
                    <Button variant="outline" className="w-full border-stone-200">
                      <RefreshCw size={16} className="mr-2" />Start New Session
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-orange-500 border-0 shadow-xl text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Zap size={20} />
                      Session Promotion
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-white/80">
                      Advance all students to the next grade level. This action archives current session data and cannot be undone.
                    </p>
                    <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                      <div className="flex items-center justify-between text-sm">
                        <span>Students to promote</span>
                        <span className="font-bold">{stats.totalStudents}</span>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full bg-white text-orange-600 hover:bg-white/90"
                      onClick={handlePromote}
                      disabled={promoting}
                    >
                      {promoting ? (
                        <>
                          <RefreshCw size={16} className="mr-2 animate-spin" />
                          Promoting...
                        </>
                      ) : (
                        <>
                          <Zap size={16} className="mr-2" />
                          Promote All Students
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, change, trend, color }: any) {
  const colors: Record<string, string> = {
    violet: 'from-violet-500 to-indigo-500 shadow-violet-200',
    emerald: 'from-emerald-500 to-teal-500 shadow-emerald-200',
    sky: 'from-sky-500 to-blue-500 shadow-sky-200',
    amber: 'from-amber-500 to-orange-500 shadow-amber-200',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg`}>
              <Icon className="text-white" size={20} />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {change}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-slate-800">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TopPerformerRow({ student, rank }: { student: Student; rank: number }) {
  const rankColors = ['bg-amber-100 text-amber-700', 'bg-slate-100 text-slate-600', 'bg-orange-100 text-orange-700'];
  return (
    <div className="flex items-center gap-3">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${rankColors[rank - 1] || 'bg-slate-100 text-slate-500'}`}>
        {rank}
      </div>
      <Avatar className="w-8 h-8">
        <AvatarFallback className="bg-violet-100 text-violet-600 text-xs">
          {student.full_name.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-slate-700 truncate">{student.full_name}</p>
        <p className="text-xs text-slate-500">{student.class_name}</p>
      </div>
      <div className="flex items-center gap-1 text-amber-500">
        <Star size={14} fill="currentColor" />
        <span className="text-sm font-bold">{student.total_xp}</span>
      </div>
    </div>
  );
}

function ActivityRow({ action, user, time, icon: Icon, color }: any) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    violet: 'bg-violet-100 text-violet-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700">{action}</p>
        <p className="text-xs text-slate-500">{user}</p>
      </div>
      <span className="text-xs text-slate-400 whitespace-nowrap">{time}</span>
    </div>
  );
}

function StudentTableRow({ student, index }: { student: Student; index: number }) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="hover:bg-slate-50/50"
    >
      <td className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-violet-100 text-violet-600 text-xs font-medium">
              {student.full_name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-slate-800">{student.full_name}</p>
            <p className="text-xs text-slate-400">ID: {student.id.slice(0, 8)}</p>
          </div>
        </div>
      </td>
      <td className="p-4 text-slate-600">{student.class_name}</td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
            {student.level}
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1 text-amber-500">
          <Star size={14} fill="currentColor" />
          <span className="font-semibold">{student.total_xp}</span>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1 text-orange-500">
          <Flame size={14} />
          <span className="font-semibold">{student.current_streak}</span>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <Progress value={student.progress} className="w-20 h-2" />
          <span className="text-sm text-slate-600">{student.progress}%</span>
        </div>
      </td>
      <td className="p-4">
        <Badge className={student.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-slate-100 text-slate-600 border-0'}>
          {student.status}
        </Badge>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Eye size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Edit size={16} />
          </Button>
        </div>
      </td>
    </motion.tr>
  );
}

function CourseCard({ course, index }: { course: Course; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-lg hover:shadow-xl transition-all group overflow-hidden">
        <div className="relative h-40 overflow-hidden">
          <img
            src={course.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400'}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
          <div className="absolute top-3 right-3">
            <Badge className={course.published ? 'bg-emerald-500 text-white border-0' : 'bg-slate-500 text-white border-0'}>
              {course.published ? 'Published' : 'Draft'}
            </Badge>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="text-white/90 text-sm font-medium">{course.lesson_count} Lessons</span>
            <span className="text-white/90 text-sm">{course.enrolled_count} enrolled</span>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-slate-800 mb-2 group-hover:text-violet-600 transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-2 mb-4">
            {course.description || 'No description available'}
          </p>
          <Link href={`/school-admin/course/${course.id}`}>
            <Button variant="outline" size="sm" className="w-full">
              <Eye size={14} className="mr-1" />View Details
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
