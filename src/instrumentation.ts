/**
 * Next.js Instrumentation Hook
 * 
 * Runs on server start. Used here to launch consolidated background workers.
 */

export async function register() {
    console.log('--- NEXT_RUNTIME:', process.env.NEXT_RUNTIME, '---');

    // Only run in the Node.js runtime (not Edge)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        process.stdout.write('🚀 [Instrumentation] REGISTERING WORKERS...\n');

        try {
            // Using relative paths instead of @/ alias to avoid resolution issues in standalone register()
            const { startEventWorker } = await import('./lib/workers/event-worker');
            const { startStatsWorker } = await import('./lib/workers/stats-worker');
            const { videoWorker } = await import('./lib/workers/video-worker');

            console.log('🚀 [Instrumentation] Initializing workers...');

            startEventWorker();
            startStatsWorker();

            // Register video normalization worker for Cloudflare Stream processing
            if (videoWorker) {
                console.log('✅ [Instrumentation] Video normalization worker registered.');
            }

            console.log('✅ [Instrumentation] Workers started successfully.');
        } catch (error: any) {
            console.error('❌ [Instrumentation] CRITICAL ABORT:', error.message);
            console.error(error.stack);
        }
    }
}
