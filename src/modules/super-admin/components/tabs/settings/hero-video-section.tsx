import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Film, Video, Hash, Shield, Loader2, Save } from 'lucide-react';
import { VideoUpload } from '@/modules/shared/components/video-upload';
import { useAdminTheme, t } from '../../../theme-context';

interface HeroVideoSectionProps {
    showHeroVideo: boolean;
    setShowHeroVideo: (val: boolean) => void;
    videoType: 'youtube' | 'stream' | 'upload' | 'vimeo' | 'link';
    setVideoType: (val: 'youtube' | 'stream' | 'upload' | 'vimeo' | 'link') => void;
    videoUrl: string;
    setVideoUrl: (val: string) => void;
    saving: boolean;
    onSave: () => void;
}

export function HeroVideoSection({
    showHeroVideo, setShowHeroVideo,
    videoType, setVideoType,
    videoUrl, setVideoUrl,
    saving, onSave
}: HeroVideoSectionProps) {
    const { isDark, accent } = useAdminTheme();

    return (
        <div className={`p-6 md:p-10 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-[#121214]' : 'bg-white'} shadow-xl`}>
            <div className="flex items-center gap-4 mb-8">
                <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                    <Film className={accent.text} size={28} />
                </div>
                <div className="flex-1">
                    <h2 className={`text-2xl font-black ${t.textPrimary(isDark)} tracking-tight`}>Landing Page Video</h2>
                    <p className={`text-sm ${t.textSecondary(isDark)} font-medium mt-1`}>Configure the hero video shown on the main product landing page.</p>
                </div>
            </div>

            <div className="mb-8 p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div className="space-y-1">
                    <Label className={`text-lg font-bold ${t.textPrimary(isDark)}`}>Enable Hero Video Section</Label>
                    <p className={`text-sm ${t.textSecondary(isDark)} font-medium`}>Show or hide the video demonstration section on the landing page.</p>
                </div>
                <Switch 
                    checked={showHeroVideo} 
                    onCheckedChange={setShowHeroVideo}
                    className={`data-[state=checked]:bg-${accent.name}-500`}
                />
            </div>

            <div className={`space-y-8 transition-all duration-300 ${showHeroVideo ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                {/* Video Type Selector */}
                <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 max-w-2xl">
                    {[
                        { id: 'stream', label: 'Cloudflare Stream', icon: <Video className="mb-2" size={24} /> },
                        { id: 'youtube', label: 'YouTube', icon: <Hash className="mb-2" size={24} /> },
                    ].map((type) => {
                        const isActive = videoType === type.id;
                        return (
                            <button
                                key={type.id}
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setVideoType(type.id as any); setVideoUrl(''); }}
                                className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center
                                    ${isActive
                                        ? `border-${accent.name}-500 ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`
                                        : `border-transparent ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'} ${t.border(isDark)}`
                                    }`}
                            >
                                {React.cloneElement(type.icon, { className: isActive ? accent.text : t.textMuted(isDark) })}
                                <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? t.textPrimary(isDark) : t.textSecondary(isDark)}`}>{type.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* URL Input based on Type */}
                <div className="space-y-4">
                    <Label className={`text-xs font-bold uppercase tracking-wider ${t.textSecondary(isDark)}`}>
                        {videoType === 'stream' ? 'Select or Upload to Cloudflare Stream' : 'YouTube Video ID or URL'}
                    </Label>

                    {videoType === 'stream' ? (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-xl border flex items-start gap-4 ${isDark ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                                <div className={`p-2 rounded-lg ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-100'}`}>
                                    <Shield className="text-indigo-500" size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className={`text-xs font-bold ${t.textPrimary(isDark)} mb-1`}>Cloudflare Stream Integration Active</p>
                                    <p className={`text-[10px] ${t.textSecondary(isDark)}`}>
                                        Videos are optimized for global delivery. You can upload new videos or browse your existing library.
                                    </p>
                                </div>
                            </div>
                            
                            <VideoUpload
                                value={videoUrl}
                                onChange={(url) => setVideoUrl(url)}
                                isDark={isDark}
                                folder="landing"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Input
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="e.g., https://www.youtube.com/watch?v=..."
                                className={`text-base font-bold h-14 rounded-xl transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] border-white/10 text-white shadow-inner' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            />
                            {videoUrl && !videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be') && (
                                <p className="text-[10px] font-bold text-amber-500 ml-1">
                                    ⚠ This doesn't look like a valid YouTube link. Please check it.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className={`mt-10 pt-8 border-t ${t.border(isDark)} flex justify-end`}>
                <Button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className={`h-12 px-8 rounded-xl font-bold uppercase tracking-widest transition-all
                        ${accent.bg} text-slate-100 hover:opacity-90 hover:scale-105`}
                >
                    {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                    Save Configuration
                </Button>
            </div>
        </div>
    );
}
