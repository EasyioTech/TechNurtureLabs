import React from 'react';

export type AssetType = 'all' | 'video' | 'image' | 'document' | 'cloudflare_stream';

export interface MediaAsset {
    id: string;
    file_name: string;
    original_name: string;
    file_url: string;
    file_path: string;
    mime_type: string;
    file_size: number;
    storage_type: 'r2' | 'cloudflare_stream';
    asset_type: 'video' | 'image' | 'document';
    created_at: string;
}

export interface MediaLibraryPickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (url: string, assetId: string) => void;
    /** If set, only assets of this type are shown */
    filterType?: 'video' | 'image' | 'document';
    /** Current selected URL to highlight */
    currentUrl?: string;
    /** Filter by folder */
    folder?: string;
}
