import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    Film, ImageIcon, FileText, Trash2, Check, Cloud, HardDrive, Loader2 
} from 'lucide-react';
import { useAdminTheme, t } from '../../theme-context';
import { MediaAsset } from './types';

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
}

export function AssetGrid({
    assets, loadingMore, hasMore, onLoadMore, currentUrl,
    onSelect, onDelete, deletingId,
    isMultiSelect, setIsMultiSelect, selectedIds, onBulkDelete,
    formatBytes
}: AssetGridProps) {
    const { isDark, accent } = useAdminTheme();

    return (
        <div className="space-y-4">
            {/* Bulk Selection Controls */}
            <div className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${isMultiSelect ? (isDark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-slate-200') : 'border-transparent'}`}>
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
                            className="h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
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

            <div className="grid grid-cols-2 gap-3">
                {assets.map(asset => {
                    const isSelected = asset.file_url === currentUrl;
                    const isInBulk = selectedIds.includes(asset.id);
                    const isDeleting = deletingId === asset.id;
                    return (
                        <div
                            key={asset.id}
                            className={`relative group/card text-left rounded-2xl border-2 overflow-hidden transition-all cursor-pointer
                                ${(isSelected || isInBulk)
                                    ? (isDark ? `border-${accent.name}-400 ring-2 ring-${accent.name}-400/20` : `border-${accent.name}-400 ring-2 ring-${accent.name}-400/10`)
                                    : (isDark ? 'border-white/5 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04]' : 'border-slate-100 hover:border-slate-300 bg-slate-50 hover:bg-white')
                                } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => {
                                if (isDeleting) return;
                                onSelect(asset);
                            }}
                        >
                            <div className={`aspect-video relative flex items-center justify-center ${isDark ? 'bg-white/[0.03]' : 'bg-slate-100'}`}>
                                {asset.asset_type === 'image' ? (
                                    <AssetImagePreview asset={asset} />
                                ) : asset.asset_type === 'video' ? (
                                    <VideoPreview src={asset.file_url} isDark={isDark} />
                                ) : (
                                    <AssetIcon 
                                        asset_type={asset.asset_type} 
                                        className={isDark ? 'text-slate-400' : 'text-slate-500'} 
                                    />
                                )}

                                {(isSelected || isInBulk) && (
                                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${accent.bg} text-slate-900`}>
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                )}

                                <div className={`absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase
                                    ${asset.storage_type === 'r2'
                                        ? (isDark ? `${accent.softDark.split(' ').slice(0, 2).join(' ')}` : `${accent.softLight.split(' ').slice(0, 2).join(' ')}`)
                                        : asset.storage_type === 'cloudflare_stream'
                                        ? (isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700')
                                        : (isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-500')}`}
                                >
                                    {asset.storage_type === 'r2' ? <Cloud size={8} /> : asset.storage_type === 'cloudflare_stream' ? <Film size={8} /> : <HardDrive size={8} />}
                                    {asset.storage_type === 'r2' ? 'R2' : asset.storage_type === 'cloudflare_stream' ? 'Stream' : 'Local'}
                                </div>

                                <button
                                    type="button"
                                    onClick={e => onDelete(asset, e)}
                                    disabled={isDeleting}
                                    className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity
                                        ${isDark ? 'bg-rose-500/80 text-white hover:bg-rose-500' : 'bg-rose-500 text-white hover:bg-rose-600'}`}
                                >
                                    {isDeleting ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                                </button>
                            </div>

                            <div className="p-2.5 space-y-0.5">
                                <p className={`text-[11px] font-black truncate ${t.textPrimary(isDark)}`}>
                                    {asset.original_name}
                                </p>
                                <p className={`text-[9px] font-bold uppercase tracking-wider ${t.textMuted(isDark)}`}>
                                    {formatBytes(asset.file_size)} · {asset.asset_type}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {hasMore && (
                <div className="flex justify-center pt-2 pb-6">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingMore}
                        onClick={onLoadMore}
                        className={`rounded-full px-6 font-black uppercase tracking-widest text-[10px] ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200'}`}
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 size={12} className="animate-spin mr-2" />
                                Loading...
                            </>
                        ) : (
                            'Load More Assets'
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}

function AssetImagePreview({ asset }: { asset: MediaAsset }) {
    const { isDark } = useAdminTheme();
    const [failed, setFailed] = React.useState(false);

    if (failed) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <ImageIcon size={24} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
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

function VideoPreview({ src, isDark }: { src: string; isDark: boolean }) {
    // For media library selection - just show the Film icon, no playable preview
    // Videos are meant to be selected and used in lessons, not played in the picker
    return (
        <div className="w-full h-full flex items-center justify-center">
            <Film size={24} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
        </div>
    );
}

function AssetIcon({ asset_type, className }: { asset_type: string; className?: string }) {
    if (asset_type === 'video') return <Film size={20} className={className} />;
    if (asset_type === 'image') return <ImageIcon size={20} className={className} />;
    return <FileText size={20} className={className} />;
}
