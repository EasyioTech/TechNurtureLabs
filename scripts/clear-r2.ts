import 'dotenv/config';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { serverEnv } from '../src/lib/env.server';

/**
 * Empty the Cloudflare R2 bucket.
 */
async function clearR2() {
    if (!serverEnv.CLOUDFLARE_ACCOUNT_ID || !serverEnv.CLOUDFLARE_ACCESS_KEY_ID || !serverEnv.CLOUDFLARE_SECRET_ACCESS_KEY || !serverEnv.CLOUDFLARE_BUCKET_NAME) {
        console.error('Cloudflare R2 is not fully configured in environment variables.');
        process.exit(1);
    }

    const s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${serverEnv.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: serverEnv.CLOUDFLARE_ACCESS_KEY_ID,
            secretAccessKey: serverEnv.CLOUDFLARE_SECRET_ACCESS_KEY,
        },
        forcePathStyle: true,
    });

    const bucketName = serverEnv.CLOUDFLARE_BUCKET_NAME;
    console.log(`Starting cleanup for R2 bucket: ${bucketName}...`);

    let totalDeleted = 0;
    let continuationToken: string | undefined = undefined;

    try {
        do {
            const listParams: any = {
                Bucket: bucketName,
                MaxKeys: 1000,
            };
            if (continuationToken) {
                listParams.ContinuationToken = continuationToken;
            }

            const listCommand = new ListObjectsV2Command(listParams);
            const listResponse = await s3Client.send(listCommand);
            const objects = listResponse.Contents;

            if (objects && objects.length > 0) {
                const deleteParams = {
                    Bucket: bucketName,
                    Delete: {
                        Objects: objects.map((obj: any) => ({ Key: obj.Key })),
                        Quiet: false,
                    },
                };
                const deleteCommand = new DeleteObjectsCommand(deleteParams);
                const deleteResponse = await s3Client.send(deleteCommand);
                const deletedCount = deleteResponse.Deleted?.length || 0;
                totalDeleted += deletedCount;
                console.log(`Deleted ${deletedCount} objects... (Total: ${totalDeleted})`);
            }

            continuationToken = listResponse.NextContinuationToken;
        } while (continuationToken);

        console.log(`Successfully cleared R2 bucket. Total objects deleted: ${totalDeleted}`);
    } catch (error) {
        console.error('Error clearing R2 bucket:', error);
        process.exit(1);
    }
}

clearR2();
