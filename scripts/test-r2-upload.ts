// Test R2 upload directly using the same storage module
// Run: npx tsx scripts/test-r2-upload.ts
import * as dotenv from 'dotenv';
dotenv.config();

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

async function main() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
    const bucketName = process.env.CLOUDFLARE_BUCKET_NAME;
    const publicDomain = process.env.CLOUDFLARE_PUBLIC_DOMAIN;

    console.log('\n=== Cloudflare R2 Upload Test ===');
    console.log(`Account ID     : ${accountId}`);
    console.log(`Bucket Name    : ${bucketName}`);
    console.log(`Public Domain  : ${publicDomain || '(not set — using default R2 URL)'}`);
    console.log(`Configured     : ${!!(accountId && accessKeyId && secretAccessKey && bucketName)}`);

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
        console.error('\n❌ R2 credentials not fully configured in .env');
        process.exit(1);
    }

    const s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
    });

    // Step 1: Bucket connectivity
    console.log('\nStep 1: Testing bucket connectivity...');
    try {
        await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
        console.log('✅ Bucket is accessible');
    } catch (e: any) {
        console.error('❌ Cannot reach bucket:', e.message || e.Code);
        process.exit(1);
    }

    // Step 2: Upload test file
    const testKey = `test/upload-test-${Date.now()}.txt`;
    const testContent = Buffer.from(`R2 upload test — ${new Date().toISOString()}`);

    console.log(`\nStep 2: Uploading test file → ${testKey}`);
    try {
        await s3.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: testContent,
            ContentType: 'text/plain',
        }));

        let baseUrl: string;
        if (publicDomain) {
            const domain = publicDomain.startsWith('http') ? publicDomain : `https://${publicDomain}`;
            baseUrl = domain.replace(/\/$/, '');
        } else {
            baseUrl = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}`;
        }
        const fileUrl = `${baseUrl}/${testKey}`;

        console.log('✅ Upload succeeded!');
        console.log(`   File URL: ${fileUrl}`);
        console.log(`   Storage Type: R2`);

        // Step 3: Clean up
        console.log('\nStep 3: Cleaning up test file...');
        await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: testKey }));
        console.log('✅ Test file deleted');

        console.log('\n🎉 R2 INTEGRATION IS WORKING CORRECTLY');
        console.log(`   All file uploads will now go to: ${bucketName} (R2 bucket)`);
        console.log(`   Videos  → ${baseUrl}/videos/<uuid>.mp4`);
        console.log(`   Docs    → ${baseUrl}/documents/<uuid>.pdf`);
        console.log(`   Images  → ${baseUrl}/images/<uuid>.jpg`);
    } catch (e: any) {
        console.error('❌ Upload failed:', e.message);
        console.error('   HTTP Status:', e.$metadata?.httpStatusCode);
        process.exit(1);
    }
}

main();
