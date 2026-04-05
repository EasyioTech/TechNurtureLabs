'use client';

import React from 'react';

export const ManIcon = ({ className, width = "18", height = "18" }: { className?: string; width?: string; height?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width={width} height={height}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

export const WomanIcon = ({ className, width = "18", height = "18" }: { className?: string; width?: string; height?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width={width} height={height}>
        <circle cx="12" cy="7" r="4" />
        <path d="M12 11l-5 10h10l-5-10z" />
    </svg>
);
