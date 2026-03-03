'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Building, CheckCircle2, CreditCard, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { Stats, SchoolInfo } from '../../types';

interface SchoolsTabProps {
    stats: Stats;
    schoolsList: SchoolInfo[];
    onToggleStatus: (schoolId: string, isActive: boolean) => void;
}

export function SchoolsTab({ stats, schoolsList, onToggleStatus }: SchoolsTabProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Schools Management</h2>
                    <p className="text-slate-500">Monitor and manage registered schools</p>
                </div>
                <Badge className="bg-sky-100 text-sky-600 border-0 text-sm px-3 py-1">
                    {schoolsList.length} registered
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-white border-stone-200 shadow-sm p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="text-emerald-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.activeSchools}</p>
                            <p className="text-xs text-slate-500">Active Schools</p>
                        </div>
                    </div>
                </Card>
                <Card className="bg-white border-stone-200 shadow-sm p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                            <CreditCard className="text-sky-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.activeSubscriptions}</p>
                            <p className="text-xs text-slate-500">Active Subscriptions</p>
                        </div>
                    </div>
                </Card>
                <Card className="bg-white border-stone-200 shadow-sm p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <IndianRupee className="text-amber-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">₹{stats.totalRevenue.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">Total Revenue</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="bg-white border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-stone-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-4 py-3 text-left">School</th>
                                <th className="px-4 py-3 text-left">Location</th>
                                <th className="px-4 py-3 text-center">Students</th>
                                <th className="px-4 py-3 text-center">Plan</th>
                                <th className="px-4 py-3 text-center">Subscription</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {schoolsList.map(school => (
                                <tr key={school.id} className="hover:bg-sky-50/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-semibold text-slate-700">{school.name}</p>
                                            <p className="text-xs text-slate-400">{school.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">
                                        {[school.city, school.state].filter(Boolean).join(', ') || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold text-slate-700">{school.student_count}</td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge className="bg-sky-50 text-sky-600 border-0">{school.plan_name || 'No Plan'}</Badge>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge className={
                                            school.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-600 border-0' :
                                                school.subscription_status === 'trialing' ? 'bg-amber-100 text-amber-600 border-0' :
                                                    'bg-stone-100 text-stone-500 border-0'
                                        }>
                                            {school.subscription_status || 'None'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge className={school.is_active ? 'bg-emerald-100 text-emerald-600 border-0' : 'bg-red-100 text-red-600 border-0'}>
                                            {school.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Switch
                                            checked={school.is_active}
                                            onCheckedChange={(val) => onToggleStatus(school.id, val)}
                                        />
                                    </td>
                                </tr>
                            ))}
                            {schoolsList.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                                        <Building size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>No schools registered yet</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
