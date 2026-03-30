'use client';

import React from 'react';
import { useSchoolTheme, ts } from '../../theme-context';

interface StandardLoaderProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function StandardLoader({ message = 'Loading...', fullScreen = false, size = 'medium' }: StandardLoaderProps) {
  const { isDark } = useSchoolTheme();

  const sizeMap = {
    small: { container: 'w-8 h-8', border: 'border-2', text: 'text-xs' },
    medium: { container: 'w-12 h-12', border: 'border-4', text: 'text-sm' },
    large: { container: 'w-16 h-16', border: 'border-4', text: 'text-base' },
  };

  const config = sizeMap[size];

  const loader = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`relative ${config.container}`}>
        <div className={`absolute inset-0 rounded-full ${config.border} ${isDark ? 'border-indigo-500/20' : 'border-indigo-200'}`} />
        <div className={`absolute inset-0 rounded-full ${config.border} ${isDark ? 'border-indigo-600 border-t-transparent' : 'border-indigo-500 border-t-transparent'} animate-spin`} />
      </div>
      {message && (
        <p className={`font-bold ${config.text} ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${ts.pageBg(isDark)}`}>
        {loader}
      </div>
    );
  }

  return loader;
}
