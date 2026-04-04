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
                whileHover={{ y: -4 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative h-full"
            >
                {/* Decoration Glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-3xl blur opacity-0 group-hover:opacity-10 transition duration-500" />

                <div className="relative bg-white rounded-3xl overflow-hidden border border-slate-100 h-full flex flex-col shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                    {/* Header Part - Visual Representation */}
                    <div className="relative h-48 bg-slate-950 overflow-hidden group-hover:scale-[1.01] transition-transform duration-500">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full -mr-10 -mt-10 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full -ml-10 -mb-10 blur-2xl" />

                        {/* Top Badge */}
                        <div className="absolute top-4 right-4 z-10">
                            <span className="bg-indigo-500/20 backdrop-blur-md border border-white/10 text-indigo-200 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                Certified
                            </span>
                        </div>

                        {/* Visual Layout inside the black header */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-16 h-16 mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden group/icon">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover/icon:opacity-100 transition-opacity" />
                                <Loader2 className="text-indigo-400 group-hover:rotate-12 transition-transform duration-500" size={32} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-white font-black text-sm uppercase tracking-tighter line-clamp-2 max-w-[200px]">
                                {certificate.certificate_title}
                            </h3>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 flex flex-col flex-1">
                        <div className="mb-6 flex justify-between items-start">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                    <Award size={10} className="fill-current" /> Mastery Achievement
                                </p>
                                <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight line-clamp-1">
                                    {certificate.course_title}
                                </h4>
                            </div>
                        </div>

                        {/* Stats / Meta Info Row */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Issue Date</p>
                                <p className="text-xs font-black text-slate-700">{formattedDate}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cred ID</p>
                                <p className="text-[10px] font-mono text-slate-700 truncate">{certificate.verification_code}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2.5 mt-auto">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsPreviewOpen(true)}
                                className="flex-1 h-11 flex items-center justify-center gap-2 px-4 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl transition-all font-bold text-xs border border-transparent hover:border-slate-200 uppercase tracking-tight"
                            >
                                <Eye size={16} />
                                View
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleDownloadPDF}
                                disabled={isDownloading}
                                className="flex-1 h-11 flex items-center justify-center gap-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all font-bold text-xs shadow-lg shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-tight"
                            >
                                {isDownloading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Download size={16} />
                                )}
                                {isDownloading ? 'Working...' : 'Save PDF'}
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
