'use client';

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Info, HelpCircle } from 'lucide-react';

interface MetricTooltipProps {
  label: string;
  value: string | number;
  shortHint: string;
  description: string;
  thresholds?: Record<string, string>;
  isDark: boolean;
}

/**
 * MetricTooltip - Shows quick tooltip on hover
 * Click info icon for detailed explanation
 */
export function MetricTooltip({
  label,
  value,
  shortHint,
  description,
  thresholds,
  isDark,
}: MetricTooltipProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {label}
          </p>
          <p className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>
            {value}
          </p>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button className={`flex-shrink-0 p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
              <HelpCircle size={16} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className="text-sm">{shortHint}</p>
          </TooltipContent>
        </Tooltip>

        <Popover>
          <PopoverTrigger asChild>
            <button className={`flex-shrink-0 p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
              <Info size={16} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
            </button>
          </PopoverTrigger>
          <PopoverContent side="right" className="w-80">
            <div className="space-y-3">
              <h4 className="font-bold text-sm">{label}</h4>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{description}</p>
              {thresholds && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded text-xs space-y-1">
                  <p className="font-bold text-slate-600 dark:text-slate-400">Healthy Thresholds:</p>
                  {Object.entries(thresholds).map(([key, val]) => (
                    <p key={key} className="text-slate-700 dark:text-slate-300">
                      • {key}: {val}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </TooltipProvider>
  );
}
