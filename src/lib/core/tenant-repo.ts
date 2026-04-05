import { db } from '@/lib/db';
import { eq, and, SQL } from 'drizzle-orm';
import { getSchoolId } from './context';
import { AppError } from './api-handler';

/**
 * TenantRepository
 * 
 * DESIGN:
 * - A high-level wrapper around the database that automatically scopes queries by the current tenant (School).
 * - Prevents IDOR by design: Developer doesn't have to remember 'where(eq(school_id, ...))'.
 */
export const TenantRepo = {
    /**
     * Finds a single record by its ID, ensuring it belongs to the current tenant.
     */
    async findOne<T>(
        table: any,
        id: string
    ): Promise<T | null> {
        const schoolId = getSchoolId();
        if (!schoolId) throw new AppError('Tenant context missing', 'TENANT_MISMATCH', 403);

        const result = await db.select()
            .from(table)
            .where(and(
                eq(table.id, id),
                eq(table.school_id, schoolId)
            ))
            .limit(1);

        return result.length > 0 ? (result[0] as T) : null;
    },

    /**
     * Lists all records for the current tenant.
     */
    async findMany<T>(
        table: any,
        extraFilter?: SQL
    ): Promise<T[]> {
        const schoolId = getSchoolId();
        if (!schoolId) throw new AppError('Tenant context missing', 'TENANT_MISMATCH', 403);

        const filters = [eq(table.school_id, schoolId)];
        if (extraFilter) filters.push(extraFilter);

        const result = await db.select()
            .from(table)
            .where(and(...filters));

        return result as T[];
    },

    /**
     * Updates a record only if it belongs to the current tenant.
     */
    async update<T>(
        table: any,
        id: string,
        data: any
    ) {
        const schoolId = getSchoolId();
        if (!schoolId) throw new AppError('Tenant context missing', 'TENANT_MISMATCH', 403);

        const result = await db.update(table)
            .set({ ...data, updated_at: new Date() })
            .where(and(
                eq(table.id, id),
                eq(table.school_id, schoolId)
            ))
            .returning();

        if (result.length === 0) {
            throw new AppError('Record not found or access denied', 'NOT_FOUND', 404);
        }

        return result[0];
    },

    /**
     * Deletes a record only if it belongs to the current tenant.
     */
    async delete(
        table: any,
        id: string
    ) {
        const schoolId = getSchoolId();
        if (!schoolId) throw new AppError('Tenant context missing', 'TENANT_MISMATCH', 403);

        const result = await db.delete(table)
            .where(and(
                eq(table.id, id),
                eq(table.school_id, schoolId)
            ))
            .returning();

        if (result.length === 0) {
            throw new AppError('Record not found or access denied', 'NOT_FOUND', 404);
        }

        return true;
    }
};
