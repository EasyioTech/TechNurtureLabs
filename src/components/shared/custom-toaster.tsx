'use client';

import { Toaster } from 'sonner';

/**
 * Custom Toaster with minimal glass morphism design
 * - Positioned below navigation via CSS
 * - White text on subtle dark background
 * - Small compact size
 * - Responsive for all devices
 * - No performance impact (CSS-based styling only)
 */
export function CustomToaster() {
    return (
        <Toaster
            position="top-center"
            expand={false}
            richColors={false}
            closeButton={true}
        />
    );
}
