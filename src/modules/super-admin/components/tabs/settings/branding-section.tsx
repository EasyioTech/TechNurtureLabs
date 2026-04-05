import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Palette, UploadCloud, Trash2, X, ImageIcon, Columns, Rows, Square, Loader2 } from 'lucide-react';
import { useAdminTheme, t } from '../../../theme-context';

interface BrandingSectionProps {
    platformName: string;
    setPlatformName: (val: string) => void;
    logoUrl: string;
    logoUploading: boolean;
    onLogoUpload: (file: File) => void;
    onLogoRemove: () => void;
    faviconUrl: string;
    faviconUploading: boolean;
    onFaviconUpload: (file: File) => void;
    onFaviconRemove: () => void;
    logoLayout: string;
    setLogoLayout: (val: string) => void;
    logoHeight: number;
    setLogoHeight: (val: number) => void;
    showPlatformName: boolean;
    setShowPlatformName: (val: boolean) => void;
    logoInputRef: React.RefObject<HTMLInputElement | null>;
    faviconInputRef: React.RefObject<HTMLInputElement | null>;
}

export function BrandingSection({
    platformName, setPlatformName,
    logoUrl, logoUploading, onLogoUpload, onLogoRemove,
    faviconUrl, faviconUploading, onFaviconUpload, onFaviconRemove,
    logoLayout, setLogoLayout,
    logoHeight, setLogoHeight,
    showPlatformName, setShowPlatformName,
    logoInputRef, faviconInputRef
}: BrandingSectionProps) {
    const { isDark, accent } = useAdminTheme();

    return (
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
                    {/* System Logo */}
                    <div className="space-y-4">
                        <Label className={`text-xs font-black uppercase tracking-[0.2em] ${t.textSecondary(isDark)}`}>System Logo</Label>
                        <div className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all overflow-hidden
                            ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}
                            w-full`} style={{ minHeight: 120 }}>
                            {logoUploading ? (
                                <div className="flex flex-col items-center gap-2 py-8">
                                    <Loader2 className={`animate-spin ${accent.text}`} size={28} />
                                    <span className={`text-xs font-bold ${t.textSecondary(isDark)}`}>Uploading…</span>
                                </div>
                            ) : logoUrl ? (
                                <div className="relative w-full flex items-center justify-center p-4 group">
                                    <img
                                        src={logoUrl}
                                        alt="Platform Logo"
                                        className="max-h-20 max-w-full object-contain"
                                        onError={(e) => { (e.target as HTMLImageElement).src = '/api/branding/logo'; }}
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); logoInputRef.current?.click(); }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors"
                                        >
                                            <UploadCloud size={13} /> Replace
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLogoRemove(); }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/70 hover:bg-red-500/90 text-white text-xs font-bold transition-colors"
                                        >
                                            <X size={13} /> Remove
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); logoInputRef.current?.click(); }}
                                    className="flex flex-col items-center gap-3 py-8 w-full hover:opacity-80 transition-opacity"
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                        <UploadCloud size={22} />
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Upload Logo</p>
                                        <p className={`text-[10px] mt-0.5 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>PNG, JPG, SVG, WebP · Max 2MB</p>
                                    </div>
                                </button>
                            )}
                        </div>
                        {logoUrl && (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); logoInputRef.current?.click(); }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                                >
                                    <UploadCloud size={12} /> Replace
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLogoRemove(); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                                >
                                    <Trash2 size={12} /> Remove
                                </button>
                            </div>
                        )}
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onLogoUpload(file);
                                e.target.value = '';
                            }}
                        />
                        <p className={`text-[11px] ${t.textMuted(isDark)} font-medium italic leading-relaxed`}>
                            Primary branding asset. Used in headers, dashboards, and portals.
                        </p>
                    </div>

                    {/* Favicon */}
                    <div className="space-y-4">
                        <Label className={`text-xs font-black uppercase tracking-[0.2em] ${t.textSecondary(isDark)}`}>Favicon (Browser Icon)</Label>
                        <div className="flex items-start gap-4">
                            <div className={`relative flex items-center justify-center rounded-2xl border-2 border-dashed transition-all overflow-hidden flex-shrink-0
                                ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}
                                w-20 h-20`}>
                                {faviconUploading ? (
                                    <Loader2 className={`animate-spin ${accent.text}`} size={18} />
                                ) : faviconUrl ? (
                                    <div className="relative w-full h-full flex items-center justify-center p-2 group">
                                        <img
                                            src={faviconUrl}
                                            alt="Favicon"
                                            className="w-10 h-10 object-contain"
                                            onError={(e) => { (e.target as HTMLImageElement).src = '/api/branding/favicon'; }}
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFaviconRemove(); }}
                                                className="text-white"
                                                title="Remove favicon"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); faviconInputRef.current?.click(); }}
                                        className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity w-full h-full justify-center"
                                    >
                                        <ImageIcon size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); faviconInputRef.current?.click(); }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                                >
                                    <UploadCloud size={12} /> {faviconUrl ? 'Replace' : 'Upload'}
                                </button>
                                {faviconUrl && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFaviconRemove(); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                                    >
                                        <Trash2 size={12} /> Remove
                                    </button>
                                )}
                                <p className={`text-[10px] ${t.textMuted(isDark)} font-medium leading-tight`}>
                                    Square icon for browser tabs.
                                    <br />PNG, ICO, SVG · Max 2MB
                                </p>
                            </div>
                        </div>
                        <input
                            ref={faviconInputRef}
                            type="file"
                            accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/webp"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onFaviconUpload(file);
                                e.target.value = '';
                            }}
                        />
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
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLogoLayout(layout.id); }}
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
    );
}
