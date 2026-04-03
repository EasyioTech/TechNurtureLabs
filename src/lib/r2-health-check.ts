/**
 * R2 Health Check Utility
 * Diagnoses R2 connectivity issues and provides detailed error reporting
 */
import { s3Client, isCloudflareConfigured } from './storage';
import { serverEnv } from './env.server';

export interface R2HealthStatus {
    configured: boolean;
    connected: boolean;
    credentials: {
        accountId: string;
        accessKeyId: string;
        bucketName: string;
    } | null;
    error?: string;
    endpoint?: string;
}

export async function checkR2Health(): Promise<R2HealthStatus> {
    const status: R2HealthStatus = {
        configured: isCloudflareConfigured,
        connected: false,
        credentials: null,
    };

    if (!isCloudflareConfigured) {
        status.error = 'R2 not configured: Missing CLOUDFLARE_ACCOUNT_ID or other credentials in env';
        return status;
    }

    status.credentials = {
        accountId: serverEnv.CLOUDFLARE_ACCOUNT_ID ? serverEnv.CLOUDFLARE_ACCOUNT_ID.slice(0, 8) + '...' : '(empty)',
        accessKeyId: serverEnv.CLOUDFLARE_ACCESS_KEY_ID ? serverEnv.CLOUDFLARE_ACCESS_KEY_ID.slice(0, 8) + '...' : '(empty)',
        bucketName: serverEnv.CLOUDFLARE_BUCKET_NAME || '(empty)',
    };

    status.endpoint = `https://${serverEnv.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;

    if (!s3Client) {
        status.error = 'S3 client not initialized';
        return status;
    }

    try {
        const { HeadBucketCommand } = await import('@aws-sdk/client-s3');
        const command = new HeadBucketCommand({ Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME });
        await s3Client.send(command);
        status.connected = true;
        return status;
    } catch (err: any) {
        status.error = err?.message || 'Unknown error';
        if (err?.$metadata?.httpStatusCode === 403) {
            status.error = 'Authentication failed: Check ACCESS_KEY_ID and SECRET_ACCESS_KEY';
        } else if (err?.$metadata?.httpStatusCode === 404) {
            status.error = 'Bucket not found: Check CLOUDFLARE_BUCKET_NAME';
        }
        return status;
    }
}

export function formatR2HealthReport(status: R2HealthStatus): string {
    const lines = [
        '═══════════════════════════════════════════════════════════',
        '                     R2 HEALTH CHECK REPORT                 ',
        '═══════════════════════════════════════════════════════════',
        '',
        `Configured:     ${status.configured ? '✅ Yes' : '❌ No'}`,
        `Connected:      ${status.connected ? '✅ Yes' : '❌ No'}`,
        `Endpoint:       ${status.endpoint || '(not available)'}`,
        '',
    ];

    if (status.credentials) {
        lines.push('Credentials (partially masked):');
        lines.push(`  Account ID:   ${status.credentials.accountId}`);
        lines.push(`  Access Key:   ${status.credentials.accessKeyId}`);
        lines.push(`  Bucket:       ${status.credentials.bucketName}`);
        lines.push('');
    }

    if (status.error) {
        lines.push(`❌ Error: ${status.error}`);
    } else if (status.connected) {
        lines.push('✅ R2 is working correctly');
    }

    lines.push('═══════════════════════════════════════════════════════════');
    return lines.join('\n');
}
