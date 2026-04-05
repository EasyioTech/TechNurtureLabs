import React from 'react';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Film, ImageIcon, Upload, Loader2, Search, Cloud, FileText, Folder, HardDrive
} from 'lucide-react';
import { useAdminTheme, t } from '../../theme-context';
import { AssetType } from './types';

const TABS: { id: AssetType; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'All Cloud Assets', icon: HardDrive },
    { id: 'video', label: 'R2 Videos', icon: Film },
    { id: 'cloudflare_stream', label: 'Stream Videos', icon: Cloud },
    { id: 'image', label: 'Cloud Images', icon: ImageIcon },
    { id: 'document', label: 'Cloud Documents', icon: FileText },
];

const FOLDERS = [
    { id: 'all', label: 'All Assets', color: 'text-slate-400' },
    { id: 'images', label: 'Images', color: 'text-emerald-400' },
    { id: 'videos', label: 'Videos', color: 'text-sky-400' },
    { id: 'documents', label: 'Documents', color: 'text-indigo-400' },
];

interface LibraryHeaderProps {
    filterType?: 'video' | 'image' | 'document';
    isUploading: boolean;
    onUploadClick: () => void;
    search: string;
    onSearchChange: (val: string) => void;
    activeTab: AssetType;
    onTabChange: (tab: AssetType) => void;
    activeFolder: string;
    onFolderChange: (folder: string) => void;
    folderEnforced?: boolean;
}

export function LibraryHeader({
    filterType, isUploading, onUploadClick,
    search, onSearchChange,
    activeTab, onTabChange,
    activeFolder, onFolderChange,
    folderEnforced
}: LibraryHeaderProps) {
    const { isDark, accent } = useAdminTheme();

    const visibleTabs = filterType
        ? TABS.filter(tab => {
            if (tab.id === 'all') return true;
            if (filterType === 'video') return tab.id === 'video' || tab.id === 'cloudflare_stream';
            return tab.id === filterType;
        })
        : TABS;

    return (
        <SheetHeader className={`px-6 pt-6 pb-4 border-b shrink-0 ${t.border(isDark)}`}>
            <SheetTitle className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${accent.bg} text-slate-900`}>
                    {filterType === 'video' ? <Film size={16} /> : <ImageIcon size={16} />}
                </div>
                <div className="text-left flex-1">
                    <h2 className={`text-lg font-[1000] tracking-tight ${t.textPrimary(isDark)}`}>
                        {filterType === 'video' ? 'Video Stream Library' : 'Media Library'}
                    </h2>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>
                        {filterType === 'video' ? 'Upload and select Cloudflare Stream videos' : 'Select a previously uploaded asset'}
                    </p>
                </div>

                <Button
                    size="sm"
                    disabled={isUploading}
                    onClick={onUploadClick}
                    className={`rounded-full h-8 px-4 text-xs font-black uppercase tracking-wider ${accent.bg} text-slate-900 shrink-0`}
                >
                    {isUploading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Upload size={14} className="mr-1.5" />}
                    Upload New
                </Button>
            </SheetTitle>


            {/* Search */}
            {filterType !== 'video' && (
                <div className="relative mt-4">
                    <Search size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 ${t.textMuted(isDark)}`} />
                    <Input
                        placeholder="Search by filename..."
                        value={search}
                        onChange={e => onSearchChange(e.target.value)}
                        className={`rounded-full h-10 pl-10 pr-4 text-sm font-medium border-2 focus-visible:ring-${accent.name}-400/50 ${isDark ? 'bg-white/[0.04] text-white border-white/5' : 'bg-slate-50 border-slate-200'}`}
                    />
                </div>
            )}

            {/* Tab Selectors */}
            {filterType !== 'video' && (
                <div className="flex gap-1 mt-3 overflow-x-auto no-scrollbar scrollbar-hide">
                    {visibleTabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black tracking-tight transition-all border-2 shrink-0
                                    ${isActive
                                        ? `${accent.bg} text-slate-900 border-${accent.name}-400`
                                        : (isDark ? 'bg-transparent text-slate-400 border-white/10 hover:bg-white/5' : 'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50')}`}
                            >
                                <tab.icon size={11} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Folder Selectors */}
            {filterType !== 'video' && !folderEnforced && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                    {FOLDERS.map(f => {
                        const isActive = activeFolder === f.id;
                        return (
                            <button
                                key={f.id}
                                onClick={() => onFolderChange(f.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap border-2
                                    ${isActive
                                        ? (isDark ? `${accent.bg} text-slate-900 border-white shadow-lg` : `${accent.bg} text-slate-900 border-slate-900 shadow-lg`)
                                        : (isDark ? 'bg-white/[0.03] border-white/5 text-slate-500 hover:bg-white/[0.06]' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100')}`}
                            >
                                <Folder size={12} className={isActive ? 'text-slate-900' : f.color} />
                                {f.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </SheetHeader>
    );
}
