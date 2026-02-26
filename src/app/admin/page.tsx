'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { fetchAllAdminData, fetchCourseLessons, saveCourseAdmin, deleteCourseAdmin, saveLessonAdmin, deleteLessonAdmin, saveLessonOrderAdmin, savePlanAdmin, deletePlanAdmin } from '@/app/admin-actions';
import { toast } from 'sonner';
import {
  Users, BookOpen, School, TrendingUp, BarChart3, PieChart as PieChartIcon,
  Plus, Save, Trash2, Edit, Eye, GripVertical, Play, FileText, HelpCircle,
  CreditCard, IndianRupee, Calendar, Check, X, Clock, Zap, Star, Flame,
  Activity, ArrowUpRight, ArrowDownRight, Sparkles, Settings, Search,
  Filter, Download, Upload, RefreshCw, MoreVertical, ChevronRight,
  Target, Award, Layers, Video, ListChecks, Crown, Shield, Gem,
  Building, Globe, CheckCircle2, AlertCircle, XCircle, Youtube, Presentation, LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  published: boolean;
  created_at: Date | string;
  lesson_count?: number;
  enrolled_count?: number;
  grade?: number | null;
  all_grades?: boolean;
};

type MCQQuestion = {
  question: string;
  options: string[];
  correct_answer: number;
};

type Lesson = {
  id: string;
  course_id: string;
  title: string;
  sequence_index: number;
  content_type: string;
  content_url: string;
  xp_reward: number;
  duration: number;
  mcq_questions?: MCQQuestion[];
  file_path?: string;
};

type PaymentPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: string;
  features: string[];
  max_students: number | null;
  max_courses: number | null;
  is_active: boolean;
};

type Stats = {
  totalStudents: number;
  activeStudents: number;
  totalSchools: number;
  totalCourses: number;
  totalLessons: number;
  totalXp: number;
  avgCompletion: number;
  monthlyRevenue: number;
};

type UserMetric = {
  id: string;
  full_name: string;
  school_name: string;
  total_xp: number;
  level: number;
  current_streak: number;
  lessons_completed: number;
  last_activity: string | null;
};

type CourseMetric = {
  id: string;
  title: string;
  lesson_count: number;
  enrolled_count: number;
  completion_rate: number;
  avg_score: number;
};

const CHART_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6'];

export default function SuperAdminConsole() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    activeStudents: 0,
    totalSchools: 0,
    totalCourses: 0,
    totalLessons: 0,
    totalXp: 0,
    avgCompletion: 0,
    monthlyRevenue: 0,
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [userMetrics, setUserMetrics] = useState<UserMetric[]>([]);
  const [courseMetrics, setCourseMetrics] = useState<CourseMetric[]>([]);

  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);
  const [editingPlan, setEditingPlan] = useState<Partial<PaymentPlan> | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await signOut();
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);

    const data = await fetchAllAdminData();

    const students = data.students || [];
    const schools = data.schools || [];
    const coursesData = data.courses || [];
    const lessonsData = data.lessons || [];
    const plansData = data.plans || [];
    const progressData = data.progress || [];

    const getUserLastActivity = (studentId: string) => {
      const userProgress = progressData.filter(p => p.user_id === studentId);
      if (userProgress.length === 0) return null;
      return userProgress.reduce((latest, p) => {
        const pDate = p.updated_at ? new Date(p.updated_at).getTime() : 0;
        return pDate > latest ? pDate : latest;
      }, 0);
    };

    const activeCount = students.filter(s =>
      getUserLastActivity(s.id) && getUserLastActivity(s.id)! > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length;

    const completedLessons = progressData.filter(p => p.status === 'completed').length;
    const avgCompletion = progressData.length > 0
      ? Math.round((completedLessons / progressData.length) * 100)
      : 0;

    setStats({
      totalStudents: students.length,
      activeStudents: activeCount,
      totalSchools: schools.length,
      totalCourses: coursesData.length,
      totalLessons: lessonsData.length,
      totalXp: students.reduce((a, s) => a + (s.total_xp || 0), 0),
      avgCompletion,
      monthlyRevenue: plansData.reduce((a, p) => a + (p.is_active ? Number(p.price) * 10 : 0), 0),
    });

    const coursesWithStats: Course[] = coursesData.map(c => {
      const courseLessonIds = lessonsData.filter(l => l.course_id === c.id).map(l => l.id);
      const uniqueEnrolledUsers = new Set(
        progressData
          .filter(p => courseLessonIds.includes(p.lesson_id))
          .map(p => p.user_id)
      );
      return {
        ...c,
        lesson_count: courseLessonIds.length,
        enrolled_count: uniqueEnrolledUsers.size,
      };
    });
    setCourses(coursesWithStats);

    const plans: PaymentPlan[] = plansData.map(p => ({
      ...p,
      price: Number(p.price),
      features: Array.isArray(p.features) ? p.features : [],
    }));
    setPaymentPlans(plans);

    const userMets: UserMetric[] = students.slice(0, 50).map(s => {
      const school = schools.find(sch => sch.id === s.school_id);
      const userProgress = progressData.filter(p => p.user_id === s.id);
      return {
        id: s.id,
        full_name: s.full_name,
        school_name: school?.name || 'Unassigned',
        total_xp: s.total_xp || 0,
        level: s.level || 1,
        current_streak: s.current_streak || 0,
        lessons_completed: userProgress.filter(p => p.status === 'completed').length,
        last_activity: getUserLastActivity(s.id) ? new Date(getUserLastActivity(s.id)!).toISOString() : null,
      };
    });
    setUserMetrics(userMets);

    const courseMets: CourseMetric[] = coursesData.map(c => {
      const courseLessons = lessonsData.filter(l => l.course_id === c.id);
      const courseProgress = progressData.filter(p =>
        courseLessons.some(l => l.id === p.lesson_id)
      );
      const uniqueEnrolled = new Set(courseProgress.map(p => p.user_id));
      const completed = courseProgress.filter(p => p.status === 'completed').length;
      const scores = courseProgress.filter(p => p.score != null).map(p => p.score as number);
      return {
        id: c.id,
        title: c.title,
        lesson_count: courseLessons.length,
        enrolled_count: uniqueEnrolled.size,
        completion_rate: courseProgress.length > 0 ? Math.round((completed / courseProgress.length) * 100) : 0,
        avg_score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      };
    });
    setCourseMetrics(courseMets);

    setLoading(false);
  }

  async function selectCourse(course: Course) {
    setSelectedCourse(course);
    const data = await fetchCourseLessons(course.id);
    setLessons(data as any || []);
  }

  async function saveCourse() {
    if (!editingCourse?.title) {
      toast.error('Course title is required');
      return;
    }

    try {
      await saveCourseAdmin(editingCourse);
      toast.success(editingCourse.id ? 'Course updated' : 'Course created');
    } catch (error) {
      toast.error('Failed to save course');
    }

    setShowCourseDialog(false);
    setEditingCourse(null);
    fetchAllData();
  }

  async function deleteCourse(id: string) {
    try {
      await deleteCourseAdmin(id);
      toast.success('Course deleted');
      if (selectedCourse?.id === id) {
        setSelectedCourse(null);
        setLessons([]);
      }
      fetchAllData();
    } catch (err) {
      toast.error('Failed to delete course');
    }
  }

  async function saveLesson() {
    if (!editingLesson?.title || !selectedCourse) {
      toast.error('Lesson title is required');
      return;
    }

    try {
      await saveLessonAdmin({
        ...editingLesson,
        course_id: editingLesson.course_id || selectedCourse.id,
        sequence_index: editingLesson.sequence_index ?? lessons.length
      });
      toast.success(editingLesson.id ? 'Lesson updated' : 'Lesson created');
    } catch (error) {
      toast.error('Failed to save lesson');
    }

    setShowLessonDialog(false);
    setEditingLesson(null);
    selectCourse(selectedCourse);
  }

  async function deleteLesson(id: string) {
    try {
      await deleteLessonAdmin(id);
      toast.success('Lesson deleted');
      if (selectedCourse) selectCourse(selectedCourse);
    } catch (error) {
      toast.error('Failed to delete lesson');
    }
  }

  async function saveLessonOrder() {
    if (!selectedCourse) return;
    const updates = lessons.map((lesson, index) => ({
      id: lesson.id,
      course_id: lesson.course_id,
      title: lesson.title,
      sequence_index: index,
    }));

    try {
      await saveLessonOrderAdmin(updates);
      toast.success('Order saved');
    } catch (err) {
      toast.error('Failed to save order');
    }
  }

  async function savePlan() {
    if (!editingPlan?.name) {
      toast.error('Plan name is required');
      return;
    }

    const planData = {
      name: editingPlan.name,
      description: editingPlan.description || '',
      price: editingPlan.price || 0,
      billing_cycle: editingPlan.billing_cycle || 'monthly',
      features: editingPlan.features || [],
      max_students: editingPlan.max_students,
      max_courses: editingPlan.max_courses,
      is_active: editingPlan.is_active ?? true,
    };

    try {
      await savePlanAdmin({ ...planData, id: editingPlan.id });
      toast.success(editingPlan.id ? 'Plan updated' : 'Plan created');
    } catch (error) {
      toast.error('Failed to save plan');
    }

    setShowPlanDialog(false);
    setEditingPlan(null);
    fetchAllData();
  }

  async function deletePlan(id: string) {
    try {
      await deletePlanAdmin(id);
      toast.success('Plan deleted');
      fetchAllData();
    } catch (err) {
      toast.error('Failed to delete plan');
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLessons(items => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const engagementData = [
    { name: 'Mon', students: 1240, lessons: 890 },
    { name: 'Tue', students: 1100, lessons: 750 },
    { name: 'Wed', students: 1500, lessons: 1100 },
    { name: 'Thu', students: 1280, lessons: 920 },
    { name: 'Fri', students: 1590, lessons: 1200 },
    { name: 'Sat', students: 820, lessons: 560 },
    { name: 'Sun', students: 980, lessons: 680 },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 12000 },
    { month: 'Feb', revenue: 15000 },
    { month: 'Mar', revenue: 18000 },
    { month: 'Apr', revenue: 22000 },
    { month: 'May', revenue: 28000 },
    { month: 'Jun', revenue: 32000 },
  ];

  const schoolDistribution = [
    { name: 'Enterprise', value: 35 },
    { name: 'Professional', value: 45 },
    { name: 'Starter', value: 20 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Sparkles className="w-10 h-10 text-sky-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-sky-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-100/40 rounded-full blur-3xl" />
      </div>

      <header className="relative z-50 border-b border-stone-200 bg-white/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-200">
                <Crown className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800">
                  Super Admin Console
                </h1>
                <p className="text-sm text-slate-500">Manage the entire LMS platform</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-800 hover:bg-stone-100" onClick={fetchAllData}>
                <RefreshCw size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-800 hover:bg-stone-100">
                <Settings size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-800 hover:bg-stone-100" onClick={handleLogout} title="Logout">
                <LogOut size={20} />
              </Button>
              <Avatar className="w-10 h-10 border-2 border-sky-200">
                <AvatarFallback className="bg-sky-100 text-sky-600 font-bold">SA</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-stone-200 p-1.5 rounded-2xl shadow-sm">
            <TabsTrigger value="overview" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 font-medium transition-all">
              <BarChart3 size={16} className="mr-2" />Overview
            </TabsTrigger>
            <TabsTrigger value="courses" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 font-medium transition-all">
              <BookOpen size={16} className="mr-2" />Course Builder
            </TabsTrigger>
            <TabsTrigger value="plans" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 font-medium transition-all">
              <CreditCard size={16} className="mr-2" />Payment Plans
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 font-medium transition-all">
              <Users size={16} className="mr-2" />User Metrics
            </TabsTrigger>
            <TabsTrigger value="courseMetrics" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 font-medium transition-all">
              <Target size={16} className="mr-2" />Course Metrics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Students" value={stats.totalStudents.toLocaleString()} change="+12%" trend="up" gradient="from-sky-500 to-blue-500" />
              <StatCard icon={School} label="Active Schools" value={stats.totalSchools.toString()} change="+3" trend="up" gradient="from-emerald-500 to-teal-500" />
              <StatCard icon={BookOpen} label="Total Courses" value={stats.totalCourses.toString()} change="+8" trend="up" gradient="from-amber-500 to-orange-500" />
              <StatCard icon={IndianRupee} label="Monthly Revenue" value={`₹${stats.monthlyRevenue.toLocaleString()}`} change="+24%" trend="up" gradient="from-rose-500 to-pink-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-white border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <Activity className="text-sky-500" size={20} />
                    Platform Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={engagementData}>
                        <defs>
                          <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorLessons" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                        <XAxis dataKey="name" stroke="#78716c" axisLine={false} tickLine={false} />
                        <YAxis stroke="#78716c" axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="students" stroke="#0ea5e9" fill="url(#colorStudents)" strokeWidth={2} />
                        <Area type="monotone" dataKey="lessons" stroke="#10b981" fill="url(#colorLessons)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <PieChartIcon className="text-emerald-500" size={20} />
                    Plan Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={schoolDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {schoolDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                    {schoolDistribution.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                        <span className="text-sm text-slate-600">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white border-stone-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={20} />
                  Revenue Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                      <XAxis dataKey="month" stroke="#78716c" axisLine={false} tickLine={false} />
                      <YAxis stroke="#78716c" axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`₹${value}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-white border-stone-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-800 text-lg">Courses</CardTitle>
                    <Button
                      size="sm"
                      className="bg-sky-500 hover:bg-sky-600 text-white"
                      onClick={() => {
                        setEditingCourse({ published: false, all_grades: true });
                        setShowCourseDialog(true);
                      }}
                    >
                      <Plus size={16} className="mr-1" />New
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                  {courses.map(course => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${selectedCourse?.id === course.id
                        ? 'bg-sky-50 border-2 border-sky-500'
                        : 'bg-stone-50 hover:bg-stone-100 border-2 border-transparent'
                        }`}
                      onClick={() => selectCourse(course)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
                          <BookOpen className="text-sky-600" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{course.title}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{course.lesson_count} lessons</span>
                            <span>•</span>
                            <Badge className="bg-sky-100 text-sky-600 border-0">
                              {course.all_grades ? 'All Grades' : `Class ${course.grade}`}
                            </Badge>
                            <Badge className={course.published ? 'bg-emerald-100 text-emerald-600 border-0' : 'bg-stone-100 text-stone-500 border-0'}>
                              {course.published ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-slate-400 hover:text-slate-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCourse(course);
                              setShowCourseDialog(true);
                            }}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-slate-400 hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCourse(course.id);
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 bg-white border-stone-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-slate-800 text-lg">
                        {selectedCourse ? selectedCourse.title : 'Select a Course'}
                      </CardTitle>
                      {selectedCourse && (
                        <CardDescription className="text-slate-500">
                          Drag to reorder lessons
                        </CardDescription>
                      )}
                    </div>
                    {selectedCourse && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-stone-200 text-slate-600 hover:bg-stone-50"
                          onClick={() => {
                            setEditingLesson({ content_type: 'video', xp_reward: 100, duration: 10 });
                            setShowLessonDialog(true);
                          }}
                        >
                          <Plus size={16} className="mr-1" />Add Lesson
                        </Button>
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={saveLessonOrder}>
                          <Save size={16} className="mr-1" />Save Order
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedCourse ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={lessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {lessons.map((lesson, index) => (
                            <SortableLessonItem
                              key={lesson.id}
                              lesson={lesson}
                              index={index}
                              onEdit={() => {
                                setEditingLesson(lesson);
                                setShowLessonDialog(true);
                              }}
                              onDelete={() => deleteLesson(lesson.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-slate-400">
                      <div className="text-center">
                        <Layers size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Select a course to manage its curriculum</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Payment Plans</h2>
                <p className="text-slate-500">Manage subscription tiers for schools</p>
              </div>
              <Button
                className="bg-sky-500 hover:bg-sky-600 text-white"
                onClick={() => {
                  setEditingPlan({ billing_cycle: 'monthly', features: [], is_active: true });
                  setShowPlanDialog(true);
                }}
              >
                <Plus size={16} className="mr-2" />Create Plan
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paymentPlans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`bg-white border-stone-200 shadow-sm relative overflow-hidden hover:shadow-lg transition-shadow ${index === 1 ? 'ring-2 ring-sky-500' : ''
                    }`}>
                    {index === 1 && (
                      <div className="absolute top-0 right-0 bg-sky-500 text-white text-xs px-3 py-1 rounded-bl-lg font-semibold">
                        POPULAR
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${index === 0 ? 'bg-stone-100' : index === 1 ? 'bg-sky-100' : 'bg-amber-100'
                          }`}>
                          {index === 0 ? <Shield className="text-stone-500" size={24} /> :
                            index === 1 ? <Gem className="text-sky-600" size={24} /> :
                              <Crown className="text-amber-600" size={24} />}
                        </div>
                        <div>
                          <CardTitle className="text-slate-800">{plan.name}</CardTitle>
                          <Badge className={plan.is_active ? 'bg-emerald-100 text-emerald-600 border-0' : 'bg-red-100 text-red-600 border-0'}>
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <span className="text-4xl font-black text-slate-800">₹{plan.price}</span>
                        <span className="text-slate-500">/{plan.billing_cycle}</span>
                      </div>
                      <p className="text-sm text-slate-500">{plan.description}</p>
                      <div className="space-y-2">
                        {plan.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                            <Check size={16} className="text-emerald-500" />
                            {feature}
                          </div>
                        ))}
                        {plan.max_students && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Users size={16} className="text-sky-500" />
                            Up to {plan.max_students} students
                          </div>
                        )}
                        {plan.max_courses && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <BookOpen size={16} className="text-amber-500" />
                            Up to {plan.max_courses} courses
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          className="flex-1 border-stone-200 text-slate-600 hover:bg-stone-50"
                          onClick={() => {
                            setEditingPlan(plan);
                            setShowPlanDialog(true);
                          }}
                        >
                          <Edit size={14} className="mr-1" />Edit
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-500 hover:bg-red-50"
                          onClick={() => deletePlan(plan.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">User Metrics</h2>
                <p className="text-slate-500">Monitor student performance across all schools</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-white border-stone-200 text-slate-800 placeholder:text-slate-400"
                  />
                </div>
                <Button variant="outline" className="border-stone-200 text-slate-600 hover:bg-stone-50">
                  <Download size={16} className="mr-2" />Export
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MiniStatCard icon={Users} label="Total Users" value={stats.totalStudents} color="sky" />
              <MiniStatCard icon={Activity} label="Active (7d)" value={stats.activeStudents} color="emerald" />
              <MiniStatCard icon={Star} label="Total XP" value={stats.totalXp} color="amber" />
              <MiniStatCard icon={Target} label="Avg Completion" value={`${stats.avgCompletion}%`} color="rose" />
            </div>

            <Card className="bg-white border-stone-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className="text-left p-4 text-sm font-semibold text-slate-600">User</th>
                      <th className="text-left p-4 text-sm font-semibold text-slate-600">School</th>
                      <th className="text-left p-4 text-sm font-semibold text-slate-600">Level</th>
                      <th className="text-left p-4 text-sm font-semibold text-slate-600">XP</th>
                      <th className="text-left p-4 text-sm font-semibold text-slate-600">Streak</th>
                      <th className="text-left p-4 text-sm font-semibold text-slate-600">Lessons</th>
                      <th className="text-left p-4 text-sm font-semibold text-slate-600">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {userMetrics
                      .filter(u => u.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((user, i) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="hover:bg-stone-50"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9">
                                <AvatarFallback className="bg-sky-100 text-sky-600 text-xs font-medium">
                                  {user.full_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-slate-800">{user.full_name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-500">{user.school_name}</td>
                          <td className="p-4">
                            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white text-sm font-bold">
                              {user.level}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star size={14} fill="currentColor" />
                              <span className="font-semibold">{user.total_xp.toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 text-orange-500">
                              <Flame size={14} />
                              <span className="font-semibold">{user.current_streak}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-600">{user.lessons_completed}</td>
                          <td className="p-4 text-slate-400 text-sm">
                            {user.last_activity ? new Date(user.last_activity).toLocaleDateString() : 'Never'}
                          </td>
                        </motion.tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="courseMetrics" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Course Metrics</h2>
                <p className="text-slate-500">Analyze course performance and engagement</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MiniStatCard icon={BookOpen} label="Total Courses" value={stats.totalCourses} color="sky" />
              <MiniStatCard icon={Layers} label="Total Lessons" value={stats.totalLessons} color="emerald" />
              <MiniStatCard icon={Target} label="Avg Completion" value={`${stats.avgCompletion}%`} color="amber" />
              <MiniStatCard icon={Award} label="Courses Published" value={courses.filter(c => c.published).length} color="rose" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {courseMetrics.slice(0, 6).map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="bg-white border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
                            <BookOpen className="text-sky-600" size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800">{course.title}</h3>
                            <p className="text-sm text-slate-500">{course.lesson_count} lessons</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 rounded-xl bg-stone-50">
                          <p className="text-2xl font-bold text-slate-800">{course.enrolled_count}</p>
                          <p className="text-xs text-slate-500">Enrolled</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-emerald-50">
                          <p className="text-2xl font-bold text-emerald-600">{course.completion_rate}%</p>
                          <p className="text-xs text-slate-500">Completion</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-amber-50">
                          <p className="text-2xl font-bold text-amber-600">{course.avg_score}</p>
                          <p className="text-xs text-slate-500">Avg Score</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Completion Rate</span>
                          <span className="text-slate-800 font-medium">{course.completion_rate}%</span>
                        </div>
                        <Progress value={course.completion_rate} className="h-2 bg-stone-100" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent className="bg-white border-stone-200 text-slate-900 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-800">{editingCourse?.id ? 'Edit Course' : 'Create Course'}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {editingCourse?.id ? 'Update course details' : 'Add a new course to the platform'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Title</Label>
              <Input
                value={editingCourse?.title || ''}
                onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                className="bg-stone-50 border-stone-200"
                placeholder="Course title"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Description</Label>
              <Textarea
                value={editingCourse?.description || ''}
                onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                className="bg-stone-50 border-stone-200"
                placeholder="Course description"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Thumbnail URL</Label>
              <Input
                value={editingCourse?.thumbnail || ''}
                onChange={(e) => setEditingCourse({ ...editingCourse, thumbnail: e.target.value })}
                className="bg-stone-50 border-stone-200"
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-slate-700">Available to All Grades</Label>
                <p className="text-xs text-slate-500">Make this course available to all classes</p>
              </div>
              <Switch
                checked={editingCourse?.all_grades ?? true}
                onCheckedChange={(checked) => setEditingCourse({ ...editingCourse, all_grades: checked, grade: checked ? null : editingCourse?.grade })}
              />
            </div>
            {!editingCourse?.all_grades && (
              <div className="space-y-2">
                <Label className="text-slate-700">Select Grade</Label>
                <Select
                  value={editingCourse?.grade?.toString() || ''}
                  onValueChange={(value) => setEditingCourse({ ...editingCourse, grade: parseInt(value) })}
                >
                  <SelectTrigger className="bg-stone-50 border-stone-200 w-full">
                    <SelectValue placeholder="Select a grade" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-stone-200">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                      <SelectItem key={grade} value={grade.toString()}>
                        Class {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-slate-700">Published</Label>
                <p className="text-xs text-slate-500">Make visible to students</p>
              </div>
              <Switch
                checked={editingCourse?.published ?? false}
                onCheckedChange={(checked) => setEditingCourse({ ...editingCourse, published: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCourseDialog(false)} className="border-stone-200 text-slate-600">
              Cancel
            </Button>
            <Button onClick={saveCourse} className="bg-sky-500 hover:bg-sky-600 text-white">
              {editingCourse?.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="bg-white border-stone-200 text-slate-900 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-800">{editingLesson?.id ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {editingLesson?.id ? 'Update lesson details' : 'Add a new lesson to the course'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label className="text-slate-700">Title</Label>
              <Input
                value={editingLesson?.title || ''}
                onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                className="bg-stone-50 border-stone-200"
                placeholder="Lesson title"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Content Type</Label>
              <Select
                value={editingLesson?.content_type || 'video'}
                onValueChange={(value) => setEditingLesson({ ...editingLesson, content_type: value, mcq_questions: value === 'mcq' ? (editingLesson?.mcq_questions || [{ question: '', options: ['', '', '', ''], correct_answer: 0 }]) : undefined })}
              >
                <SelectTrigger className="bg-stone-50 border-stone-200 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-stone-200">
                  <SelectItem value="video">Video (Upload)</SelectItem>
                  <SelectItem value="youtube">YouTube Video</SelectItem>
                  <SelectItem value="ppt">PowerPoint/Slides (Upload)</SelectItem>
                  <SelectItem value="mcq">Quiz (MCQ)</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editingLesson?.content_type === 'youtube' && (
              <div className="space-y-2">
                <Label className="text-slate-700">YouTube URL</Label>
                <Input
                  value={editingLesson?.content_url || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, content_url: e.target.value })}
                  className="bg-stone-50 border-stone-200"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            )}

            {(editingLesson?.content_type === 'video' || editingLesson?.content_type === 'ppt') && (
              <div className="space-y-2">
                <Label className="text-slate-700">{editingLesson?.content_type === 'video' ? 'Video File' : 'PPT/Slides File'}</Label>
                <div className="flex items-center gap-3">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept={editingLesson?.content_type === 'video' ? 'video/*' : '.ppt,.pptx,.pdf'}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const toastId = toast.loading('Uploading file...');
                        try {
                          const formData = new FormData();
                          formData.append('file', file);

                          const response = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData,
                          });

                          if (!response.ok) throw new Error('Upload failed');
                          const { url, path } = await response.json();

                          setEditingLesson({ ...editingLesson, content_url: url, file_path: path });
                          toast.success('File uploaded successfully', { id: toastId });
                        } catch (error) {
                          console.error('Upload Error:', error);
                          toast.error('Failed to upload file', { id: toastId });
                        }
                      }}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-stone-50 border border-stone-200 cursor-pointer hover:bg-stone-100 transition-colors">
                      <Upload size={18} className="text-sky-500" />
                      <span className="text-sm text-slate-600">
                        {editingLesson?.file_path ? 'Change file' : 'Choose file to upload'}
                      </span>
                    </div>
                  </label>
                </div>
                {editingLesson?.content_url && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    File uploaded
                  </p>
                )}
              </div>
            )}

            {editingLesson?.content_type === 'mcq' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700">Questions</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-stone-200 text-slate-600 hover:bg-stone-50"
                    onClick={() => {
                      const questions = editingLesson?.mcq_questions || [];
                      setEditingLesson({
                        ...editingLesson,
                        mcq_questions: [...questions, { question: '', options: ['', '', '', ''], correct_answer: 0 }]
                      });
                    }}
                  >
                    <Plus size={14} className="mr-1" />Add Question
                  </Button>
                </div>

                {(editingLesson?.mcq_questions || []).map((q, qIndex) => (
                  <div key={qIndex} className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-sky-600">Question {qIndex + 1}</span>
                      {(editingLesson?.mcq_questions?.length || 0) > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-6 h-6 text-red-500 hover:text-red-600"
                          onClick={() => {
                            const questions = [...(editingLesson?.mcq_questions || [])];
                            questions.splice(qIndex, 1);
                            setEditingLesson({ ...editingLesson, mcq_questions: questions });
                          }}
                        >
                          <Trash2 size={12} />
                        </Button>
                      )}
                    </div>

                    <Input
                      value={q.question}
                      onChange={(e) => {
                        const questions = [...(editingLesson?.mcq_questions || [])];
                        questions[qIndex].question = e.target.value;
                        setEditingLesson({ ...editingLesson, mcq_questions: questions });
                      }}
                      className="bg-white border-stone-200"
                      placeholder="Enter question text"
                    />

                    <div className="space-y-2">
                      <span className="text-xs text-slate-500">Options (select the correct answer)</span>
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const questions = [...(editingLesson?.mcq_questions || [])];
                              questions[qIndex].correct_answer = optIndex;
                              setEditingLesson({ ...editingLesson, mcq_questions: questions });
                            }}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${q.correct_answer === optIndex
                              ? 'bg-emerald-500 text-white'
                              : 'bg-stone-200 text-slate-400 hover:bg-stone-300'
                              }`}
                          >
                            {q.correct_answer === optIndex && <Check size={14} />}
                          </button>
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const questions = [...(editingLesson?.mcq_questions || [])];
                              questions[qIndex].options[optIndex] = e.target.value;
                              setEditingLesson({ ...editingLesson, mcq_questions: questions });
                            }}
                            className="flex-1 bg-white border-stone-200"
                            placeholder={`Option ${optIndex + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {editingLesson?.content_type === 'article' && (
              <div className="space-y-2">
                <Label className="text-slate-700">Article Content URL (or paste external link)</Label>
                <Input
                  value={editingLesson?.content_url || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, content_url: e.target.value })}
                  className="bg-stone-50 border-stone-200"
                  placeholder="https://..."
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700">XP Reward</Label>
                <Input
                  type="number"
                  value={editingLesson?.xp_reward || 100}
                  onChange={(e) => setEditingLesson({ ...editingLesson, xp_reward: parseInt(e.target.value) })}
                  className="bg-stone-50 border-stone-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Duration (min)</Label>
                <Input
                  type="number"
                  value={editingLesson?.duration || 10}
                  onChange={(e) => setEditingLesson({ ...editingLesson, duration: parseInt(e.target.value) })}
                  className="bg-stone-50 border-stone-200"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLessonDialog(false)} className="border-stone-200 text-slate-600">
              Cancel
            </Button>
            <Button onClick={saveLesson} className="bg-sky-500 hover:bg-sky-600 text-white">
              {editingLesson?.id ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="bg-white border-stone-200 text-slate-900 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-800">{editingPlan?.id ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {editingPlan?.id ? 'Update payment plan details' : 'Create a new subscription plan'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Plan Name</Label>
              <Input
                value={editingPlan?.name || ''}
                onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                className="bg-stone-50 border-stone-200"
                placeholder="e.g., Professional"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Description</Label>
              <Textarea
                value={editingPlan?.description || ''}
                onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                className="bg-stone-50 border-stone-200"
                placeholder="Plan description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Price (₹)</Label>
                <Input
                  type="number"
                  value={editingPlan?.price || 0}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                  className="bg-stone-50 border-stone-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Billing Cycle</Label>
                <Select
                  value={editingPlan?.billing_cycle || 'monthly'}
                  onValueChange={(value) => setEditingPlan({ ...editingPlan, billing_cycle: value })}
                >
                  <SelectTrigger className="bg-stone-50 border-stone-200 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-stone-200">
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Max Students</Label>
                <Input
                  type="number"
                  value={editingPlan?.max_students || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, max_students: e.target.value ? parseInt(e.target.value) : null })}
                  className="bg-stone-50 border-stone-200"
                  placeholder="Unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Max Courses</Label>
                <Input
                  type="number"
                  value={editingPlan?.max_courses || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, max_courses: e.target.value ? parseInt(e.target.value) : null })}
                  className="bg-stone-50 border-stone-200"
                  placeholder="Unlimited"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Features (comma separated)</Label>
              <Textarea
                value={editingPlan?.features?.join(', ') || ''}
                onChange={(e) => setEditingPlan({ ...editingPlan, features: e.target.value.split(',').map(f => f.trim()).filter(Boolean) })}
                className="bg-stone-50 border-stone-200"
                placeholder="Feature 1, Feature 2, Feature 3"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-slate-700">Active</Label>
              <Switch
                checked={editingPlan?.is_active ?? true}
                onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)} className="border-stone-200 text-slate-600">
              Cancel
            </Button>
            <Button onClick={savePlan} className="bg-sky-500 hover:bg-sky-600 text-white">
              {editingPlan?.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, change, trend, gradient }: { icon: any; label: string; value: string; change: string; trend: 'up' | 'down'; gradient: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-white border-stone-200 shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
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

function MiniStatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  const colors: Record<string, string> = {
    sky: 'from-sky-500 to-blue-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-500 to-pink-500',
  };

  return (
    <Card className="bg-white border-stone-200 shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
          <Icon className="text-white" size={18} />
        </div>
        <div>
          <p className="text-xl font-bold text-slate-800">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SortableLessonItem({ lesson, index, onEdit, onDelete }: { lesson: Lesson; index: number; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = lesson.content_type === 'video' ? Video :
    lesson.content_type === 'youtube' ? Youtube :
      lesson.content_type === 'ppt' ? Presentation :
        lesson.content_type === 'mcq' ? ListChecks :
          FileText;

  const iconBg = lesson.content_type === 'video' ? 'bg-blue-100 text-blue-600' :
    lesson.content_type === 'youtube' ? 'bg-red-100 text-red-600' :
      lesson.content_type === 'ppt' ? 'bg-amber-100 text-amber-600' :
        lesson.content_type === 'mcq' ? 'bg-orange-100 text-orange-600' :
          'bg-purple-100 text-purple-600';

  const typeLabel = lesson.content_type === 'youtube' ? 'YouTube' :
    lesson.content_type === 'ppt' ? 'Slides' :
      lesson.content_type.toUpperCase();

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 hover:border-stone-300 transition-colors flex items-center gap-4">
        <div {...listeners} className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
          <GripVertical size={20} />
        </div>

        <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-xs font-bold text-white">
          {index + 1}
        </div>

        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon size={20} />
        </div>

        <div className="flex-1">
          <p className="font-semibold text-slate-800">{lesson.title}</p>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{typeLabel}</span>
            <span>•</span>
            <span>{lesson.duration} min</span>
            <span>•</span>
            <span className="text-amber-600">{lesson.xp_reward} XP</span>
          </div>
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-slate-700" onClick={onEdit}>
            <Edit size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-red-500" onClick={onDelete}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
