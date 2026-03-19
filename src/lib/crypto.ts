/**
 * AES-256-GCM encryption helpers for secrets stored in the database.
 *
 * Used for: TOTP two_factor_secret values.
 *
 * Storage format (colon-separated hex strings):
 *   "<iv_hex>:<auth_tag_hex>:<ciphertext_hex>"
 *
 * Setup: add APP_ENCRYPTION_KEY to .env (64 hex chars = 32 bytes):
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Graceful degradation: if APP_ENCRYPTION_KEY is not set (dev/test), the
 * helpers act as a passthrough (no encryption). Log a warning so it is visible.
 * In production the key MUST be set — the verify route will fail at runtime if
 * it tries to decrypt a value it cannot.
 */

import crypto from 'crypto';
// import 'server-only';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;   // 96-bit IV recommended for GCM
const TAG_BYTES = 16;  // GCM auth tag

function getKey(): Buffer | null {
    const hex = process.env.APP_ENCRYPTION_KEY;
    if (!hex || hex.length < 64) {
        if (process.env.NODE_ENV === 'production') {
            console.error('[crypto] CRITICAL: APP_ENCRYPTION_KEY is not set in production. TOTP secrets are unencrypted.');
        }
        return null;
    }
    return Buffer.from(hex.slice(0, 64), 'hex');
}

/**
 * Encrypt a plaintext secret.
 * Returns a storable string or the original value if no key is configured.
 */
export function encryptSecret(plaintext: string): string {
    const key = getKey();
    if (!key) return plaintext; // passthrough in dev without key

    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

/**
 * Decrypt a stored secret.
 * Returns the plaintext, or the input as-is if it looks like a legacy
 * unencrypted value (no colons) — allows zero-downtime migration.
 */
export function decryptSecret(stored: string): string {
    const key = getKey();

    // If no key: return as-is (dev passthrough or legacy plaintext)
    if (!key) return stored;

    const parts = stored.split(':');
    if (parts.length !== 3) {
        // Legacy plaintext value (stored before encryption was enabled).
        // Return as-is — the admin should re-enable 2FA to rotate the secret.
        return stored;
    }

    const [ivHex, tagHex, ciphertextHex] = parts;
    try {
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const ciphertext = Buffer.from(ciphertextHex, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8');
    } catch {
        // Decryption failure — key mismatch or corrupted data.
        // Throw so the caller returns a 500 rather than silently accepting a wrong secret.
        throw new Error('[crypto] Failed to decrypt TOTP secret. Check APP_ENCRYPTION_KEY.');
    }
}
