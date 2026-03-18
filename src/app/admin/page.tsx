import React, { Suspense } from 'react';
import { SuperAdminDashboard } from '@/modules/super-admin/components/super-admin-dashboard';

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b] flex items-center justify-center font-black uppercase tracking-widest text-slate-500">Initializing Core...</div>}>
      <SuperAdminDashboard />
    </Suspense>
  );
}
