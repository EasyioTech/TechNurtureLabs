'use client';

import React, { useRef, useState } from 'react';
import { CertificateTemplate } from './certificate-template';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Eye, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CertificateViewerProps {
    studentName: string;
    certificateTitle: string;
    courseTitle: string;
    verificationCode: string;
    issuedDate: Date | string;
    schoolName?: string;
}

export function CertificateViewer({
    studentName,
    certificateTitle,
    courseTitle,
    verificationCode,
    issuedDate,
    schoolName,
}: CertificateViewerProps) {
    const certificateRef = useRef<HTMLDivElement>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
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
            pdf.save(`${courseTitle.replace(/\s+/g, '_')}_Certificate.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to download certificate. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="w-full">
            {/* Action buttons */}
            <div className="flex items-center gap-3">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsViewerOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors font-semibold text-sm"
                >
                    <Eye size={16} />
                    View
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isDownloading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Downloading...
                        </>
                    ) : (
                        <>
                            <Download size={16} />
                            Download
                        </>
                    )}
                </motion.button>
            </div>

            {/* Certificate Preview Modal */}
            <AnimatePresence>
                {isViewerOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsViewerOpen(false)}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
                                onClick={() => setIsViewerOpen(false)}
                                className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg hover:bg-slate-50 transition-colors border border-slate-200"
                            >
                                <X size={20} className="text-slate-600" />
                            </button>

                            {/* Certificate content - proper landscape - responsive */}
                            <div className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4 bg-slate-100">
                                <div className="bg-white w-full" style={{ aspectRatio: '1400/750', maxHeight: '85vh' }}>
                                    <div style={{ transform: 'scale(1)', width: '100%', height: '100%', transformOrigin: 'top center' }}>
                                        <CertificateTemplate
                                            ref={certificateRef}
                                            studentName={studentName}
                                            certificateTitle={certificateTitle}
                                            courseTitle={courseTitle}
                                            verificationCode={verificationCode}
                                            issuedDate={issuedDate}
                                            schoolName={schoolName}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons at bottom */}
                            <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setIsViewerOpen(false)}
                                    className="px-6 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-semibold"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleDownloadPDF}
                                    disabled={isDownloading}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDownloading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={16} />
                                            Download PDF
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
