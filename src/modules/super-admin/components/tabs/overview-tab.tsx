'use client';

import React from 'react';
import { Users, School, BookOpen, IndianRupee } from 'lucide-react';
import { StatCard } from '../stats-card';
import { EngagementCharts } from '../engagement-charts';
import { Stats, PaymentPlan } from '../../types';

interface OverviewTabProps {
    stats: Stats;
    paymentPlans: PaymentPlan[];
}

export function OverviewTab({ stats, paymentPlans }: OverviewTabProps) {
    const engagementData = [
        { name: 'Students', students: stats.totalStudents, lessons: stats.totalLessons },
        { name: 'Active', students: stats.activeStudents, lessons: stats.avgCompletion },
        { name: 'Enrolled', students: stats.totalEnrollments, lessons: stats.totalCourses },
    ];

    const revenueData = [
        { month: 'Total Revenue', revenue: stats.totalRevenue },
        { month: 'Active Subs', revenue: stats.activeSubscriptions * 10000 },
    ];

    const planDistribution = paymentPlans.length > 0
        ? paymentPlans.map(p => ({ name: p.name, value: p.is_active ? 1 : 0 }))
        : [{ name: 'No Plans', value: 1 }];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Students" value={stats.totalStudents.toLocaleString()} change={`${stats.activeStudents} active`} trend="up" gradient="from-sky-500 to-blue-500" />
                <StatCard icon={School} label="Active Schools" value={`${stats.activeSchools}/${stats.totalSchools}`} change={`${stats.activeSubscriptions} subs`} trend="up" gradient="from-emerald-500 to-teal-500" />
                <StatCard icon={BookOpen} label="Total Courses" value={stats.totalCourses.toString()} change={`${stats.totalEnrollments} enrollments`} trend="up" gradient="from-amber-500 to-orange-500" />
                <StatCard icon={IndianRupee} label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} change={`${stats.activeSubscriptions} active subs`} trend="up" gradient="from-rose-500 to-pink-500" />
            </div>

            <EngagementCharts
                engagementData={engagementData}
                planDistribution={planDistribution}
                revenueData={revenueData}
            />
        </div>
    );
}
