'use client';

import React, { useState } from 'react';
import { ImageIcon, Upload, Loader2, Cloud, HardDrive, Search, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface MediaAsset {
    id: string;
    file_name: string;
    original_name: string;
    file_url: string;
    file_path: string;
    mime_type: string;
    file_size: number;
    storage_type: 'r2' | 'local';
    asset_type: 'video' | 'image' | 'document';
    created_at: string;
}

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
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [search, setSearch] = useState('');

    const loadAssets = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/media/library?type=image${folder ? `&folder=${folder}` : ''}`);
            if (res.ok) {
                const data = await res.json();
                setAssets(data);
            }
        } catch (err) {
            console.error('Failed to load assets', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
        if (!validTypes.includes(file.type) && !file.name.endsWith('.ico')) {
            toast.error('Invalid file type. Please upload PNG, JPG, SVG, or ICO.');
            return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            toast.error('File too large. Maximum size is 5MB.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('purpose', 'library');
        if (folder) formData.append('folder', folder);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Image uploaded');
                onChange(data.url);
                setIsPickerOpen(false);
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to upload');
        } finally {
            setUploading(false);
        }
    };

    const filteredAssets = assets.filter(a =>
        a.original_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-4 w-full">
            {label && (
                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {label}
                </label>
            )}

            <div
                onClick={() => {
                    setIsPickerOpen(true);
                    loadAssets();
                }}
                className={`relative ${aspect === 'video' ? 'aspect-video' : 'aspect-square'} rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden
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
                                <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Click to upload or select logo</p>
                                <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>PNG, JPG, SVG up to 5MB</p>
                            </>
                        )}
                    </>
                )}
            </div>

            {description && (
                <p className={`text-[10px] font-medium leading-relaxed ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                    {description}
                </p>
            )}

            <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                <DialogContent className={`max-w-2xl p-0 overflow-hidden border-0 ${isDark ? 'bg-[#0c0f1a] text-white' : 'bg-white'}`}>
                    <DialogHeader className={`px-8 py-6 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                        <DialogTitle className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                <ImageIcon size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Select Asset</h3>
                                <p className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Media Library</p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} size={16} />
                                <input
                                    type="text"
                                    placeholder="Search assets..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className={`w-full h-11 pl-12 pr-4 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all
                                        ${isDark ? 'border-white/5 focus:bg-white/[0.05] focus:border-indigo-500/50' : 'border-slate-200 focus:border-indigo-500'}
                                    `}
                                />
                            </div>
                            <Button
                                onClick={() => document.getElementById('logo-upload-input')?.click()}
                                disabled={uploading}
                                className={`h-11 px-6 rounded-2xl font-black text-xs uppercase tracking-widest ${isDark ? 'bg-white text-slate-900 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                            >
                                {uploading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Upload size={16} className="mr-2" />}
                                Upload New
                            </Button>
                            <input
                                id="logo-upload-input"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleUpload}
                            />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {loading ? (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
                                    <Loader2 size={40} className="animate-spin text-indigo-500" />
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Scanning Library...</p>
                                </div>
                            ) : filteredAssets.length === 0 ? (
                                <div className="col-span-full py-20 text-center">
                                    <p className="text-sm font-bold text-slate-500">No images found</p>
                                </div>
                            ) : (
                                filteredAssets.map(asset => (
                                    <div
                                        key={asset.id}
                                        onClick={() => {
                                            onChange(asset.file_url);
                                            setIsPickerOpen(false);
                                        }}
                                        className={`group relative aspect-square rounded-2xl border-2 overflow-hidden cursor-pointer transition-all
                                            ${value === asset.file_url
                                                ? 'border-indigo-500 bg-indigo-500/5'
                                                : isDark ? 'border-white/5 hover:border-white/20' : 'border-slate-100 hover:border-slate-300'
                                            }
                                        `}
                                    >
                                        <img src={asset.file_url} alt={asset.original_name} className="w-full h-full object-contain p-2" />

                                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-[9px] font-bold text-white truncate">{asset.original_name}</p>
                                        </div>

                                        <div className="absolute top-2 left-2 flex gap-1">
                                            {asset.storage_type === 'r2' ? (
                                                <div className="w-5 h-5 rounded-full bg-blue-500/20 backdrop-blur-md flex items-center justify-center text-blue-400" title="Cloud Storage">
                                                    <Cloud size={10} />
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-slate-500/20 backdrop-blur-md flex items-center justify-center text-slate-400" title="Local Storage">
                                                    <HardDrive size={10} />
                                                </div>
                                            )}
                                        </div>

                                        {value === asset.file_url && (
                                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg">
                                                <Check size={10} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
} 
