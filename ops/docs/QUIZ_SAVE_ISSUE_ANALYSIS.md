# Quiz Save Assessment Error - Deep Investigation

## Issue Summary
When creating or saving a quiz through the Quiz Builder in Super Admin, the save operation fails with error "Failed to save assessment" without showing the actual error details.

## Root Cause Analysis

### Issue #1: course_id Field Validation Mismatch
**Location**: `src/modules/super-admin/actions/sub-actions/quiz-actions.ts` lines 47-50

**Problem**:
- Database schema: `course_id` is defined as `notNull()` (REQUIRED)
- Zod validation: `course_id: z.string().uuid().optional().nullable()` (OPTIONAL)

```typescript
// Current (WRONG)
course_id: z.string().uuid().optional().nullable(),

// Database requires
course_id: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
```

**Impact**:
- When inserting new quiz (line 81): `course_id: data.course_id ?? null`
- If `course_id` is undefined from validation, it becomes null
- Database rejects null for NOT NULL column
- Transaction fails silently

### Issue #2: Incorrect Database Insert Logic
**Location**: `src/modules/super-admin/actions/sub-actions/quiz-actions.ts` lines 80-90

**Problem**:
```typescript
const [created] = await tx.insert(quizzes).values({
    lesson_id: data.lesson_id ?? null,
    course_id: data.course_id ?? null,  // ❌ WRONG: Should REQUIRE this
    title: data.title,
    // ...
} as any).returning();
```

When `data.course_id` is undefined/null:
- The `?? null` converts it to null
- Database constraint violation: Cannot insert null into course_id
- Drizzle transaction fails
- Error is caught in UI with no details

### Issue #3: Pass Percentage Data Type Inconsistency
**Location**: `src/modules/super-admin/actions/sub-actions/quiz-actions.ts` line 66, 86

**Problem**:
```typescript
// Line 66: Converting to string
const passPercentage = (data.pass_percentage ?? 60).toString();

// Line 86: Storing as string
pass_percentage: passPercentage,
```

**Database**:
```typescript
pass_percentage: numeric('pass_percentage', { precision: 5, scale: 2 }).notNull().default('60.00'),
```

**Issue**:
- Storing "60" as string when database expects numeric(5,2)
- PostgreSQL implicit coercion might work, but it's technically incorrect
- Can cause type mismatches in updates vs inserts

### Issue #4: Zod Schema Allows Questions Without Validation
**Location**: `src/modules/super-admin/actions/sub-actions/quiz-actions.ts` lines 37-45

**Problem**:
```typescript
const quizQuestionSchema = z.object({
    question_text: z.string().min(1, 'Question text is required'),
    question_type: z.enum(['mcq', 'true_false', 'fill_blank', 'multi_select']).default('mcq'),
    explanation: z.string().optional().default(''),
    points: z.number().int().min(0).default(1),
    time_limit_secs: z.number().int().min(0).default(0),
    correct_answer: z.string().optional(),  // ❌ Should be number for MCQ
    options: z.array(quizOptionSchema).optional(),  // ❌ Should be required
});
```

**Impact**:
- `correct_answer` should be a number (index) not string
- `options` should be required for MCQ questions
- No validation for question consistency

### Issue #5: No Detailed Error Reporting
**Location**: `src/modules/super-admin/components/quiz-editor.tsx` lines 116-118

**Problem**:
```typescript
catch (err) {
    console.error('Save failed:', err);  // Error logged but not shown to user
    toast.error('Failed to save assessment');  // Generic message only
}
```

**Impact**:
- User doesn't know WHY save failed
- Makes debugging impossible
- Server-side validation errors are hidden

---

## What Happens When User Saves

### Current Flow (BROKEN):
1. User creates new quiz with questions
2. Clicks "SAVE CHANGES"
3. `handleSave()` calls `saveQuizAdmin(quiz)`
4. Server validates with Zod schema
5. **Schema passes** (course_id is optional)
6. **Insert fails** because course_id is null but DB requires it
7. Transaction rolls back silently
8. Error is caught but not reported with details
9. User sees generic "Failed to save assessment"
10. No indication of what went wrong

### Why Course ID Issue Occurs:
- When user navigates to "Create New Quiz", the quiz object is initialized with `courseId` from props
- BUT the component expects `courseId` to always be provided
- If `courseId` is somehow undefined, the quiz is created with `course_id: undefined`
- Zod validation allows this (since it's optional)
- Database insert fails (since it's NOT NULL)

---

## Solutions Required (In Priority Order)

### FIX #1: Make course_id Required in Zod Schema
```typescript
const quizSchema = z.object({
    // ...
    course_id: z.string().uuid('Invalid course ID'),  // Required, must be valid UUID
    lesson_id: z.string().uuid().optional().nullable(),  // Lesson is optional
    // ...
});
```

### FIX #2: Add Validation for course_id During Insert
```typescript
// Add guard in saveQuizAdmin
export async function saveQuizAdmin(quizData: unknown) {
    const session = await requireSuperAdmin();

    const data = quizSchema.parse(quizData);  // Now ensures course_id exists

    if (!data.course_id) {
        throw new Error('Course ID is required to save a quiz');
    }

    // ... rest of insert logic
    const [created] = await tx.insert(quizzes).values({
        lesson_id: data.lesson_id || null,
        course_id: data.course_id,  // ✓ Always has value
        // ...
    }).returning();
}
```

### FIX #3: Fix pass_percentage Type Handling
```typescript
// In schema validation
pass_percentage: z.number().min(0).max(100).default(60),  // Keep as number

// In insert/update
pass_percentage: data.pass_percentage.toString(),  // Convert only at DB boundary
// OR better: let DB handle the conversion

// Actually better solution - fix the schema to store as numeric properly:
const passPercentage = (data.pass_percentage ?? 60).toFixed(2);  // "60.00"
```

### FIX #4: Improve Question Validation
```typescript
const quizQuestionSchema = z.object({
    question_text: z.string().min(1, 'Question text is required').max(1000),
    question_type: z.enum(['mcq', 'true_false', 'fill_blank', 'multi_select']).default('mcq'),
    explanation: z.string().optional().default(''),
    points: z.number().int().min(1).max(100).default(1),
    time_limit_secs: z.number().int().min(0).default(0),
    correct_answer: z.number().or(z.string()).optional(),  // Can be index or text
    options: z.array(z.string().min(1).max(500)).optional(),  // Options must be strings
});
```

### FIX #5: Add Detailed Error Messages
```typescript
const handleSave = async () => {
    if (!quiz) return;

    // Add validation before sending to server
    if (!quiz.course_id) {
        toast.error('Validation Error', {
            description: 'Course ID is missing. Please refresh and try again.'
        });
        return;
    }

    if (quiz.questions.length === 0) {
        toast.error('Validation Error', {
            description: 'Please add at least one question before saving.'
        });
        return;
    }

    setSaving(true);
    try {
        const saved = await saveQuizAdmin(quiz);
        // ...
    } catch (err) {
        // Show actual error details
        const message = err instanceof Error ? err.message : String(err);
        console.error('Save failed:', message);
        toast.error('Failed to save assessment', {
            description: message.slice(0, 100)  // Show first 100 chars of error
        });
    } finally {
        setSaving(false);
    }
};
```

---

## Files That Need Fixes

1. **src/modules/super-admin/actions/sub-actions/quiz-actions.ts**
   - Fix schema validation (lines 47-59)
   - Fix insert logic (lines 80-90)
   - Add error handling with detailed messages

2. **src/modules/super-admin/components/quiz-editor.tsx**
   - Improve error reporting (lines 116-118)
   - Add client-side validation before save
   - Show detailed error messages to user

---

## Testing After Fix

1. Create new quiz with questions
2. Verify course_id is always present
3. Click Save - should succeed
4. Edit existing quiz
5. Click Save - should succeed
6. Delete a question and save - should succeed
7. Try invalid input - should show specific error message

---

## Why This Error Happens

The core issue is a **mismatch between what the server requires (course_id NOT NULL) and what the validation allows (course_id optional)**. This is a classic validation-to-database contract violation.

The error is silent because:
1. Transaction fails at DB level
2. Error is caught in async/catch
3. Only generic toast is shown
4. Actual error details are lost

This makes it invisible to the user and hard to debug.
