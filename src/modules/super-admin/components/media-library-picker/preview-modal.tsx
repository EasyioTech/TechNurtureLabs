'use client';

import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, FileText, ImageIcon, Film } from 'lucide-react';
import { useAdminTheme, t } from '../../theme-context';
import { MediaAsset } from './types';

interface PreviewModalProps {
  asset: MediaAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PreviewModal({ asset, open, onOpenChange }: PreviewModalProps) {
  const { isDark } = useAdminTheme();

  if (!asset) return null;

  const isImage = asset.asset_type === 'image';
  const isVideo = asset.asset_type === 'video';
  const isPdf = asset.mime_type === 'application/pdf';
  const isDocument = asset.asset_type === 'document' && !isPdf;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-4xl max-h-[90vh] p-0 border-0 overflow-hidden ${isDark ? 'bg-[#0a0d13]' : 'bg-white'}`}>
        <DialogTitle className="sr-only">
          {asset.original_name} Preview
        </DialogTitle>

        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-3 min-w-0">
            {isImage && <ImageIcon size={18} className={t.textMuted(isDark)} />}
            {isVideo && <Film size={18} className={t.textMuted(isDark)} />}
            {(isPdf || isDocument) && <FileText size={18} className={t.textMuted(isDark)} />}
            <div className="min-w-0">
              <p className={`text-sm font-bold truncate ${t.textPrimary(isDark)}`} title={asset.original_name}>
                {asset.original_name}
              </p>
              <p className={`text-xs font-bold uppercase tracking-wider ${t.textMuted(isDark)}`}>
                {asset.mime_type} • {Math.round(asset.file_size / 1024)} KB
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-auto flex items-center justify-center p-4 ${isDark ? 'bg-[#0a0d13]' : 'bg-white'}`} style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {isImage && (
            <img
              src={asset.file_url}
              alt={asset.original_name}
              className="max-w-full max-h-full object-contain"
            />
          )}

          {isVideo && asset.storage_type === 'cloudflare_stream' && (
            <div className="w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={`https://iframe.mediadelivery.net/embed/${asset.id}`}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                title={`${asset.original_name} Video`}
              />
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
            <PdfPreview
              fileUrl={asset.file_url}
              isDark={isDark}
              filename={asset.original_name}
            />
          )}

          {isDocument && !isPdf && (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <FileText size={32} className={t.textMuted(isDark)} />
              </div>
              <p className={`text-sm font-bold text-center ${t.textMuted(isDark)}`}>
                Document preview not available for {asset.mime_type}
              </p>
              <p className={`text-xs font-bold uppercase tracking-wider ${t.textMuted(isDark)}`}>
                Close modal to download
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PdfPreview({ fileUrl, isDark, filename }: { fileUrl: string; isDark: boolean; filename: string }) {
  return (
    <div className={`w-full border rounded-lg ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex flex-col items-center gap-4 p-4">
        <iframe
          src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
          className="w-full h-96 border-0 rounded"
          title={`${filename} Preview`}
          sandbox="allow-same-origin allow-scripts allow-popups"
        />
        <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          PDF preview (close to download full resolution)
        </p>
      </div>
    </div>
  );
}
