import React from 'react';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ImageIcon, Upload, Loader2, Search, FileText, Film, Cloud, X
} from 'lucide-react';
import { useAdminTheme, t } from '../../theme-context';
import { AssetType } from './types';

// Tabs: Images, Documents, and Videos (Cloudflare Stream)
const TABS: { id: AssetType; label: string; icon: React.ElementType }[] = [
    { id: 'image', label: 'Images', icon: ImageIcon },
    { id: 'document', label: 'Documents', icon: FileText },
    { id: 'cloudflare_stream', label: 'Stream Videos', icon: Cloud },
];

interface LibraryHeaderProps {
    isUploading: boolean;
    onUploadClick: () => void;
    search: string;
    onSearchChange: (val: string) => void;
    activeTab: AssetType;
    onTabChange: (tab: AssetType) => void;
    filterType?: 'video' | 'image' | 'document';
    onSync?: () => void;
    isSyncing?: boolean;
    onClose?: () => void;
}

export function LibraryHeader({
    isUploading, onUploadClick,
    search, onSearchChange,
    activeTab, onTabChange, filterType,
    onSync, isSyncing, onClose
}: LibraryHeaderProps) {
    const { isDark, accent } = useAdminTheme();

    // Show only the tab that matches filterType if set
    const visibleTabs = filterType
        ? TABS.filter(tab => {
            if (filterType === 'video') return tab.id === 'cloudflare_stream';
            if (filterType === 'image') return tab.id === 'image';
            if (filterType === 'document') return tab.id === 'document';
            return true;
          })
        : TABS;

    return (
        <SheetHeader className={`px-6 pt-6 pb-5 border-b shrink-0 ${t.border(isDark)}`}>
            {/* Header with title and upload/sync buttons */}
            <SheetTitle className="flex items-center gap-3 mb-1">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent.bg} text-slate-900`}>
                    <ImageIcon size={18} />
                </div>
                <div className="text-left flex-1">
                    <h2 className={`text-xl font-[1000] tracking-tight ${t.textPrimary(isDark)}`}>
                        Media Library
                    </h2>
                    <p className={`text-[10px] font-semibold uppercase tracking-widest ${t.textMuted(isDark)}`}>
                        {filterType ? `Select ${filterType === 'document' ? 'documents' : filterType}s` : 'Select or upload assets'}
                    </p>
                </div>

                <div className="flex gap-2 shrink-0">
                    {onSync && (
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={isSyncing || isUploading}
                            onClick={onSync}
                            title="Sync with storage"
                            className={`w-9 h-9 p-0 rounded-lg border-2 ${t.border(isDark)} ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}
                        >
                            <Loader2 size={14} className={isSyncing ? 'animate-spin' : 'hidden'} />
                            {!isSyncing && <Cloud size={14} className={t.textMuted(isDark)} />}
                        </Button>
                    )}

                    <Button
                        size="sm"
                        disabled={isUploading || isSyncing}
                        onClick={onUploadClick}
                        className={`rounded-lg h-9 px-5 text-xs font-black uppercase tracking-wider ${accent.bg} text-slate-900 hover:shadow-lg transition-all`}
                    >
                        {isUploading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Upload size={14} className="mr-1.5" />}
                        Upload
                    </Button>

                    {onClose && (
                        <button
                            onClick={onClose}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                                isDark 
                                ? 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white' 
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                            }`}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </SheetTitle>

            {/* Search Bar */}
            <div className="relative mt-5">
                <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${t.textMuted(isDark)}`} />
                <Input
                    placeholder="Search by filename..."
                    value={search}
                    onChange={e => onSearchChange(e.target.value)}
                    className={`rounded-lg h-11 pl-11 pr-4 text-sm font-medium border-2 transition-all
                        ${isDark
                            ? 'bg-white/[0.05] text-white border-white/10 focus:border-white/20 focus:bg-white/[0.08]'
                            : 'bg-slate-50 text-slate-900 border-slate-200 focus:border-slate-300 focus:bg-white'}`}
                />
            </div>

            {/* Type Tabs - Only show if multiple tabs available */}
            {visibleTabs.length > 1 && (
                <div className="flex gap-2 mt-5">
                    {visibleTabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-black tracking-wide transition-all will-change-[background-color,border-color]
                                    ${isActive
                                        ? `${accent.bg} text-slate-900 shadow-md`
                                        : (isDark
                                            ? 'bg-white/[0.08] text-slate-400 border border-white/10 hover:bg-white/[0.12]'
                                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-150')}`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </SheetHeader>
    );
}
