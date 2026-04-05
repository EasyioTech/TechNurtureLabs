import { db } from '@/lib/db';
import { auditLogs } from '@/db/schema';
import { type PgTransaction } from 'drizzle-orm/pg-core';

type AuditLogAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'verify' | 'reject' | 'approved' | 'rejected';
type AuditEntityType = 'school' | 'student' | 'course' | 'lesson' | 'quiz' | 'subscription' | 'transaction' | 'user' | 'setting';

interface CreateAuditLogParams {
    userId: string;
    userType: string;
    action: AuditLogAction;
    entityType: AuditEntityType;
    entityId: string;
    oldValues?: any;
    newValues?: any;
    metadata?: Record<string, any>;
    tx?: any; // Drizzle transaction context
}

/**
 * Standardized Audit Logging helper to ensure consistent tracking across the platform.
 * Supports both standalone calls and transaction-wrapped calls.
 */
export async function createAuditLog({
    userId,
    userType,
    action,
    entityType,
    entityId,
    oldValues,
    newValues,
    metadata,
    tx
}: CreateAuditLogParams) {
    const dbClient = tx ?? db;
    
    try {
        await dbClient.insert(auditLogs).values({
            user_id: userId,
            user_type: userType,
            action,
            entity_type: entityType,
            entity_id: entityId,
            old_values: oldValues || null,
            new_values: newValues || null,
            metadata: metadata || null,
            created_at: new Date()
        } as any);
    } catch (err) {
        // We log the error but don't fail the primary operation if audit logging fails
        console.error('[Audit Log Failure]:', err);
    }
}
