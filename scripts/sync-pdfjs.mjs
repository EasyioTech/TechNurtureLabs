import path from 'node:path';
import fs from 'node:fs';

/**
 * PDF.js ASSET SYNCHRONIZATION
 * 
 * Runs during build/dev initialization.
 * Ensures the public/ directory has the matching worker and font assets 
 * for the currently installed pdfjs-dist version.
 */

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const NODE_MODULES_DIR = path.join(process.cwd(), 'node_modules');

function sync() {
    console.log('[Setup] Synchronizing PDF.js assets...');

    const assets = [
        {
            src: path.join(NODE_MODULES_DIR, 'pdfjs-dist/build/pdf.worker.min.mjs'),
            dest: path.join(PUBLIC_DIR, 'pdf.worker.min.mjs')
        },
        {
            src: path.join(NODE_MODULES_DIR, 'pdfjs-dist/cmaps'),
            dest: path.join(PUBLIC_DIR, 'pdfjs-cmaps')
        },
        {
            src: path.join(NODE_MODULES_DIR, 'pdfjs-dist/standard_fonts'),
            dest: path.join(PUBLIC_DIR, 'pdfjs-fonts')
        }
    ];

    for (const { src, dest } of assets) {
        try {
            if (!fs.existsSync(src)) {
                console.warn(`[Setup] Warning: Source not found: ${src}`);
                continue;
            }

            const stats = fs.statSync(src);
            if (stats.isDirectory()) {
                fs.cpSync(src, dest, { recursive: true, force: true });
            } else {
                fs.copyFileSync(src, dest);
            }
            console.log(`[Setup] ✓ Synced ${path.basename(dest)}`);
        } catch (err) {
            console.error(`[Setup] Error syncing ${src}:`, err);
        }
    }
}

sync();
