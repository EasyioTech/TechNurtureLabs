# Testing Guide - Critical Fixes (Session 2)
**Last Updated:** April 3, 2026

---

## Quick Summary of Fixes

### ✅ Fix #1: Student PIN Validation
**What Changed:** Students now use 6-digit PINs instead of 8+ character complex passwords

**Before:** 
```
PIN: 123456 ❌ REJECTED
Error: Password must be at least 8 characters
```

**After:**
```
PIN: 123456 ✅ ACCEPTED
PIN: 654321 ✅ ACCEPTED
PIN: 111111 ✅ ACCEPTED (any 6 digits)
```

### ✅ Fix #2: Phone Number Login
**What Changed:** Phone numbers now work for both registration and login

**Before:**
```
Register: phone + PIN = ❌ FAILED
Login: phone + PIN = ❌ FAILED (no phone numbers in DB)
```

**After:**
```
Register: phone + PIN = ✅ SUCCESS
Login: phone + PIN = ✅ SUCCESS
Login: +91 9876543210 = ✅ SUCCESS (formats handled)
```

### ✅ Fix #3: Debug Logging
**What Changed:** Nothing - "items not stringified" is normal Next.js dev logging

**Impact:** Zero - this doesn't affect functionality and won't appear in production

---

## How to Test

### Test Scenario 1: Register Student with Email + PIN

1. Go to: `http://localhost:3000/register/student`
2. Fill form:
   - **Email:** `john.doe@example.com`
   - **PIN:** `123456` (exactly 6 digits)
   - **Full Name:** John Doe
   - **School:** Select any active school
   - **Class:** Select any class
   - **Gender:** Optional

3. Expected Result:
   - ✅ Form submits successfully
   - ✅ Redirected to success page
   - ✅ Account created in database

4. Verify in DB:
   ```sql
   SELECT id, email, phone, first_name FROM students 
   WHERE first_name = 'John' 
   ORDER BY created_at DESC LIMIT 1;
   
   -- Should show:
   -- id: [uuid]
   -- email: john.doe@example.com
   -- phone: NULL (or empty)
   -- first_name: John
   ```

---

### Test Scenario 2: Register Student with Phone + PIN

1. Go to: `http://localhost:3000/register/student`
2. Fill form:
   - **Email/Phone:** `9876543210` (just digits, no +91 or formatting yet)
   - **PIN:** `654321` (exactly 6 digits)
   - **Full Name:** Rajesh Kumar
   - **School:** Select any active school
   - **Class:** Select any class

3. Expected Result:
   - ✅ Form accepts phone number
   - ✅ Form submits successfully
   - ✅ Redirected to success page

4. Verify in DB:
   ```sql
   SELECT id, email, phone, first_name FROM students 
   WHERE first_name = 'Rajesh' 
   ORDER BY created_at DESC LIMIT 1;
   
   -- Should show:
   -- id: [uuid]
   -- email: NULL (or empty)
   -- phone: 9876543210
   -- first_name: Rajesh
   ```

---

### Test Scenario 3: Login with Email + PIN

1. Go to: `http://localhost:3000/student` (or `/login`)
2. You should see login form with options:
   - Email/Phone field
   - PIN field

3. Enter:
   - **Email:** `john.doe@example.com` (from Test 1)
   - **PIN:** `123456`

4. Click **Login**

5. Expected Result:
   - ✅ Login successful
   - ✅ Redirected to student dashboard
   - ✅ Student name shown in header

---

### Test Scenario 4: Login with Phone + PIN

1. Go to: `http://localhost:3000/student` (or `/login`)
2. Enter:
   - **Phone:** `9876543210` (from Test 2)
   - **PIN:** `654321`

3. Click **Login**

4. Expected Result:
   - ✅ Login successful
   - ✅ Redirected to student dashboard
   - ✅ Student name shown in header

---

### Test Scenario 5: Login with Formatted Phone Number

**Purpose:** Test fuzzy matching for international phone formats

1. Go to login
2. Enter:
   - **Phone:** `+91 98765 43210` (formatted with country code, spaces, dashes)
   - **PIN:** `654321`

3. Expected Result:
   - ✅ Login successful (fuzzy matching handles formats)
   - ✅ Redirected to dashboard

---

### Test Scenario 6: PIN Validation Errors

#### Test 6a: PIN Too Short
1. Registration form
2. PIN: `12345` (5 digits)
3. Expected Error:
   ```
   ❌ "PIN must be exactly 6 digits"
   ```

#### Test 6b: PIN Too Long
1. Registration form
2. PIN: `1234567` (7 digits)
3. Expected Error:
   ```
   ❌ "PIN must be exactly 6 digits"
   ```

#### Test 6c: PIN with Letters
1. Registration form
2. PIN: `12345A` (contains letter)
3. Expected Error:
   ```
   ❌ "PIN must be exactly 6 digits"
   ```

---

### Test Scenario 7: Phone Number Validation Errors

#### Test 7a: Phone Too Short
1. Registration form
2. Phone: `123456` (6 digits, below 7 minimum)
3. Expected Error:
   ```
   ❌ "Please enter a valid email address or phone number (7-15 digits)"
   ```

#### Test 7b: Phone Too Long
1. Registration form
2. Phone: `12345678901234567` (17 digits, above 15 maximum)
3. Expected Error:
   ```
   ❌ "Please enter a valid email address or phone number (7-15 digits)"
   ```

#### Test 7c: Invalid Email Format
1. Registration form
2. Email: `notanemail` (no @ or domain)
3. Expected Error:
   ```
   ❌ "Please enter a valid email address or phone number (7-15 digits)"
   ```

---

## Common Issues & Solutions

### Issue: "PIN must be exactly 6 digits" when entering valid PIN
**Cause:** Leading/trailing spaces in PIN field
**Solution:** Ensure PIN field is trimmed (spaces removed) before submission
**Code:** Frontend should trim input: `pin.trim()`

### Issue: Phone login fails but phone is correct
**Cause 1:** Different phone format during registration vs login
**Solution:** Login fuzzy matching should handle this
**Verify:** Check database for how phone was stored

**Cause 2:** Phone number with country code
**Solution:** Try entering without country code (+91 → just digits)
**Example:** 
- Registered: `9876543210`
- Try Login With: `9876543210` ✅ (works)
- Try Login With: `+919876543210` ✅ (should also work)

### Issue: Student account pending verification
**Cause:** School admin hasn't approved the student yet
**Solution:** Ask school admin to verify student in school-admin panel
**Note:** Unverified students see error: "Your account is pending verification by your school admin"

---

## Test Checklist

### Student Registration
- [ ] Register with email + 6-digit PIN → Success
- [ ] Register with phone + 6-digit PIN → Success
- [ ] Reject PIN with < 6 digits → Error shown
- [ ] Reject PIN with > 6 digits → Error shown
- [ ] Reject PIN with letters → Error shown
- [ ] Reject phone with < 7 digits → Error shown
- [ ] Reject phone with > 15 digits → Error shown

### Student Login
- [ ] Login with email + correct PIN → Success
- [ ] Login with email + wrong PIN → "Invalid credentials" error
- [ ] Login with phone + correct PIN → Success
- [ ] Login with phone (different format) + correct PIN → Success
- [ ] Login with phone + wrong PIN → "Invalid credentials" error
- [ ] Login with unverified account → "Pending verification" error

### Rate Limiting
- [ ] 10 failed login attempts → Locked for 15 minutes
- [ ] Correct password after rate limit expires → Works

### Database Integrity
- [ ] Email-registered students have email, no phone
- [ ] Phone-registered students have phone, no email
- [ ] Passwords are bcrypt hashed (not plaintext)
- [ ] PINs are bcrypt hashed (not plaintext)

---

## Production Verification

### Before Deploying to Production:
- [ ] All test scenarios pass on staging
- [ ] No console errors or warnings
- [ ] Database migration successful
- [ ] Rate limiting working correctly
- [ ] Email verification flow working
- [ ] Phone number fuzzy matching tested with international formats

### After Deploying to Production:
- [ ] Monitor login success rates
- [ ] Monitor registration success rates
- [ ] Check error logs for validation failures
- [ ] Verify student account creation timestamps
- [ ] Test with real student logins

---

## Performance Notes

✅ **PIN Hashing:** Using bcrypt 10 rounds (100ms per hash - acceptable for registration)
✅ **Login Speed:** Constant-time comparison prevents timing attacks, minimal performance impact
✅ **Phone Fuzzy Matching:** Uses simple string operations, no regex loops - performant
✅ **Database Queries:** Single find() call with OR conditions - optimal

---

## Security Verification

✅ **PIN Security:** Bcrypt hashing prevents offline attacks
✅ **Timing Attack Prevention:** Constant-time password comparison
✅ **Rate Limiting:** 10 attempts per 15 minutes on login
✅ **Input Validation:** Zod schema validates all inputs
✅ **Phone Privacy:** Not logging phone numbers in cleartext
✅ **PIN Privacy:** Not logging PINs anywhere

---

## Next Steps

1. **Start Testing** - Follow test scenarios above
2. **Report Issues** - Create GitHub issues if you find problems
3. **Monitor Staging** - Run for 24 hours, watch error logs
4. **Production Deploy** - Only after all staging tests pass
5. **Monitor Production** - Check analytics for registration/login success rates

---

## Quick Command Reference

### Check Database for Recent Registrations
```bash
sqlite3 (or your DB client)
SELECT id, email, phone, first_name, created_at FROM students 
ORDER BY created_at DESC LIMIT 10;
```

### Verify PIN is Hashed (Not Plaintext)
```bash
sqlite3
SELECT password_hash FROM students WHERE first_name = 'John' LIMIT 1;
-- Should show: $2b$10$... (bcrypt format)
-- Should NOT show: 123456 (plaintext)
```

### Check Login Rate Limiting
```bash
redis-cli
KEYS "login-student:*"
TTL login-student:192.168.1.100
```

---

## Support

If you encounter any issues:
1. Check error messages carefully - they indicate exactly what's wrong
2. Review this guide's "Common Issues & Solutions" section
3. Check the CRITICAL_FIXES_SESSION_2.md file for detailed technical info
4. Monitor /server logs for database or validation errors

**All tests passing?** You're ready for production! 🚀
