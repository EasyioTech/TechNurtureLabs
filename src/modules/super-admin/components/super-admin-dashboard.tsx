'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Users, BookOpen, BarChart3, CreditCard, Target,
    Crown, RefreshCw, Settings, LogOut, Sparkles, Building,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useAdminData } from '../hooks/use-admin-data';
import { MetricTables } from './metric-tables';
import { OverviewTab } from './tabs/overview-tab';
import { CourseBuilderTab } from './tabs/course-builder-tab';
import { PaymentPlansTab } from './tabs/payment-plans-tab';
import { SchoolsTab } from './tabs/schools-tab';

export function SuperAdminDashboard() {
    const { signOut } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const data = useAdminData();

    if (data.loading) {
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

            {/* Header */}
            <header className="relative z-50 border-b border-stone-200 bg-white/80 backdrop-blur-xl sticky top-0">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-200">
                                <Crown className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-slate-800">Super Admin Console</h1>
                                <p className="text-sm text-slate-500">Manage the entire LMS platform</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-800 hover:bg-stone-100" onClick={data.fetchAllData}>
                                <RefreshCw size={20} />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-800 hover:bg-stone-100">
                                <Settings size={20} />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-800 hover:bg-stone-100" onClick={() => signOut()} title="Logout">
                                <LogOut size={20} />
                            </Button>
                            <Avatar className="w-10 h-10 border-2 border-sky-200">
                                <AvatarFallback className="bg-sky-100 text-sky-600 font-bold">SA</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
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
                        <TabsTrigger value="schools" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 font-medium transition-all">
                            <Building size={16} className="mr-2" />Schools
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <OverviewTab stats={data.stats} paymentPlans={data.paymentPlans} />
                    </TabsContent>

                    <TabsContent value="courses" className="space-y-6">
                        <CourseBuilderTab
                            courses={data.courses}
                            selectedCourse={data.selectedCourse}
                            lessons={data.lessons}
                            setLessons={data.setLessons}
                            onSelectCourse={data.selectCourse}
                            onSaveCourse={data.saveCourse}
                            onDeleteCourse={data.deleteCourse}
                            onSaveLesson={data.saveLesson}
                            onDeleteLesson={data.deleteLesson}
                            onSaveLessonOrder={data.saveLessonOrder}
                            showCourseDialog={data.showCourseDialog}
                            setShowCourseDialog={data.setShowCourseDialog}
                            editingCourse={data.editingCourse}
                            setEditingCourse={data.setEditingCourse}
                            showLessonDialog={data.showLessonDialog}
                            setShowLessonDialog={data.setShowLessonDialog}
                            editingLesson={data.editingLesson}
                            setEditingLesson={data.setEditingLesson}
                        />
                    </TabsContent>

                    <TabsContent value="plans" className="space-y-6">
                        <PaymentPlansTab
                            paymentPlans={data.paymentPlans}
                            onSavePlan={data.savePlan}
                            onDeletePlan={data.deletePlan}
                            showPlanDialog={data.showPlanDialog}
                            setShowPlanDialog={data.setShowPlanDialog}
                            editingPlan={data.editingPlan}
                            setEditingPlan={data.setEditingPlan}
                        />
                    </TabsContent>

                    <TabsContent value="users" className="pt-6">
                        <MetricTables userMetrics={data.userMetrics} courseMetrics={[]} />
                    </TabsContent>

                    <TabsContent value="courseMetrics" className="pt-6">
                        <MetricTables userMetrics={[]} courseMetrics={data.courseMetrics} />
                    </TabsContent>

                    <TabsContent value="schools" className="space-y-6">
                        <SchoolsTab
                            stats={data.stats}
                            schoolsList={data.schoolsList}
                            onToggleStatus={data.toggleSchoolStatus}
                        />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
