/**
 * Client-side media utilities.
 */

/**
 * <img> onError handler for course thumbnails.
 * Attempts to fallback to the internal R2 proxy if the direct CDN URL fails.
 */
export function handleThumbnailError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
    const img = e.currentTarget;
    if (!img.dataset.proxyAttempt) {
        img.dataset.proxyAttempt = '1';
        try {
            const u = new URL(img.src);
            // Only retry if it's an external HTTPS URL, not already the internal proxy
            if (u.protocol === 'https:' && !u.pathname.startsWith('/api/')) {
                img.src = `/api/media/r2${u.pathname}`;
                return;
            }
        } catch {
            // img.src was relative or malformed — no retry possible
        }
    }
    // Both CDN and internal proxy failed — hide the broken img element
    img.style.display = 'none';
}
