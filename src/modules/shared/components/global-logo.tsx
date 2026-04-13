import React from 'react';
import { cn } from '@/lib/utils';

export interface GlobalLogoProps {
    settings?: {
        logo_url?: string | null;
        platform_name?: string | null;
        logo_height?: number | null;
        logo_layout?: string | null;
        show_platform_name?: boolean | null;
    };
    className?: string;
    logoClassName?: string;
    nameClassName?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'auto'; // Presets if needed
    forceHeight?: number; // Override DB height
    showNameOverride?: boolean; // Override DB visibility
    isDark?: boolean;
}

/**
 * 🎨 GlobalLogo Component
 * Centralized branding component that respects platform settings.
 * Supports Layouts: Landscape, Portrait, and Icon Only.
 * Responsive to Logo Height and Platform Name visibility.
 */
export const GlobalLogo: React.FC<GlobalLogoProps> = ({
    settings,
    className,
    logoClassName,
    nameClassName,
    size = 'md',
    forceHeight,
    showNameOverride,
    isDark = false,
}) => {
    const logoUrl = settings?.logo_url;
    const platformName = settings?.platform_name || 'TechNurture';
    const dbHeight = settings?.logo_height || 40;
    const layout = settings?.logo_layout || 'landscape'; // landscape | portrait | icon_only
    const showName = showNameOverride ?? (settings?.show_platform_name !== false);
    
    // Determine height based on size preset or forceHeight or DB value
    const sizeMap = {
        sm: 24,
        md: 32,
        lg: 48,
        xl: 64,
        auto: dbHeight
    };
    
    const finalHeight = forceHeight || sizeMap[size];
    
    // Layout logic
    const isIconOnly = layout === 'icon_only';
    const isPortrait = layout === 'portrait';
    
    return (
        <div className={cn(
            "flex items-center gap-3 transition-all duration-300",
            isPortrait ? "flex-col text-center gap-1.5" : "flex-row",
            className
        )}>
            {/* Logo Image or Placeholder */}
            <div className={cn(
                "relative shrink-0 flex items-center justify-center transition-transform hover:scale-[1.02]",
                !logoUrl && "bg-slate-900 rounded-xl overflow-hidden shadow-sm",
                logoClassName
            )}
            style={{ 
                height: finalHeight,
                width: !logoUrl ? finalHeight : 'auto'
            }}>
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt={platformName}
                        className="h-full w-auto object-contain"
                        style={{ height: finalHeight }}
                        onError={(e) => {
                            // Fallback if image fails to load — try default logo
                            (e.target as HTMLImageElement).src = '/assets/logo.jpg';
                        }}
                    />
                ) : (
                    <img
                        src="/assets/logo.jpg"
                        alt={platformName}
                        className="h-full w-auto object-contain"
                        style={{ height: finalHeight }}
                        onError={(e) => {
                            // If fallback logo fails, show icon
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                                parent.classList.remove('bg-slate-900', 'rounded-xl');
                                parent.classList.add('bg-slate-900', 'rounded-xl', 'p-2');
                                if (!parent.querySelector('svg')) {
                                    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                    svg.setAttribute('viewBox', '0 0 24 24');
                                    svg.setAttribute('fill', 'none');
                                    svg.setAttribute('stroke', 'white');
                                    svg.setAttribute('stroke-width', '2');
                                    svg.style.width = (finalHeight * 0.5) + 'px';
                                    svg.style.height = (finalHeight * 0.5) + 'px';
                                    parent.appendChild(svg);
                                }
                            }
                        }}
                    />
                )}
            </div>

            {/* Platform Name */}
            {!isIconOnly && showName && (
                <span className={cn(
                    "font-black tracking-tight whitespace-nowrap transition-colors",
                    isPortrait ? "text-sm" : "text-lg md:text-xl",
                    isDark ? "text-white" : "text-slate-900",
                    nameClassName
                )}>
                    {platformName}
                </span>
            )}
        </div>
    );
};
