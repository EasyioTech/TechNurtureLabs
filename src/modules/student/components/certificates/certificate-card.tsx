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
}

export function CertificateCard({ certificate }: CertificateCardProps) {
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

    return (
        <>
            <motion.div
                whileHover={{ y: -2 }}
                className="group h-full"
            >
                <div className="bg-white rounded-lg overflow-hidden border border-slate-200 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow duration-300">
                    {/* Header - Minimal design */}
                    <div className="bg-white p-6 border-b border-slate-200">
                        <div className="flex-1 mb-4">
                            <h3 className="font-serif text-lg font-normal leading-tight mb-1 text-slate-900">
                                {certificate.certificate_title}
                            </h3>
                            <p className="text-sm text-slate-600 font-normal">
                                {certificate.course_title}
                            </p>
                        </div>
                        <div className="text-2xl">📜</div>
                    </div>

                    {/* Body */}
                    <div className="p-6 flex flex-col flex-1">
                        {/* Date */}
                        <div className="mb-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                                Awarded
                            </p>
                            <p className="text-sm font-normal text-slate-900">
                                {formattedDate}
                            </p>
                        </div>

                        {/* Verification code */}
                        <div className="mb-6 p-3 bg-slate-50 rounded border border-slate-200">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                Verification Code
                            </p>
                            <p className="text-xs font-mono text-slate-900 break-all">
                                {certificate.verification_code}
                            </p>
                        </div>

                        {/* Description if available */}
                        {certificate.certificate_description && (
                            <div className="mb-6 flex-1">
                                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
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
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition-colors font-semibold text-sm"
                            >
                                <Eye size={14} />
                                <span className="hidden sm:inline">View</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleDownloadPDF}
                                disabled={isDownloading}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDownloading ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        <span className="hidden sm:inline">Downloading</span>
                                    </>
                                ) : (
                                    <>
                                        <Download size={14} />
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
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setIsPreviewOpen(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col relative"
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setIsPreviewOpen(false)}
                            className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg hover:bg-slate-50 transition-colors border border-slate-200"
                        >
                            <span className="text-xl">×</span>
                        </button>

                        {/* Certificate content - landscape */}
                        <div className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4 bg-slate-100">
                            <div className="bg-white w-full" style={{ aspectRatio: '1400/750', maxHeight: '85vh' }}>
                                <div style={{ transform: 'scale(1)', width: '100%', height: '100%', transformOrigin: 'top center' }}>
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
                        </div>

                        {/* Download button at bottom */}
                        <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setIsPreviewOpen(false)}
                                className="px-6 py-2 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-semibold text-sm"
                            >
                                Close
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleDownloadPDF}
                                disabled={isDownloading}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
