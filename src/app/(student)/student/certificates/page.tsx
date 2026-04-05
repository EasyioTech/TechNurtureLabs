import React from 'react';
import { getStudentCertificates } from '@/modules/student/actions/certificate-actions';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CertificatesClient } from '@/modules/student/components/certificates/certificates-client';
import { Award } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CertificatesPage() {
  const session = await verifySession();
  if (!session || session.userType !== 'student') {
    redirect('/login');
  }

  const certificates = await getStudentCertificates();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Award size={24} className="text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              My Certificates
            </h1>
          </div>
          <p className="text-slate-600 text-sm sm:text-base">
            {certificates.length === 0
              ? 'Start completing courses to earn your first certificate'
              : `You have earned ${certificates.length} certificate${certificates.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {certificates.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6">
              <Award size={40} className="text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Certificates Yet</h2>
            <p className="text-slate-600 max-w-md mb-6">
              Complete your first course to earn your certificate. Each completed course unlocks a new achievement.
            </p>
            <a
              href="/student"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              View Courses
            </a>
          </div>
        ) : (
          <CertificatesClient certificates={certificates} />
        )}
      </div>
    </div>
  );
}
