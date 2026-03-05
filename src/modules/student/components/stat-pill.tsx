'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function QuickStatCard({ icon: Icon, value, label }: any) {
    return (
        <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-slate-600" />
                </div>
                <div>
                    <p className="text-lg font-bold text-slate-800">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}
