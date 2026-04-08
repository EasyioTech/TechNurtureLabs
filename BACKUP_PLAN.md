# 🔐 TECH NURTURE LMS — COMPREHENSIVE BACKUP SYSTEM PLAN

**Status:** Planning Phase  
**Date Created:** 2026-04-08  
**Target Completion:** Phase by phase with 100% test coverage

---

## 📋 EXECUTIVE SUMMARY

Current system backs up **Courses only** (working 100%). Critical gap: **No backup for Schools, Students, Subscriptions, Academic Data, or Gamification State**.

This plan implements **Full System Backup** with:
- ✅ Zero data loss on system crash
- ✅ Point-in-time restore (per school)
- ✅ Atomic all-or-nothing restores
- ✅ No duplicate backups (SHA256 hash detection)
- ✅ Automatic cleanup (>30 days)

---

## 🗂️ DATA LAYERS NEEDING BACKUP

### Layer 1: School Profile (Critical)
```
schools → school_admins, academic_sessions, school_class_mapping
Includes: name, settings, logo_url, address, contact info, subscription status
Size: ~5KB per school
Risk: Loss = school data gone, must rebuild manually
```

### Layer 2: Students & Academic (Critical)
```
students → student_academic_records, student_quiz_attempts, student_xp_transactions
Includes: profiles, grades, streaks, XP, gamification state, preferences
Size: ~100KB-500KB per school (1000s of students)
Risk: Loss = all student progress, xp, achievements GONE
```

### Layer 3: Subscriptions & Payments (Critical - Legal)
```
school_subscriptions → payment_transactions → invoices
payment_plans, promo_codes, billing history
Size: ~20KB per school
Risk: Loss = can't prove who paid, legal liability, revenue loss
```

### Layer 4: Academic Structure (Important)
```
academic_sessions, classes, school_class_mapping, student_academic_records
Includes: year/semester setup, class assignments, promotion records
Size: ~10KB per school
Risk: Loss = can't recreate academic structure, manually fix enrollments
```

### Layer 5: Courses (Already Working ✓)
```
Current backup system — 100% working, built on this pattern
```

---

## 🎯 BACKUP STRATEGY

### Scope: **Per-School Backups**
- School admin can backup their own school + students + subscriptions
- Super admin can backup entire system
- Each school data is isolated (no cross-school data leak)

### Frequency: **On-Demand + Scheduled**
- Manual: "Backup Now" button in school dashboard
- Automatic: Daily at 3 AM (configurable)
- On Critical Events: Subscription change, student enrollment, payment

### Storage: **R2 Cloudflare (Same as Courses)**
- Path: `backups/schools/{school-id}/{timestamp}.json.gz`
- Compression: GZIP (reduces 1MB → 200KB)
- Metadata: Hash, size, record count, created timestamp

### Retention: **30-day Rolling Window**
- Keep 30 recent backups per school
- Auto-delete older than 30 days (daily cleanup job)
- Total storage: ~20-50MB per school (manageable)

### Atomicity: **All-or-Nothing Restore**
- Use database transactions (built-in)
- If ANY step fails → rollback entire restore
- Prevents partial corruption

---

## 📊 BACKUP DATA STRUCTURE

### SchoolBackupData (New Interface)
```typescript
{
  version: "2.0",
  timestamp: ISO string,
  schoolId: uuid,
  
  // School Profile
  school: { id, name, email, slug, logo_url, ... },
  schoolAdmin: { id, first_name, last_name, email, ... },
  
  // Subscription & Payments
  subscription: { id, plan_id, status, period, ... },
  paymentPlan: { id, name, price, features, ... },
  promoCode: { id, code, discount_value, ... },
  transactions: [ payment records ],
  invoices: [ invoice records ],
  
  // Academic Structure
  academicSessions: [ year/semester records ],
  classMapping: [ school ↔ class relationships ],
  
  // Students & Progress
  students: [
    {
      id, first_name, last_name, email, cumulative_xp,
      academicRecords: [ { class, roll_number, promoted, ... } ],
      quizAttempts: [ { quiz_id, score, passed, date } ],
      xpTransactions: [ { source, amount, date } ],
      achievements: [ { badge_id, earned_at, ... } ],
      notifications: { preferences, settings }
    }
  ],
  
  // Metadata
  metadata: {
    totalStudents: number,
    totalXpDistributed: number,
    lastBackupHash: string (null on first),
    recordCounts: { students, courses, sessions, ... }
  }
}
```

---

## 🔄 IMPLEMENTATION PHASES

### PHASE 1: Data Models & Interfaces
**Goal:** Define all backup data structures, NO database changes

**Checklist:**
- [ ] Create `school-backup-service.ts` with all interfaces
- [ ] Define SHA256 hashing for school data
- [ ] Test all TypeScript types compile
- [ ] Document data structure with examples

**Testing:**
- [ ] TypeScript strict mode passes
- [ ] All types exported correctly
- [ ] No circular dependencies

**Exit Criteria:** Types compile 100%, no errors

---

### PHASE 2: Export Functions (Data Read)
**Goal:** Read school, student, subscription, academic data from DB

**Checklist:**
- [ ] `exportSchoolProfile(schoolId)` → school + admin + settings
- [ ] `exportSubscriptionData(schoolId)` → subscription + transactions + invoices
- [ ] `exportAcademicData(schoolId)` → sessions + class mappings
- [ ] `exportStudentsData(schoolId)` → students + records + progress
- [ ] `exportAllSchoolData(schoolId)` → combines all above
- [ ] Calculate hash of exported data
- [ ] Handle empty data gracefully
- [ ] Log export progress

**Testing for Each Function:**
```
Test Case 1: School exists with data
  Input: valid schoolId
  Output: full backup data
  Verify: All fields populated, no nulls where shouldn't be

Test Case 2: School has no students
  Input: schoolId with 0 students
  Output: school data with empty students array
  Verify: No errors, metadata shows 0 students

Test Case 3: School has no subscription
  Input: schoolId with cancelled sub
  Output: school data with null subscription
  Verify: Handles gracefully

Test Case 4: Data is unchanged
  Input: same schoolId twice
  Output: Same hash both times
  Verify: Hash calculation is deterministic

Test Case 5: Large dataset (5000+ students)
  Input: schoolId with thousands of records
  Output: Complete data without timeout
  Verify: Query performance acceptable (<5s)
```

**Exit Criteria:** All 5 test cases pass, <5s export time for large data

---

### PHASE 3: Upload to R2 (Write)
**Goal:** Save exported data to R2, detect duplicates

**Checklist:**
- [ ] `uploadSchoolBackupToR2(data, schoolId)` 
- [ ] Check if hash matches last backup
- [ ] If no change: return existing file path
- [ ] If changed: compress with GZIP, upload, store metadata
- [ ] Handle R2 errors (network, auth, quota)
- [ ] Log upload details (size, time, hash)

**Testing:**
```
Test Case 1: First backup (no previous)
  Input: fresh school data
  Output: new file in R2
  Verify: File exists, metadata correct, isNew = true

Test Case 2: Backup unchanged data
  Input: same data as last backup
  Output: returns existing file, isNew = false
  Verify: No duplicate created, hash matches

Test Case 3: Backup changed data
  Input: data with 1 student added
  Output: new file created, isNew = true
  Verify: Old file still exists (retention), new hash different

Test Case 4: R2 connection error
  Input: R2 down/unreachable
  Output: Error thrown with clear message
  Verify: No partial file in R2, error logged

Test Case 5: Concurrent backups
  Input: 2 backup requests same school simultaneously
  Output: Both succeed or 1 returns existing file
  Verify: No race condition, no corruption
```

**Exit Criteria:** All 5 test cases pass, file integrity verified in R2

---

### PHASE 4: Restore Functions (Write Back)
**Goal:** Restore school data from backup file safely

**Checklist:**
- [ ] Download backup from R2
- [ ] Parse + validate structure
- [ ] `restoreSchoolBackup(backupData, schoolAdminId)` 
  - Use transaction (rollback on failure)
  - Restore school profile
  - Restore admin account
  - Restore subscription + payments
  - Restore academic structure
  - Restore students + records
  - Restore gamification state
- [ ] Handle ID conflicts (existing school)
- [ ] Log all operations
- [ ] Return detailed report (records restored, conflicts, warnings)

**Testing:**
```
Test Case 1: Fresh restore (no existing school)
  Input: backup data for school not in system
  Output: school + students + subscription created
  Verify: All data matches backup, no errors, IDs unique

Test Case 2: Restore over existing (merge)
  Input: backup for school that exists
  Output: school data updated, students upserted
  Verify: Existing students updated, new students added, no dupes

Test Case 3: Partial data corruption (missing subscription)
  Input: backup with null subscription
  Output: school restored, subscription skipped
  Verify: No error, warning logged, school usable without sub

Test Case 4: Restore with ID conflicts (student email exists)
  Input: backup with student email that exists in different school
  Output: Error or skip student
  Verify: No data corruption, transaction rolled back if critical

Test Case 5: Large restore (5000 students)
  Input: backup with 5000+ student records
  Output: All restored within timeout
  Verify: Performance <30s, all data correct

Test Case 6: Restore fails halfway
  Input: backup data, DB error on student 2500/5000
  Output: Transaction rolled back, DB unchanged
  Verify: No partial data, warning logged clearly
```

**Exit Criteria:** All 6 test cases pass, zero data corruption possible

---

### PHASE 5: List & Download Backups
**Goal:** List all backups per school, download any backup

**Checklist:**
- [ ] `listSchoolBackups(schoolId)` → sorted by date
- [ ] Show: filename, size, created date, record counts
- [ ] `downloadSchoolBackup(filePath)` → get backup file
- [ ] Handle missing file gracefully
- [ ] Return backup preview (counts, dates, size)

**Testing:**
```
Test Case 1: List backups for school with history
  Input: schoolId with 5 backups
  Output: Array of 5, sorted newest first
  Verify: Metadata correct, all files exist

Test Case 2: List backups for new school (0 backups)
  Input: schoolId with no backups
  Output: empty array
  Verify: No error, message clear

Test Case 3: Download existing backup
  Input: valid backup file path
  Output: backup data in memory
  Verify: Data valid, can be parsed, not corrupted

Test Case 4: Download missing backup
  Input: invalid/deleted backup path
  Output: Clear error message
  Verify: No 500 error, user-friendly message
```

**Exit Criteria:** All 4 test cases pass

---

### PHASE 6: Cleanup & Retention
**Goal:** Delete old backups automatically (>30 days)

**Checklist:**
- [ ] `cleanupOldSchoolBackups(retentionDays=30)`
- [ ] List all backups for a school
- [ ] Identify old ones (modified date > 30 days)
- [ ] Delete old backups from R2
- [ ] Keep metadata about deletions
- [ ] Schedule as daily worker (3 AM like courses)

**Testing:**
```
Test Case 1: Cleanup with old backups
  Input: school with backups from 40+ days ago
  Output: old files deleted, recent kept
  Verify: File count correct, old files gone

Test Case 2: Cleanup with all recent backups
  Input: school with all backups <30 days
  Output: nothing deleted
  Verify: All files still exist

Test Case 3: Concurrent cleanup (2 jobs running)
  Input: 2 cleanup jobs for same school simultaneously
  Output: both succeed, no double-delete
  Verify: Idempotent operation

Test Case 4: Cleanup with large number (100+ backups)
  Input: school with 100 backups, 80 old
  Output: 80 deleted in reasonable time
  Verify: Performance acceptable (<10s per school)
```

**Exit Criteria:** All 4 test cases pass

---

### PHASE 7: School Admin UI
**Goal:** Add backup controls to school admin dashboard

**Checklist:**
- [ ] Add "Backup Now" button in school settings
- [ ] Show backup status (success/error/in progress)
- [ ] Show last backup timestamp
- [ ] List recent backups with download links
- [ ] Add "Restore" button (with warning modal)
- [ ] Restore requires confirm (2 clicks)
- [ ] Show restore progress
- [ ] Show restore result (records restored)

**Testing:**
```
Test Case 1: Click "Backup Now"
  Action: Click button
  Verify: Loading state, success message, timestamp updated

Test Case 2: Backup fails (R2 down)
  Action: Click backup, R2 error occurs
  Verify: Error message shown, user informed, not stuck

Test Case 3: View backup list
  Action: Navigate to backups
  Verify: 5 most recent shown, sorted newest first, download works

Test Case 4: Click restore with confirmation
  Action: Click restore, confirm, watch progress
  Verify: Loading → success, data restored, students can log in

Test Case 5: Cancel restore before confirming
  Action: Click restore, see warning modal, click Cancel
  Verify: Restore doesn't run, DB unchanged

Test Case 6: Restore with large dataset (5000 students)
  Action: Click restore on large backup
  Verify: Shows progress, completes without timeout, data correct
```

**Exit Criteria:** All 6 UI test cases pass, no broken UI

---

### PHASE 8: Super Admin Dashboard
**Goal:** Add full system backup + selective restore for super admin

**Checklist:**
- [ ] Extend existing backup tab (currently course-only)
- [ ] Add "Backup All Schools" button
- [ ] Add filter/search for backups by school
- [ ] Add "Restore Any School" from any backup
- [ ] Show backup statistics (total size, count by school)
- [ ] Show cleanup stats (deleted count, freed space)

**Testing:**
```
Test Case 1: Backup all schools
  Action: Click "Backup All Schools"
  Verify: Each school backed up, progress shown, count shown

Test Case 2: Search backups by school name
  Action: Type school name in search
  Verify: Only that school's backups shown, correct count

Test Case 3: Restore specific school from backup
  Action: Select school, select backup date, confirm
  Verify: That school restored to point-in-time, others unaffected

Test Case 4: View backup statistics
  Action: View admin dashboard
  Verify: Total size shown, breakdown by school, growth trend

Test Case 5: Manual cleanup trigger
  Action: Click "Clean Old Backups"
  Verify: Progress shown, old files deleted, count reported
```

**Exit Criteria:** All 5 super admin test cases pass

---

### PHASE 9: Documentation & Scripts
**Goal:** Document entire system for operations team

**Checklist:**
- [ ] Write BACKUP_OPERATIONS.md (how to manual restore)
- [ ] Write API docs for all backup/restore endpoints
- [ ] Create restore script (CLI for emergency restore)
- [ ] Document retention policy
- [ ] Document failure scenarios + recovery steps
- [ ] Create monitoring alerts (backup size, failure count)

**Testing:**
- [ ] Follow manual restore doc from scratch (dry run)
- [ ] CLI script runs without errors
- [ ] All docs clear and complete

**Exit Criteria:** Ops team can restore from backup using only docs

---

## 🗄️ DATABASE SCHEMA (NEW TABLES)

No new tables needed! Uses existing tables:
- `schools`, `school_admins`
- `students`, `student_academic_records`
- `school_subscriptions`, `payment_transactions`, `invoices`
- `academic_sessions`, `school_class_mapping`

All backup data stored in **R2 only** (JSON files), not in database.

---

## 📁 FILE STRUCTURE

```
src/lib/services/
├── school-backup-service.ts      (NEW - main backup logic)
├── backup-service.ts             (EXISTING - courses)
└── backup-cleanup-service.ts     (EXISTING - cleanup)

src/modules/school-admin/
└── actions/
    └── school-backup-actions.ts  (NEW - school-level actions)

src/modules/school-admin/components/
└── backup/
    ├── backup-button.tsx         (NEW)
    ├── backup-list.tsx           (NEW)
    └── restore-modal.tsx         (NEW)

src/modules/super-admin/
└── actions/
    └── school-backup-actions.ts  (UPDATE - add full system)
```

---

## 🚨 FAILURE MODES & RECOVERY

| Scenario | Cause | Prevention | Recovery |
|----------|-------|-----------|----------|
| Backup fails mid-upload | Network error | Retry with exponential backoff | No partial file in R2 (atomic) |
| Restore corrupts data | Transaction error | Use DB transactions | Rollback on error (atomic) |
| Backup file deleted | Manual R2 delete | R2 versioning/lifecycle | Keep 2 backups minimum |
| Duplicate backups | Hash collision (impossible) | SHA256 detection | Deduplicate hashes |
| School admin tries to restore other school | Auth bypass | Verify schoolId in session | Reject if mismatch |
| Large restore times out | DB slow | Test with 10k students | Increase timeout, paginate restore |
| Old backups not deleted | Cleanup job fails | Monitor cleanup logs | Manual cleanup script |

---

## ✅ TESTING STRATEGY

**Unit Tests:**
- Hash calculation (deterministic)
- Data export (completeness)
- Data validation (no nulls)

**Integration Tests:**
- Full backup → restore cycle
- Concurrent backups
- R2 connectivity
- DB transaction rollback

**Load Tests:**
- 5000+ students per school
- 100+ backups per school
- Multi-school simultaneous backup

**Scenario Tests:**
- School with $100k+ invoice history
- Student with 10+ years of progression
- Subscription state transitions

---

## 📅 TIMELINE

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| 1: Interfaces | 1 hour | Now | +1h |
| 2: Export Functions | 3 hours | +1h | +4h |
| 3: R2 Upload | 2 hours | +4h | +6h |
| 4: Restore Logic | 4 hours | +6h | +10h |
| 5: List/Download | 1 hour | +10h | +11h |
| 6: Cleanup | 1 hour | +11h | +12h |
| **Testing (2-3x dev time)** | **9 hours** | **+12h** | **+21h** |
| 7: School Admin UI | 3 hours | +21h | +24h |
| 8: Super Admin UI | 2 hours | +24h | +26h |
| 9: Docs | 2 hours | +26h | +28h |
| **Total** | **~28 hours** | | |

---

## 🎯 SUCCESS CRITERIA

✅ **Zero Data Loss** — Any backup point can restore 100% of data  
✅ **No Duplicates** — SHA256 prevents duplicate backups  
✅ **Fast Restore** — <30 seconds for 5000 students  
✅ **Atomic** — All-or-nothing, no partial corruptions  
✅ **Easy to Use** — School admin clicks 1 button  
✅ **Monitored** — Can see backup status, history, size  
✅ **Documented** — Ops team can restore without code  
✅ **Tested** — Every scenario passes before ship  

---

## ⚠️ RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|-----------|
| R2 quota full | Backup fails | Monitor daily, alert at 80% |
| Restore corrupts data | Data loss | Test restore on backup data |
| Hash collision | Duplicate kept | Impossible with SHA256 |
| Student emails not unique (cross-school) | Restore fails | Verify uniqueness per school |
| Schema changes break old backups | Restore impossible | Version backups (v2.0) |

---

## 📝 NEXT STEPS

1. ✅ Review this plan (now)
2. Start PHASE 1 (create interfaces)
3. After each phase: run all test cases
4. Never skip to next phase if tests fail
5. Update plan if issues found
6. Ship with full test coverage

---

**Prepared by:** Claude Code  
**For:** Full system data protection  
**Target System:** TechNurture LMS  
