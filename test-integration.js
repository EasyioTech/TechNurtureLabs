
const postgres = require('postgres');
const Redis = require('ioredis');

async function test() {
    console.log('-- Complex Integration Test Start --');
    
    const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/postgres';
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    const sql = postgres(dbUrl);
    const redis = new Redis(redisUrl);
    
    try {
        // 1. Fetch Admin
        const adms = await sql`SELECT id FROM super_admins LIMIT 1`;
        if (adms.length === 0) {
            console.error('No admin found in DB');
            process.exit(1);
        }
        const admId = adms[0].id;
        console.log('Admin ID:', admId);

        // 2. Insert Course
        const slug = 'test-c-' + Date.now();
        await sql`INSERT INTO courses (title, slug, created_by) VALUES ('Test Integration Course', ${slug}, ${admId})`;
        console.log('Course Created:', slug);

        // 3. Insert Media Asset (Pending)
        const assets = await sql`
            INSERT INTO media_assets (file_name, original_name, file_path, mime_type, storage_type, asset_type, processing_status)
            VALUES ('integration-test.mp4', 'test.mp4', 'videos/integration.mp4', 'video/mp4', 'r2', 'video', 'pending')
            RETURNING id
        `;
        const assetId = assets[0].id;
        console.log('Asset Created:', assetId);

        // 4. Enqueue in Redis
        const job = {
            assetId: assetId,
            filePath: 'videos/integration.mp4',
            folder: 'library',
            timestamp: Date.now()
        };
        await redis.lpush('queue:video_transcode', JSON.stringify(job));
        console.log('Job Enqueued in Redis');

        // 5. Verify Queue Length
        const len = await redis.llen('queue:video_transcode');
        console.log('Current Queue Length:', len);

        console.log('✅ Integration Test Phase 1 Complete.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Integration Test Failed:', err);
        process.exit(1);
    }
}

test();
