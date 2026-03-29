'use server';

import { verifySession } from '@/lib/auth';

/**
 * Auth guard for super-admin server actions.
 * Throws a plain Error('UNAUTHORIZED') instead of calling redirect().
 *
 * Why: redirect() inside a server action throws NEXT_REDIRECT which forces
 * an immediate browser navigation — even for transient Redis/DB blips.
 * Using throw allows the client hook's catch block to decide whether to
 * redirect (persistent auth failure) or show a toast and retry (transient).
 */
export async function requireSuperAdmin() {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        throw new Error('UNAUTHORIZED');
    }
    return session;
}
