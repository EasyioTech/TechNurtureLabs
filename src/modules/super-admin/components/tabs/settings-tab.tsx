import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminTheme, t } from '../../theme-context';
import { toast } from 'sonner';
import { Loader2, Video, Save, Link2, UploadCloud, Film } from 'lucide-react';
import { MediaLibraryPicker } from '../media-library-picker';

export function SettingsTab() {
    const { isDark, accent } = useAdminTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);

    const [videoType, setVideoType] = useState<'youtube' | 'upload' | 'vimeo' | 'link'>('youtube');
    const [videoUrl, setVideoUrl] = useState('');

    useEffect(() => {
        // Fetch current settings
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => {
                if (data.settings) {
                    setVideoType(data.settings.hero_video_type || 'youtube');
                    setVideoUrl(data.settings.hero_video_url || '');
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                toast.error('Failed to load platform settings');
                setLoading(false);
            });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hero_video_type: videoType,
                    hero_video_url: videoUrl,
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Settings updated successfully');
            } else {
                toast.error(data.error || 'Failed to update settings');
            }
        } catch (error) {
            console.error(error);
            toast.error('Network error while saving');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className={`animate-spin ${accent.text}`} size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className={`p-6 md:p-10 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-[#121214]' : 'bg-white'} shadow-xl`}>
                <div className="flex items-center gap-4 mb-8">
                    <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                        <Film className={accent.text} size={28} />
                    </div>
                    <div>
                        <h2 className={`text-2xl font-black ${t.textPrimary(isDark)} tracking-tight`}>Landing Page Video</h2>
                        <p className={`text-sm ${t.textSecondary(isDark)} font-medium mt-1`}>Configure the hero video shown on the main product landing page.</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Video Type Selector */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { id: 'youtube', label: 'YouTube', icon: <Video className="mb-2" size={24} /> },
                            { id: 'upload', label: 'Cloudflare R2', icon: <UploadCloud className="mb-2" size={24} /> },
                            { id: 'link', label: 'Direct Link (MP4)', icon: <Link2 className="mb-2" size={24} /> },
                        ].map((type) => {
                            const isActive = videoType === type.id;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => { setVideoType(type.id as any); setVideoUrl(''); }}
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
                            {videoType === 'youtube' ? 'YouTube Video ID or URL' : videoType === 'upload' ? 'Upload or Select Video from R2' : 'Direct Custom MP4 or WebM URL'}
                        </Label>

                        {videoType === 'upload' ? (
                            <div className="mt-2 space-y-3">
                                <div className="flex gap-3 items-center">
                                    <Input
                                        value={videoUrl}
                                        readOnly
                                        placeholder="Select a video from R2 library"
                                        className={`text-base font-medium h-14 rounded-xl flex-1 ${isDark ? 'bg-white/[0.04] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                    />
                                    <Button
                                        onClick={() => setPickerOpen(true)}
                                        className={`h-14 px-6 rounded-xl font-bold ${accent.bg} text-slate-100 uppercase tracking-wider`}
                                    >
                                        Browse Library
                                    </Button>
                                </div>
                                <MediaLibraryPicker
                                    open={pickerOpen}
                                    onOpenChange={setPickerOpen}
                                    onSelect={(url) => setVideoUrl(url)}
                                    filterType="video"
                                    currentUrl={videoUrl}
                                />
                            </div>
                        ) : (
                            <Input
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder={
                                    videoType === 'youtube' ? 'e.g., https://www.youtube.com/watch?v=...'
                                        : 'e.g., https://example.com/video.mp4'
                                }
                                className={`text-base font-medium h-14 rounded-xl ${isDark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-slate-200'}`}
                            />
                        )}
                    </div>
                </div>

                <div className={`mt-10 pt-8 border-t ${t.border(isDark)} flex justify-end`}>
                    <Button
                        onClick={handleSave}
                        disabled={saving || !videoUrl}
                        className={`h-12 px-8 rounded-xl font-bold uppercase tracking-widest transition-all
                            ${accent.bg} text-slate-100 hover:opacity-90 hover:scale-105`}
                    >
                        {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
