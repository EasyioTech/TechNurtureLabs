import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Film, ImageIcon, FileText, Trash2, Check, Cloud, HardDrive, Loader2, Eye
} from 'lucide-react';
import { useAdminTheme, t } from '../../theme-context';
import { MediaAsset } from './types';
import { PreviewModal } from './preview-modal';

interface AssetGridProps {
    assets: MediaAsset[];
    loadingMore: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    currentUrl?: string;
    onSelect: (asset: MediaAsset) => void;
    onDelete: (asset: MediaAsset, e: React.MouseEvent) => void;
    deletingId: string | null;
    isMultiSelect: boolean;
    setIsMultiSelect: (val: boolean) => void;
    selectedIds: string[];
    onBulkDelete: () => void;
    formatBytes: (bytes: number) => string;
    activeTab: string;
}

export function AssetGrid({
    assets, loadingMore, hasMore, onLoadMore, currentUrl,
    onSelect, onDelete, deletingId,
    isMultiSelect, setIsMultiSelect, selectedIds, onBulkDelete,
    formatBytes, activeTab
}: AssetGridProps) {
    const { isDark, accent } = useAdminTheme();
    const isDocumentView = activeTab === 'document';
    const [previewAsset, setPreviewAsset] = React.useState<MediaAsset | null>(null);
    const [previewOpen, setPreviewOpen] = React.useState(false);

    const handlePreview = (asset: MediaAsset, e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewAsset(asset);
        setPreviewOpen(true);
    };

    return (
        <>
            <PreviewModal
                asset={previewAsset}
                open={previewOpen}
                onOpenChange={setPreviewOpen}
            />
            <div className="space-y-4">
            {/* Bulk Selection Controls */}
            <div className={`p-3 rounded-lg border-2 flex items-center justify-between transition-colors ${isMultiSelect ? (isDark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-slate-200') : 'border-transparent'}`}>
                <div className="space-y-0.5">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>
                        {isMultiSelect ? `${selectedIds.length} items selected` : 'Library Assets'}
                    </p>
                    {isMultiSelect && (
                        <p className={`text-[9px] font-bold ${t.textMuted(isDark)} italic`}>
                            Click items to select/deselect
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    {isMultiSelect && selectedIds.length > 0 && (
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={onBulkDelete}
                            className="h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm"
                        >
                            <Trash2 size={12} className="mr-2" />
                            Delete {selectedIds.length}
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsMultiSelect(!isMultiSelect)}
                        className={`h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-full border-2 transition-all ${isMultiSelect ? (isDark ? 'bg-white/10 border-white text-white' : 'bg-slate-900 border-slate-900 text-white') : ''}`}
                    >
                        {isMultiSelect ? 'Cancel' : 'Bulk Select'}
                    </Button>
                </div>
            </div>

            <div className={isDocumentView ? "space-y-2" : "grid grid-cols-2 gap-2.5"}>
                {assets.map(asset => {
                    const isSelected = asset.file_url === currentUrl;
                    const isInBulk = selectedIds.includes(asset.id);
                    const isDeleting = deletingId === asset.id;

                    if (isDocumentView) {
                        return (
                            <div
                                key={asset.id}
                                className={`relative group/card flex items-center p-3 rounded-xl border-2 transition-all cursor-pointer
                                    ${(isSelected || isInBulk)
                                        ? (isDark ? `border-${accent.name}-400 bg-${accent.name}-400/5` : `border-${accent.name}-400 bg-${accent.name}-400/5`)
                                        : (isDark ? 'border-white/5 bg-white/[0.02] hover:bg-white/5' : 'border-slate-100 bg-slate-50 hover:bg-slate-100')
                                    } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => {
                                    if (isDeleting) return;
                                    onSelect(asset);
                                }}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                                    <FileText size={20} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                                </div>
                                <div className="flex-1 min-w-0 pr-10">
                                    <p className={`text-[11px] font-bold truncate ${t.textPrimary(isDark)}`} title={asset.original_name}>
                                        {asset.original_name}
                                    </p>
                                    <p className={`text-[9px] font-bold uppercase tracking-wider ${t.textMuted(isDark)}`}>
                                        {formatBytes(asset.file_size)} • {asset.mime_type.split('/')[1] || 'DOC'}
                                    </p>
                                </div>

                                {(isSelected || isInBulk) && (
                                    <div className={`mr-4 w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${accent.bg} text-slate-900`}>
                                        <Check size={11} strokeWidth={3} />
                                    </div>
                                )}

                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={e => handlePreview(asset, e)}
                                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-opacity opacity-0 group-hover/card:opacity-100
                                            ${isDark ? 'bg-blue-500/30 text-blue-300 hover:bg-blue-500 hover:text-white' : 'bg-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white'}`}
                                    >
                                        <Eye size={12} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={e => {
                                            e.stopPropagation();
                                            onDelete(asset, e);
                                        }}
                                        disabled={isDeleting}
                                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-opacity opacity-0 group-hover/card:opacity-100
                                            ${isDark ? 'bg-rose-500/30 text-rose-300 hover:bg-rose-500 hover:text-white' : 'bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white'}`}
                                    >
                                        {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} strokeWidth={2.5} />}
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={asset.id}
                            className={`relative group/card text-left rounded-xl border-2 overflow-hidden transition-all cursor-pointer
                                ${(isSelected || isInBulk)
                                    ? (isDark ? `border-${accent.name}-400 ring-1 ring-${accent.name}-400/20` : `border-${accent.name}-400 ring-1 ring-${accent.name}-400/10`)
                                    : (isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50')
                                } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => {
                                if (isDeleting) return;
                                onSelect(asset);
                            }}
                        >
                            <div className={`aspect-video relative flex items-center justify-center ${isDark ? 'bg-white/[0.02]' : 'bg-slate-100'}`}>
                                {asset.asset_type === 'image' ? (
                                    <AssetImagePreview asset={asset} />
                                ) : asset.asset_type === 'video' ? (
                                    <VideoPreview asset={asset} isDark={isDark} />
                                ) : (
                                    <AssetIcon
                                        asset_type={asset.asset_type}
                                        className={isDark ? 'text-slate-400' : 'text-slate-500'}
                                    />
                                )}

                                {(isSelected || isInBulk) && (
                                    <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${accent.bg} text-slate-900`}>
                                        <Check size={11} strokeWidth={3} />
                                    </div>
                                )}

                                <div className={`absolute bottom-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-black uppercase
                                    ${asset.storage_type === 'r2'
                                        ? (isDark ? `${accent.softDark.split(' ').slice(0, 2).join(' ')}` : `${accent.softLight.split(' ').slice(0, 2).join(' ')}`)
                                        : asset.storage_type === 'cloudflare_stream'
                                        ? (isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700')
                                        : (isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-500')}`}
                                >
                                    {asset.storage_type === 'r2' ? <Cloud size={7} /> : asset.storage_type === 'cloudflare_stream' ? <Film size={7} /> : <HardDrive size={7} />}
                                    {asset.storage_type === 'r2' ? 'R2' : asset.storage_type === 'cloudflare_stream' ? 'Stream' : 'Local'}
                                </div>

                                <div className="absolute top-1.5 left-1.5 flex gap-1 opacity-0 group-hover/card:opacity-100 z-10">
                                    <button
                                        type="button"
                                        onClick={e => handlePreview(asset, e)}
                                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shadow-md
                                            ${isDark ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                                    >
                                        <Eye size={9} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={e => onDelete(asset, e)}
                                        disabled={isDeleting}
                                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shadow-md
                                            ${isDark ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-rose-500 text-white hover:bg-rose-600'}`}
                                    >
                                        {isDeleting ? <Loader2 size={9} className="animate-spin" /> : <Trash2 size={9} strokeWidth={2.5} />}
                                    </button>
                                </div>
                            </div>

                            <div className="p-2 space-y-0.5">
                                <p className={`text-[10px] font-black truncate ${t.textPrimary(isDark)}`} title={asset.original_name}>
                                    {asset.original_name}
                                </p>
                                <p className={`text-[8px] font-bold uppercase tracking-wider ${t.textMuted(isDark)}`}>
                                    {formatBytes(asset.file_size)} • {asset.asset_type}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>


            {hasMore && (
                <div className="flex justify-center pt-2 pb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingMore}
                        onClick={onLoadMore}
                        className={`rounded-lg px-5 font-black uppercase tracking-widest text-[10px] h-8 ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200'}`}
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 size={11} className="animate-spin mr-1.5" />
                                Loading...
                            </>
                        ) : (
                            'Load More'
                        )}
                    </Button>
                </div>
            )}
        </div>
        </>
    );
}

function AssetImagePreview({ asset }: { asset: MediaAsset }) {
    const { isDark } = useAdminTheme();
    const [failed, setFailed] = React.useState(false);

    if (failed) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <ImageIcon size={32} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
            </div>
        );
    }

    return (
        <img
            src={asset.file_url}
            alt={asset.original_name}
            className="w-full h-full object-cover"
            onError={() => setFailed(true)}
        />
    );
}

function VideoPreview({ asset, isDark }: { asset: MediaAsset; isDark: boolean }) {
    const [failed, setFailed] = React.useState(false);
    const hasThumbnail = asset.thumbnail && !failed;

    if (!hasThumbnail) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Film size={32} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
            </div>
        );
    }

    return (
        <>
            <img
                src={asset.thumbnail || ''}
                alt={asset.original_name}
                className="w-full h-full object-cover"
                onError={() => setFailed(true)}
            />
            {/* Overlay play button indicator */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                <Film size={32} className="text-white drop-shadow-lg" strokeWidth={1.5} />
            </div>
        </>
    );
}

function AssetIcon({ asset_type, className }: { asset_type: string; className?: string }) {
    if (asset_type === 'video') return <Film size={20} className={className} />;
    if (asset_type === 'image') return <ImageIcon size={20} className={className} />;
    return <FileText size={20} className={className} />;
}
