'use client';

import React, { useRef, useState, useEffect } from 'react';
import { CertificateTemplate } from './certificate-template';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Eye, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface Props {
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
}: Props) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  // 🔹 AUTO SCALE (fit to viewport)
  useEffect(() => {
    if (!isOpen) return;

    const updateScale = () => {
      if (!containerRef.current) return;

      const vw = containerRef.current.clientWidth;
      const vh = containerRef.current.clientHeight;

      const certWidth = 1200;
      const certHeight = 675;

      const scaleX = vw / certWidth;
      const scaleY = vh / certHeight;

      const newScale = Math.min(scaleX, scaleY) * 0.9; // padding factor
      setScale(newScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [isOpen]);

  // 🔹 ESC to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // 🔹 DOWNLOAD PDF
  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 3, // HIGH QUALITY
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

      const margin = 10;
      const usableWidth = pdfWidth - margin * 2;
      const usableHeight = pdfHeight - margin * 2;

      const imgRatio = canvas.width / canvas.height;
      let imgWidth = usableWidth;
      let imgHeight = imgWidth / imgRatio;

      if (imgHeight > usableHeight) {
        imgHeight = usableHeight;
        imgWidth = imgHeight * imgRatio;
      }

      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(`${courseTitle.replace(/\s+/g, '_')}_Certificate.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div>
      {/* ACTIONS */}
      <div className="flex gap-3">
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md text-sm"
        >
          <Download size={16} />
          {isDownloading ? 'Generating...' : 'Download'}
        </button>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm"
        >
          <Eye size={16} />
          Preview
        </button>
      </div>

      {/* MODAL */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
          {/* HEADER */}
          <div className="flex justify-between items-center p-4 bg-white border-b">
            <div className="flex gap-2">
              <button
                onClick={() => setScale(s => s * 1.2)}
                className="p-2 border rounded"
              >
                <ZoomIn size={16} />
              </button>

              <button
                onClick={() => setScale(s => s / 1.2)}
                className="p-2 border rounded"
              >
                <ZoomOut size={16} />
              </button>

              <button
                onClick={() => setScale(1)}
                className="p-2 border rounded"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2 border rounded"
            >
              <X size={18} />
            </button>
          </div>

          {/* VIEWPORT */}
          <div
            ref={containerRef}
            className="flex-1 overflow-hidden flex items-center justify-center bg-gray-100"
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center',
                transition: 'transform 0.2s ease',
              }}
            >
              <div
                ref={certificateRef}
                style={{
                  width: '1200px',
                  height: '675px',
                }}
              >
                <CertificateTemplate
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

          {/* FOOTER */}
          <div className="p-4 bg-white border-t flex justify-end gap-3">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 border rounded"
            >
              Close
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-4 py-2 bg-black text-white rounded"
            >
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
