'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminTheme, t } from '../theme-context';
import type { CompletedStudent, CourseWithCert } from '../actions/sub-actions/certificate-actions';

interface CertificatePreviewProps {
    student: CompletedStudent;
    course: CourseWithCert;
    onClose: () => void;
}

// ── The actual printable certificate (no Tailwind – raw inline styles for print fidelity) ──
function CertificateDocument({
    student,
    course,
    platformName = 'TechNurture LMS',
}: {
    student: CompletedStudent;
    course: CourseWithCert;
    platformName?: string;
}) {
    const completedDate = student.completed_at
        ? new Date(student.completed_at).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
          })
        : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const certTitle = course.certificate?.title || 'Certificate of Completion';
    const certDesc =
        course.certificate?.description ||
        `This certifies that the above-named student has successfully completed all required lessons and assessments for this course.`;

    return (
        <div
            id="certificate-document"
            style={{
                width: '1122px',       // A4 landscape @ 96dpi
                height: '794px',
                position: 'relative',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0f172a 100%)',
                fontFamily: "'Georgia', 'Palatino Linotype', serif",
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
            }}
        >
            {/* ── Decorative Background Shapes ── */}
            {/* Gold arc top-right */}
            <div style={{
                position: 'absolute', top: -120, right: -120,
                width: 400, height: 400,
                borderRadius: '50%',
                border: '2px solid rgba(251,191,36,0.15)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', top: -60, right: -60,
                width: 280, height: 280,
                borderRadius: '50%',
                border: '1px solid rgba(251,191,36,0.08)',
                pointerEvents: 'none',
            }} />
            {/* Gold arc bottom-left */}
            <div style={{
                position: 'absolute', bottom: -120, left: -120,
                width: 400, height: 400,
                borderRadius: '50%',
                border: '2px solid rgba(251,191,36,0.12)',
                pointerEvents: 'none',
            }} />

            {/* ── Outer Gold Border Frame ── */}
            <div style={{
                position: 'absolute', inset: 18,
                border: '2px solid rgba(251,191,36,0.45)',
                borderRadius: 16,
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', inset: 26,
                border: '0.5px solid rgba(251,191,36,0.18)',
                borderRadius: 12,
                pointerEvents: 'none',
            }} />

            {/* ── Corner Ornaments ── */}
            {[
                { top: 24, left: 24 },
                { top: 24, right: 24 },
                { bottom: 24, left: 24 },
                { bottom: 24, right: 24 },
            ].map((pos, i) => (
                <div key={i} style={{
                    position: 'absolute', ...pos,
                    width: 32, height: 32,
                    borderTop: i < 2 ? '2px solid rgba(251,191,36,0.6)' : undefined,
                    borderBottom: i >= 2 ? '2px solid rgba(251,191,36,0.6)' : undefined,
                    borderLeft: (i === 0 || i === 2) ? '2px solid rgba(251,191,36,0.6)' : undefined,
                    borderRight: (i === 1 || i === 3) ? '2px solid rgba(251,191,36,0.6)' : undefined,
                    borderRadius: i === 0 ? '4px 0 0 0' : i === 1 ? '0 4px 0 0' : i === 2 ? '0 0 0 4px' : '0 0 4px 0',
                    pointerEvents: 'none',
                }} />
            ))}

            {/* ── Main Content ── */}
            <div style={{
                position: 'relative', zIndex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center',
                padding: '48px 80px 36px',
                flex: 1,
                textAlign: 'center',
            }}>
                {/* Platform name top */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
                }}>
                    <div style={{
                        width: 36, height: 1,
                        background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.6))',
                    }} />
                    <p style={{
                        color: 'rgba(251,191,36,0.8)',
                        fontSize: 11,
                        letterSpacing: '0.35em',
                        fontFamily: "'Helvetica Neue', Arial, sans-serif",
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        margin: 0,
                    }}>
                        {platformName}
                    </p>
                    <div style={{
                        width: 36, height: 1,
                        background: 'linear-gradient(90deg, rgba(251,191,36,0.6), transparent)',
                    }} />
                </div>

                {/* Main title */}
                <h1 style={{
                    margin: 0,
                    fontSize: 46,
                    fontWeight: 700,
                    color: '#fbbf24',
                    letterSpacing: '-0.5px',
                    lineHeight: 1.1,
                    fontFamily: "'Georgia', serif",
                    textShadow: '0 0 40px rgba(251,191,36,0.3)',
                }}>
                    {certTitle}
                </h1>

                {/* Decorative divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 18, marginBottom: 22 }}>
                    <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.4))' }} />
                    <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'rgba(251,191,36,0.7)',
                        boxShadow: '0 0 8px rgba(251,191,36,0.5)',
                    }} />
                    <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(251,191,36,0.4), transparent)' }} />
                </div>

                {/* Presented to */}
                <p style={{
                    margin: 0,
                    color: 'rgba(255,255,255,0.55)',
                    fontSize: 13,
                    letterSpacing: '0.2em',
                    fontFamily: "'Helvetica Neue', Arial, sans-serif",
                    textTransform: 'uppercase',
                    fontWeight: 600,
                }}>
                    This is proudly presented to
                </p>

                {/* Student name */}
                <h2 style={{
                    margin: '10px 0 4px',
                    fontSize: 48,
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '-1px',
                    lineHeight: 1,
                    fontFamily: "'Georgia', serif",
                    textShadow: '0 2px 20px rgba(255,255,255,0.1)',
                }}>
                    {student.full_name}
                </h2>

                {/* School */}
                <p style={{
                    margin: '4px 0 0',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: 13,
                    fontFamily: "'Helvetica Neue', Arial, sans-serif",
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                }}>
                    {student.school_name}
                </p>

                {/* Description */}
                <div style={{
                    marginTop: 18,
                    padding: '14px 40px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    maxWidth: 620,
                }}>
                    <p style={{
                        margin: 0,
                        color: 'rgba(255,255,255,0.45)',
                        fontSize: 12.5,
                        lineHeight: 1.7,
                        fontFamily: "'Georgia', serif",
                        fontStyle: 'italic',
                    }}>
                        {certDesc}
                    </p>
                </div>

                {/* Course name */}
                <div style={{
                    marginTop: 14,
                    padding: '6px 24px',
                    background: 'rgba(251,191,36,0.08)',
                    border: '1px solid rgba(251,191,36,0.25)',
                    borderRadius: 8,
                }}>
                    <p style={{
                        margin: 0,
                        color: '#fbbf24',
                        fontSize: 15,
                        fontWeight: 700,
                        fontFamily: "'Helvetica Neue', Arial, sans-serif",
                        letterSpacing: '0.04em',
                    }}>
                        {course.title}
                    </p>
                </div>

                {/* Footer row */}
                <div style={{
                    marginTop: 'auto',
                    paddingTop: 20,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                }}>
                    {/* Date */}
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ width: 120, height: 1, background: 'rgba(255,255,255,0.2)', marginBottom: 8 }} />
                        <p style={{
                            margin: 0,
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: 13,
                            fontFamily: "'Helvetica Neue', Arial, sans-serif",
                            fontWeight: 600,
                        }}>
                            {completedDate}
                        </p>
                        <p style={{
                            margin: '2px 0 0',
                            color: 'rgba(255,255,255,0.35)',
                            fontSize: 10,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            fontFamily: "'Helvetica Neue', Arial, sans-serif",
                        }}>
                            Date of Completion
                        </p>
                    </div>

                    {/* Seal / Logo */}
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            border: '2px solid rgba(251,191,36,0.5)',
                            background: 'rgba(251,191,36,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(251,191,36,0.15)',
                        }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6L12 2z"
                                    fill="rgba(251,191,36,0.8)" />
                            </svg>
                        </div>
                    </div>

                    {/* Signature area */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ width: 120, height: 1, background: 'rgba(255,255,255,0.2)', marginBottom: 8, marginLeft: 'auto' }} />
                        <p style={{
                            margin: 0,
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: 13,
                            fontFamily: "'Helvetica Neue', Arial, sans-serif",
                            fontWeight: 600,
                        }}>
                            {platformName}
                        </p>
                        <p style={{
                            margin: '2px 0 0',
                            color: 'rgba(255,255,255,0.35)',
                            fontSize: 10,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            fontFamily: "'Helvetica Neue', Arial, sans-serif",
                        }}>
                            Authorised Signature
                        </p>
                    </div>
                </div>

                {/* Verification code */}
                {student.verification_code && (
                    <p style={{
                        position: 'absolute',
                        bottom: 30, left: '50%',
                        transform: 'translateX(-50%)',
                        margin: 0,
                        color: 'rgba(255,255,255,0.2)',
                        fontSize: 9,
                        letterSpacing: '0.2em',
                        fontFamily: 'monospace',
                    }}>
                        VERIFICATION CODE: {student.verification_code}
                    </p>
                )}
            </div>
        </div>
    );
}

// ── Preview Modal ─────────────────────────────────────────────────────────────
export function CertificatePreview({ student, course, onClose }: CertificatePreviewProps) {
    const { isDark } = useAdminTheme();
    const certRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const certEl = document.getElementById('certificate-document');
        if (!certEl) return;

        const printWindow = window.open('', '_blank', 'width=1200,height=900');
        if (!printWindow) return;

        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Certificate – ${student.full_name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4 landscape; margin: 0; }
    html, body { width: 297mm; height: 210mm; overflow: hidden; }
    body { display: flex; align-items: center; justify-content: center; }
    #cert-root { width: 297mm; height: 210mm; }
  </style>
</head>
<body>
  <div id="cert-root">${certEl.outerHTML}</div>
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 800);
    };
  </script>
</body>
</html>`);
        printWindow.document.close();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(16px)', background: 'rgba(0,0,0,0.85)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="relative max-w-[95vw] w-full"
                style={{ maxWidth: 1000 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Controls bar */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-white font-black text-lg">Certificate Preview</h3>
                        <p className="text-white/40 text-xs font-medium mt-0.5">
                            {student.full_name} · {course.title}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handlePrint}
                            className="h-9 px-4 rounded-full text-[11px] font-black gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 border-0"
                        >
                            <Printer size={14} /> PRINT / SAVE PDF
                        </Button>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Certificate scaled to fit screen */}
                <div
                    ref={certRef}
                    style={{ transform: 'scale(0.88)', transformOrigin: 'top center' }}
                    className="rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
                >
                    <CertificateDocument student={student} course={course} />
                </div>

                <p className="text-center text-white/20 text-xs mt-4 font-medium">
                    Click "Print / Save PDF" → choose "Save as PDF" in the print dialog for a landscape A4 certificate
                </p>
            </motion.div>
        </motion.div>
    );
}
