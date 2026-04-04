import { redis } from '../redis';

const STATS_KEY = 'stats:global';
// Sorted set: score = epoch-ms of last heartbeat; entries older than 5 min are pruned = O(log N)
const PCU_KEY = 'pcu:sessions';
// Per-day and per-month learner sets
const dauKey = (date: string) => `dau:${date}`;        // YYYY-MM-DD  TTL 90000s (~25h)
const mauKey = (month: string) => `mau:${month}`;       // YYYY-MM      TTL 2764800s (~32d)
// Heatmap counters — no TTL (they accumulate forever; admin can reset manually)
const hmKey = (dow: number, hour: number) => `login:hm:${dow}:${hour}`;

export const analyticsService = {
    /**
     * Increment a global metric (e.g., total_students, total_courses)
     */
    async incrementMetric(metric: string, amount: number = 1) {
        try {
            await redis.hincrby(STATS_KEY, metric, amount);
        } catch (_) { /* non-critical — analytics are best-effort */ }
    },

    /**
     * Decrement a global metric
     */
    async decrementMetric(metric: string, amount: number = 1) {
        try {
            await redis.hincrby(STATS_KEY, metric, -amount);
        } catch (_) { /* non-critical */ }
    },

    /**
     * Set a metric directly (useful for periodic re-syncing)
     */
    async setMetric(metric: string, value: number) {
        try {
            await redis.hset(STATS_KEY, metric, value);
        } catch (_) { /* non-critical */ }
    },

    /**
     * Fetch all global metrics
     */
    async getGlobalStats() {
        try {
            return await redis.hgetall(STATS_KEY);
        } catch (_) {
            console.warn('[Analytics] Redis unavailable — returning empty stats');
            return {};
        }
    },

    /**
     * Sync metrics from DB to Redis (Central Source of Truth alignment)
     */
    async syncFromDb(metrics: Record<string, number>) {
        try {
            const pipeline = redis.pipeline();
            for (const [key, val] of Object.entries(metrics)) {
                pipeline.hset(STATS_KEY, key, val);
            }
            await pipeline.exec();
        } catch (e) {
            console.warn('[Analytics] Redis unavailable for DB sync:', (e as Error).message);
        }
    },

    // ─────────────────────────────────────────────────────────────
    // PEAK CONCURRENT USERS  (PCU)
    // Uses a sorted set: score = heartbeat timestamp (ms).
    // Members older than 5 min are pruned before reading the count.
    // O(log N) write, O(log N + evicted) prune, O(1) read.
    // ─────────────────────────────────────────────────────────────
    async trackConcurrentUser(userId: string): Promise<void> {
        try {
            const now = Date.now();
            const cutoff = now - 5 * 60 * 1000; // 5-min window
            const pipeline = redis.pipeline();
            pipeline.zadd(PCU_KEY, now, userId);
            pipeline.zremrangebyscore(PCU_KEY, 0, cutoff);
            pipeline.expire(PCU_KEY, 600); // key lives 10 min after last write
            await pipeline.exec();
        } catch (_) { /* non-critical */ }
    },

    async getPCU(): Promise<number> {
        try {
            const cutoff = Date.now() - 5 * 60 * 1000;
            await redis.zremrangebyscore(PCU_KEY, 0, cutoff);
            return await redis.zcard(PCU_KEY);
        } catch (_) { return 0; }
    },

    // ─────────────────────────────────────────────────────────────
    // ONCE-PER-DAY DAU + MAU TRACKING
    // Uses a NX key so only the first heartbeat of the day pays the cost.
    // All subsequent heartbeats skip DAU/MAU entirely — O(1) GET + early exit.
    // ─────────────────────────────────────────────────────────────
    async trackActiveUserOnce(userId: string): Promise<void> {
        try {
            const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            const guardKey = `dau:seen:${userId}:${today}`;
            // SET NX EX: returns 'OK' only on first call; null on every subsequent one
            const isFirst = await redis.set(guardKey, '1', 'EX', 90000, 'NX');
            if (!isFirst) return; // already tracked today — skip
            await Promise.all([
                this.trackDailyActiveUser(userId),
                this.trackMonthlyActiveUser(userId),
            ]);
        } catch (_) { /* non-critical */ }
    },

    // ─────────────────────────────────────────────────────────────
    // DAILY / MONTHLY ACTIVE USERS
    // Simple Redis SETs per day / per month.  O(1) SADD, O(1) SCARD.
    // ─────────────────────────────────────────────────────────────
    async trackDailyActiveUser(userId: string): Promise<void> {
        try {
            const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            const key = dauKey(today);
            const pipeline = redis.pipeline();
            pipeline.sadd(key, userId);
            pipeline.expire(key, 90000); // ~25 hours
            await pipeline.exec();
        } catch (_) { /* non-critical */ }
    },

    async trackMonthlyActiveUser(userId: string): Promise<void> {
        try {
            const month = new Date().toISOString().slice(0, 7); // YYYY-MM
            const key = mauKey(month);
            const pipeline = redis.pipeline();
            pipeline.sadd(key, userId);
            pipeline.expire(key, 2764800); // 32 days
            await pipeline.exec();
        } catch (_) { /* non-critical */ }
    },

    async getDAU(): Promise<number> {
        try {
            const today = new Date().toISOString().slice(0, 10);
            return await redis.scard(dauKey(today));
        } catch (_) { return 0; }
    },

    async getMAU(): Promise<number> {
        try {
            const month = new Date().toISOString().slice(0, 7);
            return await redis.scard(mauKey(month));
        } catch (_) { return 0; }
    },

    // ─────────────────────────────────────────────────────────────
    // PLATFORM ACTIVITY HEATMAP (7 days × 24 hours)
    // dow: 0=Sun … 6=Sat   hour: 0-23
    // Counters never expire — they represent all-time activity patterns.
    // ─────────────────────────────────────────────────────────────
    async trackLoginHour(dow: number, hour: number): Promise<void> {
        try {
            await redis.incr(hmKey(dow, hour));
        } catch (_) { /* non-critical */ }
    },

    /**
     * Tracks an active user session into the heatmap, but only once per hour per user.
     * Prevents heatmap bloat from heartbeats while correctly registering continuous activity.
     */
    async trackActiveUserHour(userId: string): Promise<void> {
        try {
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10);
            const hour = now.getHours();
            const dow = now.getDay();
            
            const guardKey = `hm:seen:${userId}:${dateStr}:${hour}`;
            // Track once per hour per user. 3600s TTL.
            const isFirst = await redis.set(guardKey, '1', 'EX', 3600, 'NX');
            if (!isFirst) return;
            
            await this.trackLoginHour(dow, hour);
        } catch (_) { /* non-critical */ }
    },

    /**
     * Returns a 7×24 matrix: heatmap[dow][hour] = count
     */
    async getLoginHeatmap(): Promise<number[][]> {
        try {
            const pipeline = redis.pipeline();
            for (let dow = 0; dow < 7; dow++) {
                for (let hour = 0; hour < 24; hour++) {
                    pipeline.get(hmKey(dow, hour));
                }
            }
            const results = await pipeline.exec();
            const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
            if (results) {
                let i = 0;
                for (let dow = 0; dow < 7; dow++) {
                    for (let hour = 0; hour < 24; hour++) {
                        const [err, val] = results[i++] as [Error | null, string | null];
                        if (!err && val) matrix[dow][hour] = Number(val);
                    }
                }
            }
            return matrix;
        } catch (_) { return Array.from({ length: 7 }, () => Array(24).fill(0)); }
    },
};
