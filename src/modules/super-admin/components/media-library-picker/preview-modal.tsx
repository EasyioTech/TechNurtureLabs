'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, FileText, ImageIcon, Film, Loader2, AlertTriangle } from 'lucide-react';
import { useAdminTheme, t } from '../../theme-context';
import { MediaAsset } from './types';

interface PreviewModalProps {
  asset: MediaAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Lazy load PDF viewer
const PDFViewer = dynamic(() => import('@/modules/student/components/learning/pdf-viewer').then(mod => mod.PDFViewer), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin text-slate-400" size={32} strokeWidth={2} /></div>,
});

export function PreviewModal({ asset, open, onOpenChange }: PreviewModalProps) {
  const { isDark } = useAdminTheme();

  if (!asset) return null;

  const isImage = asset.asset_type === 'image';
  const isVideo = asset.asset_type === 'video';
  const isPdf = asset.mime_type === 'application/pdf';
  const isDocument = asset.asset_type === 'document' && !isPdf;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-5xl max-h-[90vh] p-0 border-0 overflow-hidden ${isDark ? 'bg-[#0a0d13]' : 'bg-white'}`}>
        <DialogTitle className="sr-only">
          {asset.original_name} Preview
        </DialogTitle>

        {/* Close Button - Absolute Positioned */}
        <button
          onClick={() => onOpenChange(false)}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 shadow-lg ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
          aria-label="Close preview"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Content - Full Area */}
        <div className={`w-full h-[90vh] flex flex-col items-center justify-center overflow-auto ${isDark ? 'bg-[#0a0d13]' : 'bg-white'}`}>
          {isImage && (
            <img
              src={asset.file_url}
              alt={asset.original_name}
              className="max-w-full max-h-full object-contain"
            />
          )}

          {isVideo && asset.storage_type === 'cloudflare_stream' && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <CloudflareStreamPlayer streamId={asset.id} />
            </div>
          )}

          {isVideo && asset.storage_type !== 'cloudflare_stream' && (
            <video
              src={asset.file_url}
              controls
              className="max-w-full max-h-full object-contain"
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          )}

          {isPdf && (
            <div className="w-full h-full max-w-4xl flex">
              <PDFViewer
                url={asset.file_url}
                onComplete={() => {}}
                lessonComplete={false}
                pageNumber={1}
                docMax={100}
                canMarkComplete={false}
                className="w-full h-full rounded-none border-0"
              />
            </div>
          )}

          {isDocument && !isPdf && (
            <div className="flex flex-col items-center justify-center gap-4">
              <AlertTriangle size={48} className={isDark ? 'text-slate-500' : 'text-slate-400'} strokeWidth={1.5} />
              <p className={`text-sm font-bold text-center ${t.textMuted(isDark)}`}>
                Preview not available
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CloudflareStreamPlayer({ streamId }: { streamId: string }) {
  return (
    <div className="w-11/12 max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
      <iframe
        src={`https://iframe.videodelivery.net/${streamId}?autoplay=true&muted=false&preload=auto`}
        allowFullScreen
        className="w-full h-full border-0"
        title="Video Player"
      />
    </div>
  );
}
