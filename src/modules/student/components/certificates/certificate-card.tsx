'use client';

import React, { useRef, useState } from 'react';
import { StudentCertificate } from '@/modules/student/actions/certificate-actions';
import { CertificateTemplate } from '../certificate-template';
import { Download, Eye, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface CertificateCardProps {
  certificate: StudentCertificate;
  index: number;
}

export function CertificateCard({ certificate, index }: CertificateCardProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;

    setIsDownloading(true);
    try {
      const element = certificateRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, (pdfHeight - imgHeight) / 2, imgWidth, imgHeight);
      pdf.save(`${certificate.course_title.replace(/\s+/g, '_')}_Certificate.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to download certificate. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const formattedDate = typeof certificate.issued_at === 'string'
    ? format(new Date(certificate.issued_at), 'MMM d, yyyy')
    : format(certificate.issued_at, 'MMM d, yyyy');

  const COLORS = [
    { accent: 'from-indigo-600 to-purple-600', bg: 'bg-indigo-50', badge: 'bg-indigo-100 text-indigo-700' },
    { accent: 'from-emerald-600 to-teal-600', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700' },
    { accent: 'from-rose-600 to-pink-600', bg: 'bg-rose-50', badge: 'bg-rose-100 text-rose-700' },
    { accent: 'from-amber-600 to-orange-600', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
    { accent: 'from-sky-600 to-blue-600', bg: 'bg-sky-50', badge: 'bg-sky-100 text-sky-700' },
    { accent: 'from-violet-600 to-purple-600', bg: 'bg-violet-50', badge: 'bg-violet-100 text-violet-700' },
  ];

  const color = COLORS[index % COLORS.length];

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        className="group h-full"
      >
        <div className={`${color.bg} rounded-2xl overflow-hidden border border-slate-200 h-full flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-300`}>
          {/* Header with gradient background */}
          <div className={`bg-gradient-to-r ${color.accent} p-6 text-white`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-black text-lg sm:text-xl leading-tight mb-2 line-clamp-2">
                  {certificate.certificate_title}
                </h3>
                <p className="text-sm text-white/80 font-medium line-clamp-1">
                  {certificate.course_title}
                </p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col flex-1">
            {/* Date */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Awarded
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {formattedDate}
              </p>
            </div>

            {/* Verification code */}
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Verification Code
              </p>
              <p className="text-xs sm:text-sm font-mono font-bold text-slate-900 break-all">
                {certificate.verification_code}
              </p>
            </div>

            {/* Description if available */}
            {certificate.certificate_description && (
              <div className="mb-6 flex-1">
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                  {certificate.certificate_description}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-auto pt-4 border-t border-slate-200">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPreviewOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold text-sm"
              >
                <Eye size={16} />
                <span className="hidden sm:inline">View</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/30 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span className="hidden sm:inline">Downloading</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span className="hidden sm:inline">Download</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-auto relative"
          >
            {/* Close button */}
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="sticky top-4 right-4 z-10 ml-auto flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg hover:bg-slate-50 transition-colors border border-slate-200"
            >
              <span className="text-xl">×</span>
            </button>

            {/* Certificate content */}
            <div className="flex justify-center p-6 bg-slate-50">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <CertificateTemplate
                  ref={certificateRef}
                  studentName={certificate.student_name}
                  certificateTitle={certificate.certificate_title}
                  courseTitle={certificate.course_title}
                  verificationCode={certificate.verification_code}
                  issuedDate={certificate.issued_at}
                />
              </div>
            </div>

            {/* Download button at bottom */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-6 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-semibold"
              >
                Close
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download Certificate
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
