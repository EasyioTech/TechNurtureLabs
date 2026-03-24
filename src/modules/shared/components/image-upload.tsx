'use client';

import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { MediaLibraryPicker } from '@/modules/super-admin/components/media-library-picker';
import { useAuth } from '@/components/providers/auth-provider';

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    description?: string;
    isDark?: boolean;
    aspect?: 'video' | 'square';
    compact?: boolean;
    folder?: string;
}

export function ImageUpload({ value, onChange, label, description, isDark = false, aspect = 'video', compact = false, folder }: ImageUploadProps) {
    const { profile } = useAuth();
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    
    // Only super-admins can use the media library through this component
    const isSuperAdmin = profile?.role === 'super_admin';

    const handleClick = () => {
        if (!isSuperAdmin) {
            return; // Interaction disabled for non-admins
        }
        setIsPickerOpen(true);
    };

    return (
        <div className="space-y-4 w-full">
            {label && (
                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {label}
                </label>
            )}

            <div
                onClick={handleClick}
                className={`relative ${aspect === 'video' ? 'aspect-video' : 'aspect-square'} rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden
                    ${isSuperAdmin ? 'cursor-pointer' : 'cursor-default opacity-90'}
                    ${value
                        ? 'border-transparent bg-transparent'
                        : isDark
                            ? 'border-white/10 bg-white/5 hover:border-indigo-500/50 hover:bg-white/[0.08]'
                            : 'border-slate-200 bg-slate-50 hover:border-indigo-500 hover:bg-white'
                    }
                `}
            >
                {value ? (
                    <>
                        <img src={value} alt="Preview" className="w-full h-full object-contain p-4" />
                        {!compact && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <p className="text-white text-xs font-bold uppercase tracking-widest">Change Image</p>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className={`${compact ? 'w-8 h-8 rounded-xl' : 'w-12 h-12 rounded-2xl'} flex items-center justify-center ${compact ? '' : 'mb-3'} ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            <ImageIcon size={compact ? 16 : 24} />
                        </div>
                        {!compact && (
                            <>
                                <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {isSuperAdmin ? 'Click to manage library' : 'Admin Restricted'}
                                </p>
                                <p className={`text-[10px] mt-1 font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {isSuperAdmin ? 'PNG, JPG, SVG up to 5MB' : 'Managed by Super Admin'}
                                </p>
                            </>
                        )}
                    </>
                )}
            </div>

            {description && (
                <p className={`text-[10px] font-medium leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {description}
                </p>
            )}

            <MediaLibraryPicker
                open={isPickerOpen}
                onOpenChange={setIsPickerOpen}
                onSelect={(url: string) => {
                    onChange(url);
                    setIsPickerOpen(false);
                }}
                filterType="image"
                folder={folder}
                currentUrl={value}
            />
        </div>
    );
} 
