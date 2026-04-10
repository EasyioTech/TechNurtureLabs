# PHASE 2: EXPORT FUNCTIONS — TEST PLAN

**Date:** 2026-04-08  
**Status:** Ready for Testing  
**Functions Implemented:** 5 export functions  

---

## Overview

PHASE 2 implements the core export functionality to read from database:

1. ✅ `exportSchoolProfile()` — Read school + admin
2. ✅ `exportSubscriptionData()` — Read subscription + payments + invoices
3. ✅ `exportAcademicData()` — Read academic sessions + class mappings
4. ✅ `exportStudentsData()` — Read all students + nested records
5. ✅ `exportCompleteSchoolData()` — Combines all above

---

## Test Cases

### TEST SUITE 1: `exportSchoolProfile()`

#### Test 1.1: Valid school exists
**Input:** `schoolId` of existing school  
**Expected Output:**
- ✅ `school` object with all fields populated
- ✅ `schoolAdmin` object with valid admin
- ✅ No null values in required fields
- ✅ Timestamps in ISO format

**Verification Steps:**
```
1. Call exportSchoolProfile(validSchoolId)
2. Assert school.id === provided schoolId
3. Assert school.name is non-empty string
4. Assert schoolAdmin.school_id === school.id
5. Assert school.created_at is valid ISO string
6. Assert no undefined values in required fields
```

**Pass Criteria:** All assertions pass

---

#### Test 1.2: School does not exist
**Input:** `schoolId` that doesn't exist  
**Expected Output:**
- ✅ Error thrown: "School not found: {schoolId}"
- ✅ No partial data returned

**Verification Steps:**
```
1. Call exportSchoolProfile(invalidId)
2. Catch error
3. Assert error.message contains "School not found"
4. Assert error is thrown (not returned)
```

**Pass Criteria:** Error thrown as expected

---

#### Test 1.3: School exists but no admin
**Input:** `schoolId` with valid school but deleted/missing admin  
**Expected Output:**
- ✅ Error thrown: "School admin not found for school: {schoolId}"

**Verification Steps:**
```
1. Manually delete school admin (soft delete)
2. Call exportSchoolProfile(schoolId)
3. Catch error
4. Assert error message about missing admin
```

**Pass Criteria:** Proper error handling

---

#### Test 1.4: Large school profile (with logo)
**Input:** School with logo_url, website, address, etc.  
**Expected Output:**
- ✅ All optional fields present
- ✅ No truncation
- ✅ logo_url preserved

**Verification Steps:**
```
1. Call exportSchoolProfile(schoolIdWithLogo)
2. Assert school.logo_url is populated
3. Assert school.address is populated
4. Assert URL integrity (no encoding issues)
```

**Pass Criteria:** All fields preserved accurately

---

### TEST SUITE 2: `exportSubscriptionData()`

#### Test 2.1: School with active subscription
**Input:** `schoolId` with active subscription + transactions + invoices  
**Expected Output:**
- ✅ `subscription` object populated
- ✅ `paymentPlan` object populated
- ✅ `transactions` array with all captured/created payments
- ✅ `invoices` array with all invoices
- ✅ `totalRevenue` calculated correctly (captured only)
- ✅ Timestamps in ISO format

**Verification Steps:**
```
1. Call exportSubscriptionData(schoolWithSubId)
2. Assert subscription !== null
3. Assert subscription.status in ['active', 'trialing', 'past_due', 'cancelled', 'expired']
4. Assert paymentPlan.id === subscription.plan_id
5. Assert transactions.length > 0
6. For each transaction:
   - Assert status in valid enum
   - Assert amount is numeric string
   - Assert amount > 0
7. Calculate expected revenue = sum of 'captured' transactions
8. Assert totalRevenue matches calculation
```

**Pass Criteria:** All assertions pass, revenue accurate

---

#### Test 2.2: School with no subscription
**Input:** `schoolId` with no subscription  
**Expected Output:**
- ✅ `subscription` is null
- ✅ `paymentPlan` is null
- ✅ `promoCode` is null
- ✅ `transactions` is empty array
- ✅ `invoices` is empty array
- ✅ `totalRevenue` is "0"

**Verification Steps:**
```
1. Create school without subscription
2. Call exportSubscriptionData(schoolId)
3. Assert subscription === null
4. Assert transactions.length === 0
5. Assert invoices.length === 0
6. Assert totalRevenue === "0"
```

**Pass Criteria:** Graceful handling of empty data

---

#### Test 2.3: Subscription with promo code
**Input:** `schoolId` with subscription using promo code  
**Expected Output:**
- ✅ `promoCode` object populated
- ✅ `promoCode.discount_value` is numeric string
- ✅ `promoCode.code` matches database

**Verification Steps:**
```
1. Create subscription with promo code
2. Call exportSubscriptionData(schoolId)
3. Assert promoCode !== null
4. Assert promoCode.code is non-empty
5. Assert promoCode.discount_type in ['percentage', 'fixed']
6. Assert promoCode.discount_value > "0"
```

**Pass Criteria:** Promo code data complete

---

#### Test 2.4: Refunded transactions
**Input:** School with refunded transactions  
**Expected Output:**
- ✅ Refunded transactions included
- ✅ `refund_amount` populated
- ✅ `refunded_at` timestamp present
- ✅ Refunded amount NOT included in totalRevenue

**Verification Steps:**
```
1. Create transaction, then refund it
2. Call exportSubscriptionData(schoolId)
3. Find refunded transaction in array
4. Assert transaction.status === 'refunded'
5. Assert transaction.refund_amount > "0"
6. Assert totalRevenue does NOT include refunded amount
```

**Pass Criteria:** Refunds handled correctly

---

#### Test 2.5: Large invoice history (100+ invoices)
**Input:** School with 100+ invoices  
**Expected Output:**
- ✅ All invoices retrieved (no pagination)
- ✅ Performance < 5 seconds
- ✅ No memory issues

**Verification Steps:**
```
1. Create school with 100+ invoices
2. Measure time before call
3. Call exportSubscriptionData(schoolId)
4. Measure time after call
5. Assert duration < 5000ms
6. Assert invoices.length === 100+
```

**Pass Criteria:** Performance acceptable

---

### TEST SUITE 3: `exportAcademicData()`

#### Test 3.1: School with academic sessions and classes
**Input:** School with current and past academic sessions, multiple class mappings  
**Expected Output:**
- ✅ `academicSessions` array with all sessions
- ✅ `classMappings` array with all mappings
- ✅ `classes` array with referenced classes
- ✅ Date fields in YYYY-MM-DD format

**Verification Steps:**
```
1. Create school with 2 sessions (2024-25, 2025-26), 5 classes
2. Map all 5 classes to school
3. Call exportAcademicData(schoolId)
4. Assert academicSessions.length === 2
5. Assert classMappings.length === 5
6. For each session:
   - Assert start_date format is YYYY-MM-DD
   - Assert end_date format is YYYY-MM-DD
   - Assert is_current is boolean
7. For each classMapping:
   - Assert class_id matches a class in classes array
```

**Pass Criteria:** All academic structure preserved

---

#### Test 3.2: School with no academic data
**Input:** New school with no sessions or class mappings  
**Expected Output:**
- ✅ `academicSessions` is empty array
- ✅ `classMappings` is empty array
- ✅ `classes` is empty array

**Verification Steps:**
```
1. Create new school (no manual setup)
2. Call exportAcademicData(schoolId)
3. Assert academicSessions.length === 0
4. Assert classMappings.length === 0
5. Assert classes.length === 0
```

**Pass Criteria:** Empty data handled gracefully

---

#### Test 3.3: Soft-deleted class mappings (not included)
**Input:** School with deleted class mappings  
**Expected Output:**
- ✅ Soft-deleted mappings NOT included
- ✅ Only active mappings returned

**Verification Steps:**
```
1. Create school with 5 class mappings
2. Soft-delete 2 of them (set deleted_at)
3. Call exportAcademicData(schoolId)
4. Assert classMappings.length === 3
5. Assert no mapping has deleted_at !== null
```

**Pass Criteria:** Soft deletes respected

---

### TEST SUITE 4: `exportStudentsData()`

#### Test 4.1: School with 10 students (basic case)
**Input:** School with 10 students, each with 2-3 quiz attempts and XP transactions  
**Expected Output:**
- ✅ `students.length === 10`
- ✅ Each student has nested `academicRecords`, `quizAttempts`, `xpTransactions`, `achievements`
- ✅ All fields populated correctly
- ✅ `totalRecords` object accurate

**Verification Steps:**
```
1. Create school with 10 students
2. For each student: create 2 quiz attempts, 5 XP events
3. Call exportStudentsData(schoolId)
4. Assert students.length === 10
5. For each student:
   - Assert student.id is UUID
   - Assert student.email is non-empty
   - Assert student.cumulative_xp >= 0
   - Assert quizAttempts is array
   - Assert xpTransactions.length === 5
6. Assert totalRecords.students === 10
7. Assert totalRecords.quizAttempts === 20
8. Assert totalRecords.xpTransactions === 50
```

**Pass Criteria:** All nested data complete

---

#### Test 4.2: School with no students
**Input:** Empty school  
**Expected Output:**
- ✅ `students` is empty array
- ✅ All totalRecords are 0

**Verification Steps:**
```
1. Create school (no students)
2. Call exportStudentsData(schoolId)
3. Assert students.length === 0
4. Assert totalRecords.students === 0
5. Assert totalRecords.quizAttempts === 0
```

**Pass Criteria:** Empty case handled

---

#### Test 4.3: Student with 1000+ quiz attempts
**Input:** School with 1 student who has 1000+ quiz attempts  
**Expected Output:**
- ✅ All 1000+ quiz attempts included
- ✅ Performance < 30 seconds
- ✅ Quiz percentages calculated correctly

**Verification Steps:**
```
1. Create student with 1000 quiz attempts
2. Measure time before call
3. Call exportStudentsData(schoolId)
4. Measure time after call
5. Assert duration < 30000ms
6. Assert students[0].quizAttempts.length === 1000
7. For sample attempt:
   - Assert percentage = (score / max_score) * 100
```

**Pass Criteria:** Large dataset handled efficiently

---

#### Test 4.4: Student with multiple academic records (promotion)
**Input:** Student who was promoted once  
**Expected Output:**
- ✅ 2 academic records (one per session)
- ✅ Second record has `is_promoted === true`
- ✅ `promoted_at` timestamp present

**Verification Steps:**
```
1. Create student in session 1, class 1
2. Create academic record with is_promoted=false
3. Promote to session 2, class 2
4. Create new academic record with is_promoted=true
5. Call exportStudentsData(schoolId)
6. Assert academicRecords.length === 2
7. Assert academicRecords[1].is_promoted === true
8. Assert academicRecords[1].promoted_at is ISO string
```

**Pass Criteria:** Academic progression tracked

---

#### Test 4.5: Student preferences and settings
**Input:** Student with custom notification/appearance preferences  
**Expected Output:**
- ✅ `notification_preferences` preserved
- ✅ `appearance_settings` preserved
- ✅ `privacy_settings` preserved
- ✅ All JSONB fields intact

**Verification Steps:**
```
1. Create student with custom preferences:
   - notification_preferences: {mobile_push: false, ...}
   - appearance_settings: {dark_mode: true, ...}
2. Call exportStudentsData(schoolId)
3. Assert notification_preferences.mobile_push === false
4. Assert appearance_settings.dark_mode === true
5. Assert all custom values preserved
```

**Pass Criteria:** JSONB data preserved exactly

---

#### Test 4.6: Large dataset (5000+ students)
**Input:** School with 5000 students  
**Expected Output:**
- ✅ All 5000 students exported
- ✅ Performance < 60 seconds
- ✅ No data loss or truncation

**Verification Steps:**
```
1. Create school with 5000 students
2. Measure time before call
3. Call exportStudentsData(schoolId)
4. Measure time after call
5. Assert duration < 60000ms
6. Assert students.length === 5000
7. Spot-check 10 random students for data completeness
```

**Pass Criteria:** Scales to production volume

---

### TEST SUITE 5: `exportCompleteSchoolData()`

#### Test 5.1: Full export of realistic school
**Input:** School with all data types (1000 students, 50 invoices, 10 sessions, etc.)  
**Expected Output:**
- ✅ Complete backup object
- ✅ All 5 components present (school, subscription, academic, students, metadata)
- ✅ Metadata counts match actual data
- ✅ Hash calculated (for deduplication in Phase 3)

**Verification Steps:**
```
1. Create realistic school with:
   - 1000 students
   - 50 invoices
   - 5 academic sessions
   - 100 quiz attempts per student (avg)
2. Call exportCompleteSchoolData(schoolId)
3. Assert backup.version === "2.0"
4. Assert backup.timestamp is ISO string
5. Assert backup.school.name === expected
6. Assert backup.metadata.totalStudents === 1000
7. Assert backup.metadata.recordCounts.invoices === 50
8. Calculate backup hash = calculateBackupHash(backup)
9. Assert hash is 64-char hex string (SHA256)
```

**Pass Criteria:** Complete and valid backup created

---

#### Test 5.2: Export performance benchmark
**Input:** School with 5000 students + 500 invoices + history  
**Expected Output:**
- ✅ Export completes in < 120 seconds
- ✅ No timeout
- ✅ Memory stable (no leaks)

**Verification Steps:**
```
1. Monitor memory before call
2. Call exportCompleteSchoolData(largeSchoolId)
3. Monitor memory during and after
4. Assert total duration < 120 seconds
5. Assert memory usage increases < 1GB
6. Assert memory released after completion
```

**Pass Criteria:** Suitable for production

---

#### Test 5.3: Export with no subscription data
**Input:** School with students but no subscription  
**Expected Output:**
- ✅ Backup still valid
- ✅ subscription, paymentPlan, promoCode are null
- ✅ transactions, invoices are empty arrays

**Verification Steps:**
```
1. Create school with students, no subscription
2. Call exportCompleteSchoolData(schoolId)
3. Assert backup.subscription === null
4. Assert backup.transactions.length === 0
5. Assert validateBackupData(backup) returns []
```

**Pass Criteria:** Works with partial data

---

#### Test 5.4: Hash consistency (deterministic)
**Input:** Same school exported twice  
**Expected Output:**
- ✅ Both exports have identical hash
- ✅ Hash is deterministic (same input = same hash)

**Verification Steps:**
```
1. Call exportCompleteSchoolData(schoolId) → backup1
2. Call exportCompleteSchoolData(schoolId) → backup2
3. hash1 = calculateBackupHash(backup1)
4. hash2 = calculateBackupHash(backup2)
5. Assert hash1 === hash2
6. Modify 1 field in backup1
7. hash1Modified = calculateBackupHash(backup1)
8. Assert hash1Modified !== hash1
```

**Pass Criteria:** Hash is deterministic, detects changes

---

## Test Execution Checklist

- [ ] Test Suite 1: School Profile (4 tests)
- [ ] Test Suite 2: Subscription Data (5 tests)
- [ ] Test Suite 3: Academic Data (3 tests)
- [ ] Test Suite 4: Students Data (6 tests)
- [ ] Test Suite 5: Complete School Data (4 tests)
- [ ] **Total: 22 tests**

---

## Pass/Fail Criteria

**PASS:** All 22 tests pass without errors  
**FAIL:** Any test fails → fix issue and re-run before proceeding to PHASE 3

---

## Logs to Verify

After running all tests, verify logs show:

```
✓ School profile exported: [school name]
✓ Subscription data exported: X transactions, Y invoices
✓ Academic data exported: X sessions, Y class mappings
✓ Students data exported: X students, Y academic records, Z quiz attempts
✓ Complete export successful (XYZ.XXs)
```

---

## Exit Criteria for PHASE 2

✅ All 22 tests pass  
✅ Performance benchmarks met (60s for 5000 students)  
✅ No TypeScript errors  
✅ Logs show all data exported successfully  
✅ Hash deduplication works (deterministic)  
✅ Code reviewed  

→ **Ready to proceed to PHASE 3: R2 Upload**
