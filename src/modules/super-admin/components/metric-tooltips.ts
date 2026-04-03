/**
 * Comprehensive metric definitions with tooltips, explanations, and thresholds
 * Used by Infrastructure Monitor to provide context-aware help
 */

export const METRIC_EXPLANATIONS = {
  // ========== SERVER HEALTH ==========
  server: {
    title: 'Hostinger KVM Server Status',
    description: 'Real-time health metrics of the virtual server running your platform',
    metrics: {
      cpuLoad: {
        label: 'CPU Load',
        tooltip: 'Current CPU usage across all cores. Lower is better.',
        explanation: `CPU Load measures how much processing power is being used right now.

• 1m: Last 1 minute
• 5m: Last 5 minutes
• 15m: Last 15 minutes

Safe Range: Load should be below your core count (usually 1-2 for most platforms)
Red Zone: If load > core count, your server is overworked`,
        thresholds: {
          good: 'Load ≤ 50% of core count',
          warning: 'Load at 50-80% of core count',
          critical: 'Load > core count'
        }
      },
      memory: {
        label: 'OS RAM Usage',
        tooltip: 'Physical server memory consumption',
        explanation: `This is how much of your server\'s total RAM is currently in use.

Safe Range: 40-70% is normal
Caution: 70-85% means you\'re running tight on memory
Critical: >85% can cause system slowdowns or crashes

If consistently high, consider upgrading your server plan or optimizing code.`,
        thresholds: {
          good: '< 70%',
          warning: '70-85%',
          critical: '> 85%'
        }
      },
      nodeHeap: {
        label: 'Node.js Heap',
        tooltip: 'Memory allocated to your Next.js application process',
        explanation: `This is memory used specifically by your application (not the OS).

Node.js Heap is limited (usually 512MB - 2GB). If it exceeds limits:
• Garbage collection pauses increase (slow responses)
• Out-of-memory crashes occur
• Performance degrades

High heap usage = inefficient code, memory leaks, or too many concurrent users.`,
        thresholds: {
          good: '< 60% of heap limit',
          warning: '60-80% of heap limit',
          critical: '> 80% of heap limit'
        }
      },
      uptime: {
        label: 'Uptime',
        tooltip: 'How long the server and app have been running without restart',
        explanation: `Uptime shows server stability and reliability.

OS Uptime: Entire server restart history
App Uptime: Since last app restart (deployments, crashes, etc.)

High uptime = stable system
Low app uptime = recent restart (might indicate crashes or deployments)`,
        healthy: 'Days or weeks is normal'
      }
    }
  },

  // ========== REDIS CACHE ==========
  redis: {
    title: 'Redis Cache Performance',
    description: 'In-memory cache storing sessions, user data, and temporary results',
    metrics: {
      healthScore: {
        label: 'Health Score',
        tooltip: 'Overall cache system health (0-100)',
        explanation: `Redis Health Score is calculated from:

✓ Hit Ratio: How often data is found in cache (target: >85%)
✓ Memory: Fragmentation ratio (ideal: <1.5x)
✓ Evictions: Forced key deletion when memory full
✓ Client Blocking: Stuck connections waiting for operations
✓ Leaderboard Safety: Database size checks

Score Interpretation:
• 90-100: Optimal - System running perfectly
• 70-89: Stable - Acceptable performance
• <70: Attention Required - Fix issues immediately`,
        thresholds: {
          good: '≥ 90',
          acceptable: '70-89',
          critical: '< 70'
        }
      },
      hitRatio: {
        label: 'Cache Hit Ratio',
        tooltip: 'Percentage of requests found in cache vs total requests',
        explanation: `Hit Ratio shows cache effectiveness:

Hit = User data found in Redis (fast, instant)
Miss = Data fetched from database (slower, ~5-50ms)

Formula: Hits / (Hits + Misses) × 100

Example:
• 100 users load profile
• 85 get data from cache (hit)
• 15 get data from database (miss)
• Hit Ratio = 85%

Target: >85% for good performance
<70%: Cache configuration might be wrong or TTL too short`,
        thresholds: {
          good: '> 85%',
          acceptable: '70-85%',
          critical: '< 70%'
        }
      },
      memory: {
        label: 'Redis Memory Usage',
        tooltip: 'How much RAM the cache is consuming',
        explanation: `Redis stores everything in RAM (very fast). When memory is full:

1. New items evict old items (LRU policy)
2. Performance drops (more database queries)
3. Critical data might be lost

Safe Usage: 50-70% of allocated memory
Warning: 70-85% - Running tight, evictions may occur
Critical: >85% - Severe issues, urgent action needed

Action if high:
• Increase Redis memory limit
• Reduce cache TTL (time items stay)
• Clean unused keys
• Optimize data structures`,
        thresholds: {
          good: '< 70%',
          warning: '70-85%',
          critical: '> 85%'
        }
      },
      evictions: {
        label: 'Evicted Keys',
        tooltip: 'Number of keys forcefully removed when memory was full',
        explanation: `Evictions happen when Redis runs out of memory:

Process:
1. New data arrives but memory is full
2. Redis removes oldest/least-used data (LRU)
3. New data takes its place

Impact:
• Lost cached data = more database queries
• Slower performance for affected users
• Higher database load

Ideal: 0 evictions
Any evictions = you need more Redis memory or better cleanup strategy`,
        meaning: 'Higher number = memory pressure'
      },
      connectedClients: {
        label: 'Connected Clients',
        tooltip: 'Number of active connections to Redis',
        explanation: `Connected Clients = Applications, services, and jobs connected to Redis

Each logged-in student, school admin, or background job = 1 connection

Normal Range:
• 5-50 = Small platform (dev/staging)
• 50-200 = Medium platform
• 200-500 = Large production platform
• >500 = Very high scale

If blocked clients > 0 = Redis is overwhelmed, cannot handle new requests`,
        thresholds: {
          healthy: 'Depends on platform size',
          warning: 'Blocked clients > 0'
        }
      },
      fragmentation: {
        label: 'Memory Fragmentation',
        tooltip: 'Ratio of actual memory used vs allocated (wasted space ratio)',
        explanation: `Memory Fragmentation measures "memory waste":

Example:
• You store 100MB of data
• Redis allocates 150MB (50MB wasted space)
• Fragmentation Ratio = 150/100 = 1.5x

Causes:
• Frequent key deletion (creates holes)
• Long-lived vs short-lived data mix
• Memory allocator inefficiency

Safe Level: 1.0 - 1.5x
Warning: >1.5x (more than 50% wasted space)

If High:
• Restart Redis to defragment
• Consolidate data structures`,
        thresholds: {
          good: '< 1.5x',
          warning: '1.5 - 2.0x',
          critical: '> 2.0x'
        }
      }
    }
  },

  // ========== DATABASE HEALTH ==========
  database: {
    title: 'PostgreSQL Database Health',
    description: 'Persistent data storage for courses, students, enrollments, etc.',
    metrics: {
      latency: {
        label: 'Database Latency (Ping)',
        tooltip: 'Time to communicate with database (milliseconds)',
        explanation: `Database Latency = Round-trip time to execute a PING command

< 10ms: Excellent (on same network)
10-50ms: Good (regional network)
50-100ms: Acceptable (some distance)
> 100ms: Slow (far away, network issues)

Impact on Users:
• 10ms latency = imperceptible
• 50ms latency = slight UI delay
• 100ms+ latency = noticeable lag, poor UX

If High:
• Database server too far away
• Network congestion
• Database server overloaded
• Query optimization needed`,
        thresholds: {
          excellent: '< 10ms',
          good: '10-50ms',
          acceptable: '50-100ms',
          slow: '> 100ms'
        }
      },
      activeConnections: {
        label: 'Active Connections',
        tooltip: 'Number of active database queries running right now',
        explanation: `Active Connections = Concurrent queries being processed

Example: 5 students loading dashboard = ~5-10 connections

Safe Range:
• 5-20: Light traffic
• 20-50: Moderate traffic
• 50-100: Heavy traffic
• >100: Very high load

PostgreSQL Connection Limit (usually 100-200 per server)

If Constantly High:
• Slow queries blocking connections
• Need connection pooling (PgBouncer)
• Optimize slow queries
• Add read replicas`,
        thresholds: {
          light: '< 20',
          moderate: '20-50',
          heavy: '50-100',
          critical: '> 100'
        }
      },
      dbSize: {
        label: 'Database Size',
        tooltip: 'Total storage used by all data in PostgreSQL',
        explanation: `Database Size = Total disk space consumed by all your data

Includes:
• Student records
• Course content
• Progress tracking
• Transaction history
• Indexes

Growth Pattern:
• New platform: 10-100 MB
• 1,000 students: 50-500 MB
• 10,000 students: 500 MB - 5 GB
• 100,000+ students: 5+ GB

Monitoring:
• Track growth over time
• Plan storage upgrades
• Clean old data (archiving)
• Optimize indexes periodically`,
        action: 'Monitor growth, ensure adequate disk space (aim for <70% full)'
      }
    }
  },

  // ========== KEYSPACE DISTRIBUTION ==========
  keyspace: {
    title: 'Redis Keyspace Distribution',
    description: 'Breakdown of cached data by type',
    namespaces: {
      session: {
        label: 'Session Keys',
        purpose: 'Active user login sessions (JWT tokens, refresh tokens)',
        example: 'session:user123:abc... - Stores user ID, permissions, expiry'
      },
      cache: {
        label: 'Cache Keys',
        purpose: 'Temporary cached data (course lists, leaderboards, user stats)',
        example: 'cache:course:123 - Stores computed results for fast retrieval'
      },
      lb: {
        label: 'Leaderboard Keys',
        purpose: 'Sorted sets for rankings (XP, achievements, streaks)',
        example: 'lb:xp:global - Sorted set of users by XP score'
      },
      dau: {
        label: 'DAU (Daily Active Users)',
        purpose: 'Tracking active users today (analytics)',
        example: 'dau:2026-04-03 - Set of user IDs active today'
      },
      user_stats: {
        label: 'User Stats',
        purpose: 'Individual user performance data (scores, progress, streaks)',
        example: 'user:123:stats - User\'s XP, level, current streak'
      },
      other: {
        label: 'Other Keys',
        purpose: 'Rate limits, locks, temporary data, custom keys',
        example: 'rate_limit:ip:1.2.3.4 - Request count for IP address'
      }
    }
  },

  // ========== ALERTS & THRESHOLDS ==========
  alerts: {
    title: 'System Alerts',
    description: 'Critical conditions that need attention',
    types: {
      fragmentation: {
        title: 'High Memory Fragmentation',
        cause: 'Frequent deletions or data structure changes',
        action: 'Restart Redis or monitor closely'
      },
      eviction: {
        title: 'Memory Eviction Detected',
        cause: 'Redis ran out of memory and deleted old keys',
        action: 'Increase Redis memory or reduce cache TTL'
      },
      hitRatio: {
        title: 'Low Cache Hit Ratio',
        cause: 'Cache not being used effectively (<70%)',
        action: 'Review cache strategy or increase TTL'
      },
      leaderboard: {
        title: 'Leaderboard Size Warning',
        cause: 'Leaderboard has too many entries (>1000)',
        action: 'Archive old entries or paginate results'
      },
      blocking: {
        title: 'Blocked Clients',
        cause: 'Redis cannot keep up with requests',
        action: 'Optimize queries or scale Redis'
      }
    }
  }
};

/**
 * Helper function to get explanation for any metric
 */
export function getMetricInfo(section: string, metric: string) {
  const sectionData = METRIC_EXPLANATIONS[section as keyof typeof METRIC_EXPLANATIONS];
  if (!sectionData) return null;

  const metricData = (sectionData as any).metrics?.[metric as keyof any];
  return metricData || null;
}
