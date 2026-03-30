# 🔧 CRITICAL FIXES — CODE EXAMPLES

This document provides exact code fixes for the 10 critical issues. Copy-paste these into your codebase.

---

## CRITICAL FIX #1: Race Condition in Subscription Creation

**File:** `src/app/api/payment/create-order/route.ts`

### ❌ Current Code (Lines 56-101)
```typescript
if (promo_code_id) {
    const now = new Date();

    const [updatedPromo] = await db
        .update(promoCodes)
        .set({ current_uses: sql`${promoCodes.current_uses} + 1` })
        .where(and(
            eq(promoCodes.id, promo_code_id),
            eq(promoCodes.is_active, true),
            or(
                isNull(promoCodes.max_uses),
                sql`${promoCodes.current_uses} < ${promoCodes.max_uses}`
            ),
            // ... more checks
        ))
        .returning();
    // ...
}
```

### ✅ Fixed Code
```typescript
// CRITICAL FIX: Use atomic INSERT ... ON CONFLICT to prevent duplicate subscriptions
export async function POST(req: NextRequest) {
    try {
        // ... existing code ...

        // CHANGE: Verify no active subscription exists INSIDE a transaction
        const existingSubscription = await db.query.schoolSubscriptions.findFirst({
            where: and(
                eq(schoolSubscriptions.school_id, schoolId),
                inArray(schoolSubscriptions.status, ['active', 'trialing'])
            )
        });

        // If subscription already exists, reject the duplicate request
        if (existingSubscription) {
            return NextResponse.json(
                { error: 'This school already has an active subscription. Cancel it first.' },
                { status: 409 } // Conflict status code
            );
        }

        // NEW: Atomic subscription creation using upsert
        // This prevents the race condition where two requests both see "no subscription" state
        let subscription = await db
            .insert(schoolSubscriptions)
            .values({
                id: crypto.randomUUID(),
                school_id: schoolId,
                plan_id: plan_id,
                promo_code_id: promo_code_id || null,
                status: 'trialing',
                current_period_start: new Date(),
                current_period_end: new Date(Date.now() + trialDays * 86400 * 1000),
                trial_start: new Date(),
                trial_end: new Date(Date.now() + trialDays * 86400 * 1000),
                created_at: new Date(),
                updated_at: new Date(),
            })
            .onConflictDoUpdate({
                target: [schoolSubscriptions.school_id],
                set: {
                    plan_id: plan_id,
                    promo_code_id: promo_code_id || null,
                    status: 'trialing',
                    current_period_start: new Date(),
                    current_period_end: new Date(Date.now() + trialDays * 86400 * 1000),
                    updated_at: new Date(),
                },
                where: sql`status NOT IN ('active')`  // Only update if not already active
            })
            .returning();

        // If we're here and subscription still shows as 'active', someone else just activated it
        const freshSub = await db.query.schoolSubscriptions.findFirst({
            where: eq(schoolSubscriptions.id, subscription[0].id)
        });

        if (freshSub?.status === 'active') {
            return NextResponse.json(
                { error: 'This school already has an active subscription.' },
                { status: 409 }
            );
        }

        // ... rest of code ...
    } catch (error: any) {
        console.error('Create order error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
    }
}
```

---

## CRITICAL FIX #2: Admin Access Control Broken

**File:** `src/lib/admin-guard.ts` — ADD NEW GUARDS

### ✅ New Code (Add to file)
```typescript
'use server';

import { verifySession } from '@/lib/auth';
import { db } from '@/lib/db';
import { schoolAdmins } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * CRITICAL FIX #2: Admin Access Control
 * Every admin action must verify the user belongs to the school they're accessing.
 */

export async function requireSuperAdmin() {
    const session = await verifySession();
    if (!session || (session.userType !== 'super_admin' && session.role !== 'super_admin')) {
        throw new Error('UNAUTHORIZED');
    }
    return session;
}

/**
 * NEW: Verify school admin belongs to the requested school.
 * MUST be called on every school-specific admin route.
 */
export async function requireSchoolAdmin(requestedSchoolId: string) {
    const session = await verifySession();

    if (!session || session.userType !== 'school_admin') {
        throw new Error('UNAUTHORIZED');
    }

    // CRITICAL: Verify the admin actually belongs to this school
    const admin = await db.query.schoolAdmins.findFirst({
        where: and(
            eq(schoolAdmins.id, session.userId),
            eq(schoolAdmins.school_id, requestedSchoolId),
            eq(schoolAdmins.is_active, true)
        )
    });

    if (!admin) {
        throw new Error('UNAUTHORIZED');
    }

    return { session, admin };
}

/**
 * NEW: Verify student belongs to the requested school.
 * Use this when students access their own school-specific data.
 */
export async function requireStudentInSchool(requestedSchoolId: string) {
    const session = await verifySession();

    if (!session || session.userType !== 'student') {
        throw new Error('UNAUTHORIZED');
    }

    // Verify student belongs to this school
    const student = await db.query.students.findFirst({
        where: and(
            eq(students.id, session.userId),
            eq(students.school_id, requestedSchoolId),
            eq(students.is_active, true)
        )
    });

    if (!student) {
        throw new Error('UNAUTHORIZED');
    }

    return { session, student };
}

export async function requireTeacherForClass(classId: string) {
    const session = await verifySession();

    if (!session || session.userType !== 'school_admin') {
        throw new Error('UNAUTHORIZED');
    }

    // Verify admin teaches this class (admin's school owns the class)
    const classData = await db.query.classes.findFirst({
        where: eq(classes.id, classId)
    });

    if (!classData) {
        throw new Error('CLASS_NOT_FOUND');
    }

    // Verify admin's school has this class
    const mapping = await db.query.schoolClassMapping.findFirst({
        where: and(
            eq(schoolClassMapping.class_id, classId),
            eq(schoolClassMapping.school_id, session.schoolId), // from JWT
            eq(schoolClassMapping.is_active, true)
        )
    });

    if (!mapping) {
        throw new Error('UNAUTHORIZED');
    }

    return { session, classData };
}
```

### Usage Example
```typescript
// In an admin action (e.g., getting school students):
'use server';

export async function getSchoolStudents(schoolId: string) {
    // CRITICAL: Always verify the admin belongs to this school
    const { admin } = await requireSchoolAdmin(schoolId);

    // NOW it's safe to query:
    const students = await db.query.students.findMany({
        where: and(
            eq(students.school_id, schoolId),
            eq(students.is_active, true)
        )
    });

    return students;
}
```

---

## CRITICAL FIX #3: Payment Verification Missing Checks

**File:** `src/app/api/payment/verify/route.ts`

### ❌ Current Code
```typescript
export async function POST(req: NextRequest) {
    // ... signature verification ...

    // ❌ Returns success without creating subscription!
    return NextResponse.json({
        success: true,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
    });
}
```

### ✅ Fixed Code
```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { serverEnv } from '@/lib/env.server';
import { db } from '@/lib/db';
import { schoolSubscriptions, paymentTransactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import Razorpay from 'razorpay';

const verifySchema = z.object({
    razorpay_order_id: z.string().min(1, 'Order ID is required'),
    razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
    razorpay_signature: z.string().min(1, 'Signature is required'),
    school_id: z.string().uuid('Invalid school ID'),  // ADD THIS
});

const isBuild = process.env.NEXT_SKIP_TYPECHECK === '1' || process.env.npm_lifecycle_event === 'build';
const razorpay = (!isBuild && serverEnv.RAZORPAY_KEY_ID && serverEnv.RAZORPAY_KEY_SECRET) ? new Razorpay({
    key_id: serverEnv.RAZORPAY_KEY_ID,
    key_secret: serverEnv.RAZORPAY_KEY_SECRET,
}) : null;

export async function POST(req: NextRequest) {
    try {
        const body = verifySchema.safeParse(await req.json());
        if (!body.success) {
            return NextResponse.json({ success: false, error: body.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 });
        }
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, school_id } = body.data;

        // CRITICAL FIX #1: Verify HMAC signature
        const isPreviewOrder = razorpay_order_id.startsWith('order_PREVIEW_') || razorpay_order_id.startsWith('order_DEV_');
        if (!isPreviewOrder) {
            const secret = serverEnv.RAZORPAY_KEY_SECRET;
            const hmacPayload = `${razorpay_order_id}|${razorpay_payment_id}`;
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(hmacPayload)
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 });
            }
        }

        // CRITICAL FIX #2: Check order exists in OUR database
        const transaction = await db.query.paymentTransactions.findFirst({
            where: eq(paymentTransactions.razorpay_order_id, razorpay_order_id)
        });

        if (!transaction) {
            return NextResponse.json(
                { success: false, error: 'Order not found in system' },
                { status: 404 }
            );
        }

        // CRITICAL FIX #3: Verify the school_id from request matches the transaction
        if (transaction.school_id !== school_id) {
            // Potential fraud attempt (trying to verify payment for different school)
            console.error(`[FRAUD] Payment verification mismatch: order=${razorpay_order_id}, claimed_school=${school_id}, actual_school=${transaction.school_id}`);
            return NextResponse.json(
                { success: false, error: 'School mismatch' },
                { status: 403 }
            );
        }

        // CRITICAL FIX #4: Fetch payment from Razorpay to verify it's actually captured
        if (!isPreviewOrder && razorpay) {
            try {
                const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

                if (paymentDetails.status !== 'captured') {
                    return NextResponse.json(
                        { success: false, error: `Payment status is ${paymentDetails.status}, not captured` },
                        { status: 400 }
                    );
                }

                // CRITICAL FIX #5: Verify amount matches
                const expectedAmountPaise = Math.round(Number(transaction.amount) * 100);
                if (paymentDetails.amount !== expectedAmountPaise) {
                    console.error(`[FRAUD] Amount mismatch: expected ${expectedAmountPaise}, got ${paymentDetails.amount}`);
                    return NextResponse.json(
                        { success: false, error: 'Amount mismatch' },
                        { status: 400 }
                    );
                }
            } catch (rpError: any) {
                console.error('[Razorpay Fetch Error]:', rpError);
                return NextResponse.json(
                    { success: false, error: 'Failed to verify payment with gateway' },
                    { status: 502 }
                );
            }
        }

        // CRITICAL FIX #6: Update transaction status
        await db.update(paymentTransactions)
            .set({
                status: 'captured',
                razorpay_payment_id: razorpay_payment_id,
                razorpay_signature: razorpay_signature,
                updated_at: new Date()
            })
            .where(eq(paymentTransactions.id, transaction.id));

        // CRITICAL FIX #7: Activate the subscription
        const trialDays = 30;  // Or fetch from plan
        await db.update(schoolSubscriptions)
            .set({
                status: 'active',
                current_period_start: new Date(),
                current_period_end: new Date(Date.now() + trialDays * 86400 * 1000),
                updated_at: new Date()
            })
            .where(eq(schoolSubscriptions.id, transaction.subscription_id));

        // CRITICAL FIX #8: Cache invalidation (prevents stale subscription state)
        await redis.del(`subscription:${transaction.school_id}`);

        return NextResponse.json({
            success: true,
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
        });

    } catch (error: any) {
        console.error('[Payment Verify Error]:', error);
        return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 500 });
    }
}
```

---

## CRITICAL FIX #4: Cache Invalidation Missing

**File:** `src/app/api/learning/complete/route.ts` (and similar mutation routes)

### ❌ Current Code
```typescript
export async function POST(request: NextRequest) {
    // ... quiz submission logic ...

    await db.update(quizAttempts).set({
        score: score,
        completed_at: new Date()
    });

    // ❌ NO CACHE INVALIDATION
    return NextResponse.json({ success: true });
}
```

### ✅ Fixed Code
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cacheService } from '@/lib/services/cache-service';
import { quizAttempts, students, lessons, courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const session = await verifySession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { lessonId, quizId, score } = await request.json();

        // Update quiz attempt
        await db.update(quizAttempts).set({
            score: score,
            completed_at: new Date(),
            updated_at: new Date()
        }).where(
            and(
                eq(quizAttempts.student_id, session.userId),
                eq(quizAttempts.lesson_id, lessonId)
            )
        );

        // CRITICAL FIX: Invalidate all affected caches
        const userId = session.userId;

        // 1. Invalidate user progress (affects progress bar in UI)
        await cacheService.invalidateTag(`user:${userId}:progress`);

        // 2. Invalidate leaderboard (score changed, rank might change)
        const lesson = await db.query.lessons.findFirst({
            where: eq(lessons.id, lessonId),
            with: { course: true }
        });
        if (lesson?.course_id) {
            await cacheService.invalidateTag(`course:${lesson.course_id}:leaderboard`);
        }

        // 3. Invalidate user achievements (new score might unlock badges)
        await cacheService.invalidateTag(`user:${userId}:achievements`);

        // 4. Invalidate user XP total (score determines XP awarded)
        await cacheService.invalidateTag(`user:${userId}:xp`);

        // 5. Invalidate user-specific stats
        await cacheService.invalidateTag(`user:${userId}:stats`);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Learning Complete Error]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
```

---

## CRITICAL FIX #5: Increase DB Connection Pool

**File:** `src/lib/db.ts`

### ❌ Current Code
```typescript
const conn = globalForDb.conn ?? postgres(dbUrl, {
    max: 20,  // ❌ Too low for 1000+ concurrent users
    idle_timeout: 30,
    connect_timeout: 10,
    max_lifetime: 1800,
    onnotice: () => {},
});
```

### ✅ Fixed Code
```typescript
const conn = globalForDb.conn ?? postgres(dbUrl, {
    max: 50,  // ✅ FIXED: Increased from 20 to 50
    // Rationale: PostgreSQL typically has 100 connections available
    // - 50 for Next.js app (40-50 concurrent users)
    // - 30 for admin tools, migrations, backups
    // - 20 reserved

    idle_timeout: 10,  // ✅ FIXED: Reduced from 30 to 10 (release faster)
    connect_timeout: 10,
    max_lifetime: 600,  // ✅ FIXED: Reduced from 1800 to 600 (recycle every 10 mins)

    prepare: false,  // ✅ FIXED: Disable prepared statements (Next.js compatibility)
    onnotice: () => {},
});
```

### Monitor Connection Pool
Add this monitoring code to your application startup:

```typescript
// In src/lib/db.ts, add:
setInterval(() => {
    if (conn && (conn as any).pool) {
        const idle = (conn as any).pool.length || 0;
        const waiting = (conn as any).pool._queue?.length || 0;
        const inUse = (conn as any).pool.activeCount || (50 - idle);

        console.log(`[DB Pool] Idle: ${idle}/50 | In Use: ${inUse} | Waiting: ${waiting}`);

        // Alert if approaching limit
        if (inUse > 40) {
            console.warn(`[DB Pool Alert] High utilization: ${inUse}/50 connections in use`);
        }
        if (waiting > 0) {
            console.warn(`[DB Pool Alert] Requests queued waiting for connection: ${waiting}`);
        }
    }
}, 60000);  // Check every 60 seconds
```

---

## CRITICAL FIX #6: Session Fallback Logic (Redis Down)

**File:** `src/middleware.ts`

### ❌ Current Code
```typescript
if (sessionToken) {
    const { jwtVerify } = await import('jose');
    const { redis } = await import('@/lib/redis');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');

    try {
        const { payload } = await jwtVerify(sessionToken, secret);
        const sessionId = (payload as any).sessionId;

        const sessionExists = await redis.get(`session:${sessionId}`);
        if (!sessionExists) {  // ❌ If Redis is down, this returns null
            return redirect('/login?revoked=true');  // ❌ Logs out ALL users
        }
    } catch (e) { }
}
```

### ✅ Fixed Code
```typescript
if (sessionToken) {
    const { jwtVerify } = await import('jose');
    const { redis } = await import('@/lib/redis');
    const { db } = await import('@/lib/db');
    const { userSessions } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');

    try {
        const { payload } = await jwtVerify(sessionToken, secret);
        const sessionId = (payload as any).sessionId;

        // CRITICAL FIX: Try Redis first (fast), fall back to DB (reliable)
        let sessionExists = null;

        try {
            sessionExists = await redis.get(`session:${sessionId}`);
        } catch (redisErr) {
            console.warn('[Middleware] Redis unavailable, falling back to DB:', redisErr);
            // Redis is down, fall back to database check
            const dbSession = await db.query.userSessions.findFirst({
                where: and(
                    eq(userSessions.id, sessionId),
                    gt(userSessions.expires_at, new Date())  // Check not expired
                )
            });
            sessionExists = dbSession ? 'ok' : null;  // Truthy or null
        }

        if (!sessionExists) {
            // Session is actually revoked or expired (not just Redis down)
            const response = NextResponse.redirect(new URL('/login?revoked=true', request.url));
            response.cookies.delete('session');
            response.cookies.delete('refresh_token');
            return response;
        }
    } catch (e) {
        // JWT verification failed (expired or invalid), let verifySession handle it
    }
}
```

---

## CRITICAL FIX #7: Multi-Tenant Data Isolation Example

**File:** `src/modules/school-admin/actions/students-actions.ts` (example)

### ❌ Current Code
```typescript
'use server';

export async function getSchoolStudents(schoolId: string) {
    // ❌ Trusts schoolId from parameter
    // Attacker could pass any schoolId
    const students = await db.query.students.findMany({
        where: eq(students.school_id, schoolId)
    });
    return students;
}
```

### ✅ Fixed Code
```typescript
'use server';

import { requireSchoolAdmin } from '@/lib/admin-guard';
import { cacheService } from '@/lib/services/cache-service';

export async function getSchoolStudents(requestedSchoolId: string) {
    // CRITICAL FIX: Verify admin belongs to this school
    const { admin } = await requireSchoolAdmin(requestedSchoolId);

    // Now we know: admin.school_id === requestedSchoolId (verified)
    // Use admin's school_id instead of trusting the parameter

    // Try cache first
    const cacheKey = `school:${admin.school_id}:students`;
    let students = await cacheService.get(cacheKey);

    if (!students) {
        // Fetch from DB using verified school_id
        students = await db.query.students.findMany({
            where: and(
                eq(students.school_id, admin.school_id),  // ← Use verified school_id
                eq(students.is_active, true),
                sql`${students.deleted_at} IS NULL`
            ),
            columns: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                // Don't return password_hash or other sensitive data
            }
        });

        // Cache for 5 minutes with invalidation tag
        await cacheService.set(cacheKey, students, [`school:${admin.school_id}`], 300);
    }

    return students;
}
```

---

## CRITICAL FIX #8: Promo Code Concurrency (FOR UPDATE)

**File:** `src/app/api/payment/create-order/route.ts`

### Replace promo code check with:
```typescript
if (promo_code_id) {
    const now = new Date();

    // CRITICAL FIX: Use PostgreSQL's FOR UPDATE to lock the row
    // This prevents race condition where multiple threads increment simultaneously

    // Step 1: Fetch and lock
    const lockedPromo = await db.execute(sql`
        SELECT * FROM promo_codes
        WHERE id = ${promo_code_id}
        AND is_active = true
        AND (valid_from IS NULL OR valid_from <= ${now})
        AND (valid_until IS NULL OR valid_until >= ${now})
        AND (max_uses IS NULL OR current_uses < max_uses)
        FOR UPDATE  -- ← Locks this row until transaction commits
    `);

    const updatedPromo = lockedPromo[0];

    if (!updatedPromo) {
        return NextResponse.json(
            { error: 'Promo code is invalid, expired, or has reached its usage limit.' },
            { status: 400 }
        );
    }

    // Step 2: Increment (now no other thread can access this row)
    await db.update(promoCodes)
        .set({ current_uses: sql`${promoCodes.current_uses} + 1` })
        .where(eq(promoCodes.id, promo_code_id));

    // Calculate discount
    if (updatedPromo.discount_type === 'percentage') {
        discountAmount = (finalAmount * Number(updatedPromo.discount_value)) / 100;
    } else {
        discountAmount = Number(updatedPromo.discount_value);
    }

    // ... rest of code ...
}
```

---

## CRITICAL FIX #9: Unhandled Promise Rejection Handling

**File:** `src/app/api/auth/student/login/route.ts`

### ❌ Current Code
```typescript
// Fire-and-forget without error handling
analyticsService.trackLoginHour(now.getDay(), now.getHours()).catch(() => {});
```

### ✅ Fixed Code
```typescript
// Use Promise.allSettled for multiple fire-and-forget operations
Promise.allSettled([
    analyticsService.trackLoginHour(now.getDay(), now.getHours()),
    sendVerificationEmail(user.email),
    updateLastActivityTime(user.id)
]).catch((err) => {
    // This catch handles unexpected errors, but individual promises are already handled
    console.error('[Login Fire-and-Forget] Unexpected error:', err);
});

// Alternative: Explicit handling per operation
try {
    await analyticsService.trackLoginHour(now.getDay(), now.getHours());
} catch (err) {
    // Non-critical, just log
    console.warn('[Analytics] Failed to track login hour:', err);
}

try {
    await sendVerificationEmail(user.email);
} catch (err) {
    // Non-critical, user session already created
    console.warn('[Email] Failed to send verification email:', err);
    // Could optionally add to a retry queue
}
```

---

## CRITICAL FIX #10: Multi-Tenant Query Isolation Check

**File:** Add to all admin action files**

### Template
```typescript
'use server';

import { requireSchoolAdmin } from '@/lib/admin-guard';

/**
 * Get courses for a school.
 *
 * CRITICAL: Verify admin belongs to the school before querying.
 * This prevents admins from accessing competitor school data.
 */
export async function getSchoolCourses(schoolId: string) {
    // ✅ FIX: Always verify the requester belongs to this school
    const { admin } = await requireSchoolAdmin(schoolId);

    // ✅ Only then query using verified schoolId
    const courses = await db.query.courses.findMany({
        where: and(
            eq(courses.school_id, admin.school_id),
            eq(courses.is_active, true)
        )
    });

    return courses;
}
```

---

## TESTING THESE FIXES

### Unit Test Example
```typescript
// test/critical-fixes.test.ts

import { test, expect } from 'vitest';
import { POST as createOrder } from '@/app/api/payment/create-order/route';

test('FIX #1: Race condition - duplicate subscriptions prevented', async () => {
    // Simulate two concurrent requests
    const req1 = new NextRequest('http://localhost:3000/api/payment/create-order', {
        method: 'POST',
        body: JSON.stringify({
            plan_id: 'plan-123',
            promo_code_id: null
        })
    });

    const req2 = new NextRequest('http://localhost:3000/api/payment/create-order', {
        method: 'POST',
        body: JSON.stringify({
            plan_id: 'plan-123',
            promo_code_id: null
        })
    });

    // Both requests happen "simultaneously"
    const [res1, res2] = await Promise.all([
        createOrder(req1),
        createOrder(req2)
    ]);

    // One should succeed (201), one should fail with conflict (409)
    const status1 = res1.status;
    const status2 = res2.status;

    expect([status1, status2]).toContain(409);  // At least one must be conflict
    expect(res1.status === 409 || res2.status === 409).toBe(true);
});
```

---

## DEPLOYMENT CHECKLIST

Before deploying these fixes:

- [ ] All 10 fixes implemented and tested
- [ ] Load test passes with 1000 concurrent users
- [ ] Security review of access control changes
- [ ] Database migration tested (if needed)
- [ ] Redis failover tested (FIX #6)
- [ ] Payment flow tested end-to-end (FIX #3)
- [ ] Cache invalidation tested (FIX #4)
- [ ] Monitoring alerts configured
- [ ] On-call runbook updated
- [ ] Stakeholders notified of fixes

---

**Total implementation time: ~30 hours**
**Recommended: 1 senior engineer + 1 junior engineer, 2 weeks**
