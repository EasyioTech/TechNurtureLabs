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
import { fetchAllAdminData, fetchCourseLessons, saveCourseAdmin, deleteCourseAdmin, saveLessonAdmin, deleteLessonAdmin, saveLessonOrderAdmin, savePlanAdmin, deletePlanAdmin } from '@/modules/super-admin/actions';
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
import { StatCard, MiniStatCard } from '@/modules/super-admin/components/stats-card';
import { EngagementCharts } from '@/modules/super-admin/components/engagement-charts';
import { SortableLessonItem } from '@/modules/super-admin/components/lesson-item-sortable';
import { CourseDialog } from '@/modules/super-admin/components/course-dialog';
import { LessonDialog } from '@/modules/super-admin/components/lesson-dialog';
import { PaymentPlanDialog } from '@/modules/super-admin/components/plan-dialog';
import { MetricTables } from '@/modules/super-admin/components/metric-tables';
import {
  Course, Lesson, PaymentPlan, Stats, UserMetric, CourseMetric
} from '@/modules/super-admin/types';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';

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

            <EngagementCharts
              engagementData={engagementData}
              planDistribution={schoolDistribution}
              revenueData={revenueData}
            />
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

          <TabsContent value="users" className="pt-6">
            <MetricTables userMetrics={userMetrics} courseMetrics={[]} />
          </TabsContent>

          <TabsContent value="courseMetrics" className="pt-6">
            <MetricTables userMetrics={[]} courseMetrics={courseMetrics} />
          </TabsContent>
        </Tabs>
      </main>

      <CourseDialog
        open={showCourseDialog}
        onOpenChange={setShowCourseDialog}
        editingCourse={editingCourse}
        setEditingCourse={setEditingCourse}
        onSave={saveCourse}
      />

      <LessonDialog
        open={showLessonDialog}
        onOpenChange={setShowLessonDialog}
        editingLesson={editingLesson}
        setEditingLesson={setEditingLesson}
        onSave={saveLesson}
      />

      <PaymentPlanDialog
        open={showPlanDialog}
        onOpenChange={setShowPlanDialog}
        editingPlan={editingPlan}
        setEditingPlan={setEditingPlan}
        onSave={savePlan}
      />
    </div>
  );
}


