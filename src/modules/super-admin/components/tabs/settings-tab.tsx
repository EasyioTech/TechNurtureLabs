import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminTheme, t } from '../../theme-context';
import { toast } from 'sonner';
import { Loader2, Video, Save, Link2, UploadCloud, Film, GraduationCap, Plus, Trash2, Hash } from 'lucide-react';
import { MediaLibraryPicker } from '../media-library-picker';
import { ImageUpload } from '@/modules/shared/components/image-upload';
import { Palette, Shield, Settings2, Smartphone, Key, AlertCircle, CheckCircle, Columns, Rows, Square, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generate2FASecret, enable2FA, disable2FA } from '@/actions/2fa';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Slider } from '@/components/ui/slider';
import { fetchAllClasses, createClass, deleteClass, ensureDefaultClasses, syncPlatformMetrics } from '@/modules/super-admin/actions';

export const SettingsTab = forwardRef<any, any>(function SettingsTab(props, ref) {
    const { isDark, accent } = useAdminTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);

    const [videoType, setVideoType] = useState<'youtube' | 'upload' | 'vimeo' | 'link' | 'stream'>('youtube');
    const [videoUrl, setVideoUrl] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [faviconUrl, setFaviconUrl] = useState('');
    const [platformName, setPlatformName] = useState('TechNurture');
    const [logoLayout, setLogoLayout] = useState('landscape');
    const [showPlatformName, setShowPlatformName] = useState(true);
    const [logoHeight, setLogoHeight] = useState(40);

    // 2FA States
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [show2FASetup, setShow2FASetup] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [tempSecret, setTempSecret] = useState('');
    const [otpToken, setOtpToken] = useState('');

    const [show2FADisable, setShow2FADisable] = useState(false);
    const [disableToken, setDisableToken] = useState('');
    const [disabling2FA, setDisabling2FA] = useState(false);
    // Password States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

    // Class Management States
    const [classesList, setClassesList] = useState<any[]>([]);
    const [classesLoading, setClassesLoading] = useState(true);
    const [newClassName, setNewClassName] = useState('');
    const [newClassLevel, setNewClassLevel] = useState('');
    const [classCreating, setClassCreating] = useState(false);
    const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);

    const loadClasses = async () => {
        setClassesLoading(true);
        try {
            await ensureDefaultClasses();
            const data = await fetchAllClasses();
            setClassesList(data);
        } catch (err) {
            console.error(err);
        } finally {
            setClassesLoading(false);
        }
    };

    const handleCreateClass = async () => {
        if (!newClassName.trim() || !newClassLevel) {
            toast.error('Both class name and level are required');
            return;
        }
        setClassCreating(true);
        try {
            const result = await createClass(newClassName, parseInt(newClassLevel));
            if (result.success) {
                toast.success(`"${newClassName}" created successfully`);
                setNewClassName('');
                setNewClassLevel('');
                await loadClasses();
            } else {
                toast.error(result.error || 'Failed to create class');
            }
        } catch (err: any) {
            toast.error(err.message || 'Error creating class');
        } finally {
            setClassCreating(false);
        }
    };

    const handleDeleteClass = async (classId: string, className: string) => {
        if (!confirm(`Are you sure you want to delete "${className}"? This action cannot be undone.`)) return;
        setDeletingClassId(classId);
        try {
            const result = await deleteClass(classId);
            if (result.success) {
                toast.success(`"${className}" deleted`);
                await loadClasses();
            } else {
                toast.error(result.error || 'Failed to delete class');
            }
        } catch (err: any) {
            toast.error(err.message || 'Error deleting class');
        } finally {
            setDeletingClassId(null);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hero_video_type: videoType,
                    hero_video_url: videoUrl,
                    logo_url: logoUrl,
                    favicon_url: faviconUrl,
                    platform_name: platformName,
                    logo_layout: logoLayout,
                    show_platform_name: showPlatformName,
                    logo_height: logoHeight,
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

    useImperativeHandle(ref, () => ({
        handleSave
    }));

    useEffect(() => {
        // Fetch current settings
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => {
                if (data.settings) {
                    setVideoType(data.settings.hero_video_type || 'youtube');
                    setVideoUrl(data.settings.hero_video_url || '');
                    setLogoUrl(data.settings.logo_url || '');
                    setFaviconUrl(data.settings.favicon_url || '');
                    setPlatformName(data.settings.platform_name || 'TechNurture');
                    setLogoLayout(data.settings.logo_layout || 'landscape');
                    setShowPlatformName(data.settings.show_platform_name ?? true);
                    setLogoHeight(data.settings.logo_height || 40);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                toast.error('Failed to load platform settings');
                setLoading(false);
            });

        // Check 2FA status
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                setTwoFactorEnabled(data.user?.two_factor_enabled || false);
            });

        // Load classes
        loadClasses();
    }, []);


    const handleSetup2FA = async () => {
        try {
            const data = await generate2FASecret();
            setQrCode(data.qrCodeUrl);
            setTempSecret(data.secret);
            setShow2FASetup(true);
        } catch (error) {
            toast.error('Failed to initialize 2FA');
        }
    };

    const handleVerifyAndEnable2FA = async () => {
        if (otpToken.length !== 6) return;
        try {
            const result = await enable2FA(tempSecret, otpToken);
            if (result.success) {
                setTwoFactorEnabled(true);
                setShow2FASetup(false);
                setRecoveryCodes(result.recoveryCodes || []);
                toast.success('Two-factor authentication enabled');
            } else {
                toast.error(result.error || 'Identity verification failed');
            }
        } catch (error) {
            toast.error('Failed to enable 2FA');
        }
    };

    const handleDisable2FA = async () => {
        if (disableToken.length !== 6) return;
        setDisabling2FA(true);
        try {
            const result = await disable2FA(disableToken);
            if (result.success) {
                setTwoFactorEnabled(false);
                setShow2FADisable(false);
                setDisableToken('');
                setRecoveryCodes([]);
                toast.success('Two-factor authentication disabled');
            } else {
                toast.error(result.error || 'Verification failed');
            }
        } catch (error) {
            toast.error('Failed to disable 2FA');
        } finally {
            setDisabling2FA(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) return;
        setChangingPassword(true);
        try {
            const res = await fetch('/api/auth/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Password updated successfully');
                setCurrentPassword('');
                setNewPassword('');
            } else {
                toast.error(data.error || 'Failed to update password');
            }
        } catch (error) {
            toast.error('Network error');
        } finally {
            setChangingPassword(false);
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
            {/* Platform Identity Section */}
            <div className={`p-6 md:p-10 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-[#121214]' : 'bg-white'} shadow-xl`}>
                <div className="flex items-center gap-4 mb-8">
                    <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                        <Palette className={accent.text} size={28} />
                    </div>
                    <div>
                        <h2 className={`text-2xl font-black ${t.textPrimary(isDark)} tracking-tight`}>Platform Identity</h2>
                        <p className={`text-sm ${t.textSecondary(isDark)} font-medium mt-1`}>Manage the primary logo and branding for the entire platform.</p>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <Label className={`text-xs font-black uppercase tracking-[0.2em] ${t.textSecondary(isDark)}`}>System Logo</Label>
                            <div className="max-w-xs">
                                <ImageUpload
                                    value={logoUrl}
                                    onChange={setLogoUrl}
                                    isDark={isDark}
                                    folder="branding"
                                />
                            </div>
                            <p className={`text-[11px] ${t.textMuted(isDark)} font-medium italic mt-2 leading-relaxed`}>
                                Primary branding asset. Used in headers, dashboards, and portals.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Label className={`text-xs font-black uppercase tracking-[0.2em] ${t.textSecondary(isDark)}`}>Favicon (Browser Icon)</Label>
                            <div className="w-16 h-16">
                                <ImageUpload
                                    value={faviconUrl}
                                    onChange={setFaviconUrl}
                                    isDark={isDark}
                                    aspect="square"
                                    compact={true}
                                    folder="branding"
                                />
                            </div>
                            <p className={`text-[10px] ${t.textMuted(isDark)} font-medium italic mt-2 leading-tight`}>
                                Square icon for browser tabs.
                            </p>
                        </div>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t ${t.border(isDark)}`}>
                        <div className="space-y-4">
                            <Label className={`text-xs font-black uppercase tracking-[0.2em] ${t.textSecondary(isDark)}`}>Platform Public Name</Label>
                            <Input
                                value={platformName}
                                onChange={(e) => setPlatformName(e.target.value)}
                                placeholder="e.g. TechNurture Labs"
                                className={`text-base font-bold h-14 rounded-xl transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? '!bg-white/[0.08] border-white/10 text-white shadow-inner' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className={`text-xs font-black uppercase tracking-[0.2em] ${t.textSecondary(isDark)}`}>Logo Layout</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'landscape', label: 'Landscape', icon: <Columns size={20} /> },
                                    { id: 'portrait', label: 'Portrait', icon: <Rows size={20} /> },
                                    { id: 'icon_only', label: 'Icon', icon: <Square size={16} /> },
                                ].map((layout) => {
                                    const isActive = logoLayout === layout.id;
                                    return (
                                        <button
                                            key={layout.id}
                                            onClick={() => setLogoLayout(layout.id)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all gap-2
                                                ${isActive
                                                    ? `border-${accent.name}-500 ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`
                                                    : `border-transparent ${isDark ? 'bg-white/[0.02] hover:bg-white/[0.05]' : 'bg-slate-100/50 hover:bg-slate-100'} ${t.border(isDark)}`
                                                }`}
                                        >
                                            <div className={isActive ? accent.text : t.textMuted(isDark)}>
                                                {layout.icon}
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? t.textPrimary(isDark) : t.textSecondary(isDark)}`}>
                                                {layout.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <Label className={`text-xs font-black uppercase tracking-[0.2em] ${t.textSecondary(isDark)}`}>Logo Display Height</Label>
                                <span className={`text-sm font-black px-3 py-1 rounded-lg ${accent.text} ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                    {logoHeight}px
                                </span>
                            </div>
                            <Slider
                                value={[logoHeight]}
                                min={20}
                                max={120}
                                step={1}
                                onValueChange={(vals) => setLogoHeight(vals[0])}
                                className="py-4"
                            />
                            <p className={`text-[10px] ${t.textMuted(isDark)} font-medium`}>
                                Drag to adjust the logo scale in navigation and footers.
                            </p>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                            <div>
                                <Label className={`text-sm font-black ${t.textPrimary(isDark)}`}>Show Name beside Logo</Label>
                                <p className={`text-[10px] ${t.textMuted(isDark)} font-medium`}>Toggle platform name visibility in headers.</p>
                            </div>
                            <Switch checked={showPlatformName} onCheckedChange={setShowPlatformName} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Academic Classes Management Section */}
            <div className={`p-6 md:p-10 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-[#121214]' : 'bg-white'} shadow-xl`}>
                <div className="flex items-center gap-4 mb-8">
                    <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                        <GraduationCap className={accent.text} size={28} />
                    </div>
                    <div className="flex-1">
                        <h2 className={`text-2xl font-black ${t.textPrimary(isDark)} tracking-tight`}>Academic Classes</h2>
                        <p className={`text-sm ${t.textSecondary(isDark)} font-medium mt-1`}>Manage class levels available for school registration. Default classes (1–12) are auto-created.</p>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                        {classesList.length} total
                    </div>
                </div>

                {/* Add New Class */}
                <div className={`p-5 rounded-2xl border-2 border-dashed ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50/50'} mb-6`}>
                    <div className="flex items-center gap-2 mb-4">
                        <Plus size={16} className={accent.text} />
                        <span className={`text-xs font-black uppercase tracking-widest ${t.textSecondary(isDark)}`}>Add New Class</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <Input
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                placeholder="e.g., Class 13 or Nursery"
                                className={`h-12 rounded-xl font-medium ${isDark ? '!bg-white/[0.06] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                            />
                        </div>
                        <div className="w-full sm:w-32">
                            <Input
                                type="number"
                                value={newClassLevel}
                                onChange={(e) => setNewClassLevel(e.target.value)}
                                placeholder="Level"
                                min={0}
                                className={`h-12 rounded-xl font-medium ${isDark ? '!bg-white/[0.06] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                            />
                        </div>
                        <Button
                            onClick={handleCreateClass}
                            disabled={classCreating || !newClassName.trim() || !newClassLevel}
                            className={`h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-xs ${accent.bg} text-white hover:opacity-90 transition-all shrink-0`}
                        >
                            {classCreating ? <Loader2 className="animate-spin mr-2" size={16} /> : <Plus className="mr-1" size={16} />}
                            Add
                        </Button>
                    </div>
                    <p className={`text-[10px] ${t.textMuted(isDark)} font-medium mt-2`}>
                        Level determines sort order. Lower levels appear first in registration.
                    </p>
                </div>

                {/* Classes List */}
                {classesLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className={`animate-spin ${accent.text}`} size={24} />
                    </div>
                ) : classesList.length === 0 ? (
                    <div className={`text-center py-12 ${t.textMuted(isDark)}`}>
                        <GraduationCap size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="font-bold text-sm">No classes found</p>
                        <p className="text-xs mt-1">Add a class above to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <AnimatePresence mode="popLayout">
                            {classesList.map((cls) => (
                                <motion.div
                                    key={cls.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all ${isDark
                                        ? 'bg-white/[0.03] border-white/[0.06] hover:border-white/10'
                                        : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {cls.level}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold truncate ${t.textPrimary(isDark)}`}>{cls.name}</p>
                                        <p className={`text-[10px] font-medium ${t.textMuted(isDark)}`}>Level {cls.level}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteClass(cls.id, cls.name)}
                                        disabled={deletingClassId === cls.id}
                                        className={`opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all cursor-pointer ${isDark
                                            ? 'hover:bg-rose-500/10 text-rose-400'
                                            : 'hover:bg-rose-50 text-rose-500'
                                            }`}
                                        title={`Delete ${cls.name}`}
                                    >
                                        {deletingClassId === cls.id ? (
                                            <Loader2 className="animate-spin" size={16} />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

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
                            { id: 'stream', label: 'Cloudflare Stream', icon: <Video className="mb-2" size={24} /> },
                            { id: 'upload', label: 'Cloudflare R2', icon: <UploadCloud className="mb-2" size={24} /> },
                            { id: 'youtube', label: 'YouTube', icon: <Hash className="mb-2" size={24} /> },
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
                            {videoType === 'stream' ? 'Cloudflare Stream Video UID' : videoType === 'youtube' ? 'YouTube Video ID or URL' : videoType === 'upload' ? 'Upload or Select Video from R2' : 'Direct Custom MP4 or WebM URL'}
                        </Label>

                        {videoType === 'stream' && (
                            <div className={`p-4 rounded-xl border flex items-start gap-4 mb-4 ${isDark ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                                <div className={`p-2 rounded-lg ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-100'}`}>
                                    <Shield className="text-indigo-500" size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className={`text-xs font-bold ${t.textPrimary(isDark)} mb-1`}>Cloudflare Stream Integration Active</p>
                                    <p className={`text-[10px] ${t.textSecondary(isDark)}`}>
                                        Videos are optimized for global delivery. Enter the Video UID from your Cloudflare dashboard.
                                    </p>
                                </div>
                            </div>
                        )}

                        {videoType === 'upload' ? (
                            <div className="mt-2 space-y-3">
                                <div className="flex gap-3 items-center">
                                    <Input
                                        value={videoUrl}
                                        readOnly
                                        placeholder="Select a video from R2 library"
                                        className={`text-base font-medium h-14 rounded-xl flex-1 ${isDark ? '!bg-white/[0.04] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
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
                                value={videoUrl.startsWith('cf-stream://') ? videoUrl.replace('cf-stream://', '') : videoUrl}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (videoType === 'stream') {
                                        setVideoUrl(val ? `cf-stream://${val.replace('cf-stream://', '')}` : '');
                                    } else {
                                        setVideoUrl(val);
                                    }
                                }}
                                placeholder={
                                    videoType === 'stream' ? 'Enter Cloudflare Video UID (e.g. 5d5a...) '
                                        : videoType === 'youtube' ? 'e.g., https://www.youtube.com/watch?v=...'
                                            : 'e.g., https://example.com/video.mp4'
                                }
                                className={`text-base font-bold h-14 rounded-xl transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] border-white/10 text-white shadow-inner' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            />
                        )}
                    </div>
                </div>

                <div className={`mt-10 pt-8 border-t ${t.border(isDark)} flex justify-end`}>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className={`h-12 px-8 rounded-xl font-bold uppercase tracking-widest transition-all
                            ${accent.bg} text-slate-100 hover:opacity-90 hover:scale-105`}
                    >
                        {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                        Save Configuration
                    </Button>
                </div>
            </div>

            {/* Password Management Section */}
            <div className={`p-6 md:p-10 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-[#121214]' : 'bg-white'} shadow-xl`}>
                <div className="flex items-center gap-4 mb-8">
                    <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                        <Lock className={accent.text} size={28} />
                    </div>
                    <div>
                        <h2 className={`text-2xl font-black ${t.textPrimary(isDark)} tracking-tight`}>Account Password</h2>
                        <p className={`text-sm ${t.textSecondary(isDark)} font-medium mt-1`}>Update your administrative account password.</p>
                    </div>
                </div>

                <div className="space-y-6 max-w-md">
                    <div className="space-y-4">
                        <Label className={`text-xs font-bold uppercase tracking-wider ${t.textSecondary(isDark)}`}>Current Password</Label>
                        <Input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className={`text-base font-medium h-14 rounded-xl ${isDark ? '!bg-white/[0.04] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="space-y-4">
                        <Label className={`text-xs font-bold uppercase tracking-wider ${t.textSecondary(isDark)}`}>New Password</Label>
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={`text-base font-medium h-14 rounded-xl ${isDark ? '!bg-white/[0.04] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            placeholder="••••••••"
                        />
                    </div>
                    <Button
                        onClick={handleChangePassword}
                        disabled={changingPassword || !currentPassword || !newPassword}
                        className={`h-12 w-full rounded-xl font-bold uppercase tracking-widest ${accent.bg} text-white`}
                    >
                        {changingPassword ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        Change Password
                    </Button>
                </div>
            </div>

            {/* Security & 2FA Section */}
            <div className={`p-6 md:p-10 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-[#121214]' : 'bg-white'} shadow-xl`}>
                <div className="flex items-center gap-4 mb-8">
                    <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                        <Shield className={accent.text} size={28} />
                    </div>
                    <div>
                        <h2 className={`text-2xl font-black ${t.textPrimary(isDark)} tracking-tight`}>Security & MFA</h2>
                        <p className={`text-sm ${t.textSecondary(isDark)} font-medium mt-1`}>Enhance your administrative account security with Two-Factor Authentication.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className={`p-6 md:p-8 rounded-3xl border ${twoFactorEnabled ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : 'border-amber-500/20 bg-amber-500/[0.02]'}`}>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-6">
                            <div className={`p-4 rounded-2xl shrink-0 ${twoFactorEnabled ? 'bg-emerald-500/10 text-emerald-500 shadow-inner' : 'bg-amber-500/10 text-amber-500 shadow-inner'}`}>
                                {twoFactorEnabled ? <CheckCircle size={28} /> : <AlertCircle size={28} />}
                            </div>
                            <div className="flex-1 space-y-2">
                                <h3 className={`font-black uppercase tracking-[0.1em] text-sm ${t.textPrimary(isDark)}`}>
                                    Two-Factor Authentication: <span className={twoFactorEnabled ? 'text-emerald-500' : 'text-amber-500'}>{twoFactorEnabled ? 'PROTECTED' : 'UNSECURED'}</span>
                                </h3>
                                <p className={`text-xs ${t.textSecondary(isDark)} font-medium leading-relaxed max-w-xl`}>
                                    {twoFactorEnabled
                                        ? 'Your account is secured with a secondary verification layer. Unauthorized infrastructure access is severely restricted.'
                                        : 'We strongly recommend enabling 2FA to protect administrative actions and secure platform infrastructure.'}
                                </p>
                            </div>
                            <div className={`w-full md:w-auto mt-6 md:mt-0 pt-6 md:pt-0 border-t ${isDark ? 'border-white/10' : 'border-slate-200'} md:border-0 flex gap-3 shrink-0`}>
                                {!twoFactorEnabled && !show2FASetup && (
                                    <Button onClick={handleSetup2FA} className={`w-full md:w-auto rounded-xl font-black ${accent.bg} text-white px-8 h-12 uppercase tracking-widest text-xs shadow-lg shadow-${accent.name}-500/20 hover:scale-105 transition-all`}>
                                        Secure Now
                                    </Button>
                                )}
                                {twoFactorEnabled && !show2FADisable && (
                                    <Button variant="outline" onClick={() => setShow2FADisable(true)}
                                        className={`w-full md:w-auto rounded-xl font-black uppercase tracking-widest text-xs px-8 h-12 border-2 transition-all !bg-transparent
                                                ${isDark ? 'border-white/10 hover:!bg-white/5 text-slate-300' : 'border-slate-200 hover:!bg-slate-50 text-slate-700'}
                                            `}>
                                        Disable
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {show2FADisable && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={`p-8 rounded-3xl border-2 ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'} space-y-6 overflow-hidden`}>
                            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 text-rose-500">
                                        <AlertCircle size={20} />
                                        <h4 className="font-black uppercase tracking-widest text-sm">Disable Two-Factor Authentication</h4>
                                    </div>
                                    <p className={`text-xs ${t.textSecondary(isDark)} font-medium leading-relaxed max-w-lg`}>
                                        Warning: Disabling 2FA will remove the extra layer of security on your administrative account. Please enter your authenticator's 6-digit code to confirm this action.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-4 items-center shrink-0 w-full md:w-auto">
                                    <InputOTP maxLength={6} value={disableToken} onChange={setDisableToken}>
                                        <InputOTPGroup className="gap-2">
                                            {[0, 1, 2, 3, 4, 5].map(i => (
                                                <InputOTPSlot key={i} index={i} className={`w-12 h-14 rounded-xl border-2 font-black text-lg ${isDark ? '!bg-white/5 border-white/10 text-white' : '!bg-white border-slate-200 text-slate-900'} shadow-[none!important] outline-none`} />
                                            ))}
                                        </InputOTPGroup>
                                    </InputOTP>
                                    <div className="flex gap-3 w-full">
                                        <Button variant="outline" onClick={() => setShow2FADisable(false)} className={`flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-xs border-2 !bg-transparent transition-all ${isDark ? 'border-white/10 text-slate-400 hover:text-white hover:!bg-white/5' : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:!bg-slate-50'}`}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleDisable2FA} disabled={disableToken.length !== 6 || disabling2FA} className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-xs bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20">
                                            {disabling2FA ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                            Confirm
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {show2FASetup && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`p-8 rounded-3xl border-2 ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'} space-y-8`}>
                            <div className="flex flex-col md:flex-row gap-10">
                                <div className="p-4 bg-white rounded-2xl shadow-xl w-fit mx-auto md:mx-0">
                                    {qrCode ? <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" /> : <div className="w-48 h-48 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}
                                </div>
                                <div className="flex-1 space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-indigo-500">
                                            <Smartphone size={18} />
                                            <span className="text-xs font-black uppercase tracking-wider">Step 1: Scan QR</span>
                                        </div>
                                        <p className={`text-sm font-medium ${t.textSecondary(isDark)}`}>
                                            Open your authenticator app (Google Authenticator, Authy, etc.) and scan the QR code on the left.
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-indigo-500">
                                            <Key size={18} />
                                            <span className="text-xs font-black uppercase tracking-wider">Step 2: Verify Token</span>
                                        </div>
                                        <div className="flex flex-col items-center md:items-start gap-4">
                                            <InputOTP maxLength={6} value={otpToken} onChange={setOtpToken}>
                                                <InputOTPGroup className="gap-2">
                                                    {[0, 1, 2, 3, 4, 5].map(i => (
                                                        <InputOTPSlot key={i} index={i} className={`w-12 h-14 rounded-xl border-2 font-black text-lg ${isDark ? '!bg-white/5 border-white/10 text-white' : '!bg-white border-slate-200 text-slate-900'} shadow-[none!important] outline-none`} />
                                                    ))}
                                                </InputOTPGroup>
                                            </InputOTP>
                                            <Button
                                                onClick={handleVerifyAndEnable2FA}
                                                disabled={otpToken.length !== 6}
                                                className={`h-12 px-10 rounded-xl font-bold uppercase tracking-widest ${accent.bg} text-white`}
                                            >
                                                Finalize Setup
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {recoveryCodes.length > 0 && (
                        <div className={`p-8 rounded-3xl ${isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'} border-2 space-y-6`}>
                            <div className="flex items-center gap-3 text-indigo-500">
                                <Key size={22} className="shrink-0" />
                                <h4 className="text-sm font-black uppercase tracking-[0.15em]">Emergency Recovery Codes</h4>
                            </div>
                            <p className={`text-xs ${t.textMuted(isDark)} font-medium leading-relaxed max-w-2xl`}>
                                Store these codes in a secure, offline location. They can be used to regain access to your administrative account if you lose your authentication device.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                                {recoveryCodes.map(code => (
                                    <div key={code} className={`p-4 rounded-xl border-2 text-center font-mono text-sm font-black tracking-[0.2em] transition-transform hover:scale-105 cursor-default
                                        ${isDark
                                            ? 'bg-white/[0.04] border-white/10 text-indigo-300 hover:border-indigo-400/50 hover:bg-indigo-500/10'
                                            : 'bg-white border-indigo-100 text-indigo-700 hover:border-indigo-300 hover:shadow-md'}
                                    `}>
                                        {code}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* System Maintenance Section */}
            <div className={`p-6 md:p-10 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-[#121214]' : 'bg-white'} shadow-xl`}>
                <div className="flex items-center gap-4 mb-8">
                    <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                        <Settings2 className={accent.text} size={28} />
                    </div>
                    <div className="flex-1">
                        <h2 className={`text-2xl font-black ${t.textPrimary(isDark)} tracking-tight`}>System Maintenance</h2>
                        <p className={`text-sm ${t.textSecondary(isDark)} font-medium mt-1`}>Perform critical system-wide data synchronization and cleanup tasks.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-3xl border ${t.border(isDark)} ${isDark ? 'bg-white/[0.02]' : 'bg-neutral-50'} flex flex-col justify-between`}>
                        <div className="space-y-2">
                            <h4 className={`text-sm font-black uppercase tracking-widest ${t.textPrimary(isDark)}`}>Sync Platform Metrics</h4>
                            <p className={`text-[11px] font-medium leading-relaxed ${t.textMuted(isDark)}`}>
                                Force a complete recalculation of total students, revenue, and active subscriptions. Use this if dashboard counters appear out of sync.
                            </p>
                        </div>
                        <Button 
                            disabled={syncing}
                            onClick={async () => {
                                setSyncing(true);
                                try {
                                    const res = await syncPlatformMetrics();
                                    if (res.success) toast.success("Metrics synchronized");
                                    else toast.error("Sync failed");
                                } catch { toast.error("Network error"); }
                                finally { setSyncing(false); }
                            }}
                            className={`mt-6 w-fit rounded-full h-11 px-8 font-black uppercase tracking-widest text-[10px] ${t.btnPrimary(isDark, accent)}`}
                        >
                            {syncing ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                            RECALCULATE ALL DATA
                        </Button>
                    </div>

                    <div className={`p-6 rounded-3xl border ${t.border(isDark)} ${isDark ? 'bg-white/[0.02]' : 'bg-neutral-50'} flex flex-col justify-between`}>
                        <div className="space-y-2">
                            <h4 className={`text-sm font-black uppercase tracking-widest ${t.textPrimary(isDark)}`}>Database Integrity</h4>
                            <p className={`text-[11px] font-medium leading-relaxed ${t.textMuted(isDark)}`}>
                                Validates foreign key relationships and cleans up orphaned metadata. Recommended after massive course deletions.
                            </p>
                        </div>
                        <Button 
                            variant="outline"
                            className={`mt-6 w-fit rounded-full h-11 px-8 font-black uppercase tracking-widest text-[10px] border-2 ${t.btnOutline(isDark)} opacity-50 cursor-not-allowed`}
                        >
                            RUN DIAGNOSTICS (SOON)
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
});
