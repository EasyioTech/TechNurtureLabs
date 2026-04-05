import React from 'react';
import { Film, Cloud, Check } from 'lucide-react';
import { useAdminTheme, t } from '../../theme-context';

interface StreamListProps {
    streamVideos: any[];
    currentUrl?: string;
    onSelect: (url: string, id: string) => void;
}

export function StreamList({ streamVideos, currentUrl, onSelect }: StreamListProps) {
    const { isDark, accent } = useAdminTheme();

    if (streamVideos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                    <Cloud size={24} className={t.textMuted(isDark)} />
                </div>
                <p className={`text-sm font-bold ${t.textMuted(isDark)}`}>
                    No Cloudflare Stream videos yet. Upload one to get started.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3">
            {streamVideos.map(video => {
                const isSelected = video.uid === currentUrl?.split('/').pop();
                return (
                    <div
                        key={video.uid}
                        className={`relative group/card text-left rounded-2xl border-2 overflow-hidden transition-all cursor-pointer
                            ${isSelected
                                ? (isDark ? `border-${accent.name}-400 ring-2 ring-${accent.name}-400/20` : `border-${accent.name}-400 ring-2 ring-${accent.name}-400/10`)
                                : (isDark ? 'border-white/5 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04]' : 'border-slate-100 hover:border-slate-300 bg-slate-50 hover:bg-white')}`}
                        onClick={() => onSelect('cf-stream://' + video.uid, video.uid)}
                    >
                        <div className={`aspect-video relative flex items-center justify-center ${isDark ? 'bg-white/[0.03]' : 'bg-slate-100'}`}>
                            {video.thumbnail ? (
                                <img src={video.thumbnail} alt={video.name} className="w-full h-full object-cover" />
                            ) : (
                                <Film size={20} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
                            )}

                            {isSelected && (
                                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${accent.bg} text-slate-900`}>
                                    <Check size={12} strokeWidth={3} />
                                </div>
                            )}

                            <div className={`absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-orange-500 text-white shadow-sm`}>
                                <Cloud size={8} />
                                Stream
                            </div>
                        </div>

                        <div className="p-2.5 space-y-0.5">
                            <p className={`text-[11px] font-black truncate ${t.textPrimary(isDark)}`}>
                                {video.name}
                            </p>
                            <p className={`text-[9px] font-bold uppercase tracking-wider ${t.textMuted(isDark)}`}>
                                {video.readyToStream ? 'Ready' : 'Processing'} · {Math.floor(video.duration / 60)}m {Math.floor(video.duration % 60)}s
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
