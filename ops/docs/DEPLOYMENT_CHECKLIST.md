# 🚀 DEPLOYMENT CHECKLIST — Production Readiness Gate

**Created:** April 2, 2026  
**Status:** ❌ **BLOCKED — Do not proceed without completing all items**  

---

## PRE-DEPLOYMENT SECURITY GATES

### Critical Vulnerability Fixes

- [ ] **IDOR #1:** Course access verification added
  - File: `/src/modules/student/actions/course-actions.ts`
  - Verification: Unit test passes, enrollment check guarding all returns
  - Owner: ___________
  - Status: ❌ Not started

- [ ] **IDOR #2:** Media serving enrollment check added
  - File: `/src/app/api/media/[...path]/route.ts`
  - Verification: Can't access media without enrollment, presigned URLs with expiry
  - Owner: ___________
  - Status: ❌ Not started

- [ ] **XSS #3:** Course topics sanitized
  - File: `/src/db/schema.ts` + creation handlers
  - Verification: Input sanitization on all topic inputs, no HTML rendered unsafely
  - Owner: ___________
  - Status: ❌ Not started

- [ ] **CSRF #4:** State-changing actions protected
  - File: `/src/modules/*/actions/*.ts`
  - Verification: Origin validation or CSRF tokens on all POST/PUT/DELETE
  - Owner: ___________
  - Status: ❌ Not started

- [ ] **Secrets #5:** Rotated and removed from git
  - Action: Generate new JWT_SECRET, APP_ENCRYPTION_KEY
  - Action: Remove from git history
  - Verification: Secrets not in any git commit
  - Owner: ___________
  - Status: ❌ Not started

- [ ] **Leaderboard #6:** School-scoped isolation added
  - File: `/src/lib/gamification.ts`
  - Verification: Redis keys include school_id, no cross-tenant mixing
  - Owner: ___________
  - Status: ❌ Not started

- [ ] **Quiz Answers #7:** Hidden until submission
  - File: `/src/modules/student/actions/lesson-actions.ts`
  - Verification: API response before submission has no correct_answer field
  - Owner: ___________
  - Status: ❌ Not started

- [ ] **Password #8:** Old password verification required
  - File: `/src/app/api/auth/password/route.ts`
  - Verification: Returns 401 if old password doesn't match
  - Owner: ___________
  - Status: ❌ Not started

---

### Code Review & Testing

- [ ] **Security Code Review #1**
  - Reviewer 1: ___________  
  - Status: ❌ Pending
  - Approval: ❌ Not approved

- [ ] **Security Code Review #2**
  - Reviewer 2: ___________  
  - Status: ❌ Pending
  - Approval: ❌ Not approved

- [ ] **Integration Test Suite (100% pass)**
  - Tests: `npm test -- --integration`
  - Pass Rate: __% / 100%
  - Owner: ___________
  - Status: ❌ Not started

- [ ] **Security Test Suite**
  - Tests include: IDOR, CSRF, XSS, auth bypass attempts
  - Pass Rate: __% / 100%
  - Owner: ___________
  - Status: ❌ Not started

- [ ] **Load Test (1,000 concurrent users)**
  - Tool: k6, Artillery, or Apache JMeter
  - Concurrent Users: 1,000
  - Duration: 10 minutes
  - P95 Latency: < 500ms target
  - Error Rate: < 0.1% target
  - Owner: ___________
  - Status: ❌ Not started

---

### Infrastructure & Operations

- [ ] **Monitoring Configured**
  - Tool: Sentry for errors / CloudWatch for logs
  - Status: ❌ Not configured
  - Dashboard URL: _________________________

- [ ] **Alerting Rules Created**
  - CPU > 80% → alert on-call
  - Error rate > 1% → alert on-call
  - Database connections > 80 → alert on-call
  - Status: ❌ Not configured

- [ ] **Backup Strategy Implemented**
  - Daily automated backups enabled
  - Retention: 30 days minimum
  - PITR tested and working
  - Last restore test: ______________
  - Owner: ___________
  - Status: ❌ Not started

- [ ] **Incident Response Runbook Created**
  - Format: Markdown in `/docs/incident-response.md`
  - Covers: Database crash, Redis crash, DDoS, security breach
  - Team trained: ❌ Not trained
  - Owner: ___________

---

### Secrets & Configuration

- [ ] **Secrets Management System**
  - Location: _________________________
  - Rotation schedule: Every 90 days
  - Access control documented: ❌ No

- [ ] **Environment Variables Validated**
  - JWT_SECRET: Length >= 32 ✓
  - APP_ENCRYPTION_KEY: Length >= 32 ✓
  - DATABASE_URL: Uses strong password ✓
  - REDIS_URL: Configured ✓
  - Status: ❌ Not validated

- [ ] **.env File NOT in Repository**
  - Verify: `.gitignore` contains `.env` ✓
  - Status: ❌ Not verified

---

### Compliance & Legal

- [ ] **GDPR Compliance Check**
  - User data deletion working
  - Data access audit logs
  - Consent tracking for minors
  - Status: ❌ Not reviewed

- [ ] **COPPA Compliance (Children's Data)**
  - Guardian consent verification working
  - Age verification on signup
  - No tracking for minors
  - Status: ❌ Not reviewed

- [ ] **Data Privacy Policy Published**
  - URL: _________________________
  - Legal review: ❌ Not done

- [ ] **Terms of Service Published**
  - URL: _________________________
  - Legal review: ❌ Not done

---

### Documentation

- [ ] **API Documentation**
  - Format: OpenAPI/Swagger
  - Status: ❌ Not created

- [ ] **Deployment Guide Updated**
  - File: `/DEPLOYMENT_GUIDE.md`
  - Status: Review current state

- [ ] **Architecture Diagram**
  - Shows: App, database, Redis, monitoring
  - Status: ❌ Not created

---

## DEPLOYMENT DAY CHECKLIST

### Pre-Deployment (1 hour before)

- [ ] All fixes merged to main and tested in staging
- [ ] Backup taken and tested restorable
- [ ] Rollback plan documented and tested
- [ ] On-call team briefed on changes
- [ ] Status page ready (if applicable)

### Deployment

- [ ] Secrets rotated in production environment
- [ ] Application restarted with new secrets
- [ ] Health checks passing (database, redis, API)
- [ ] Database migrations completed
- [ ] First few requests monitored

### Post-Deployment (1 hour after)

- [ ] Critical paths tested in production
  - [ ] Student login
  - [ ] Course access (verify enrollment check)
  - [ ] Media download (verify enrollment check)
  - [ ] Quiz submission (verify answers handling)

- [ ] Monitoring dashboard checked
  - [ ] Error rate normal
  - [ ] CPU normal
  - [ ] No alerts firing

- [ ] Logs reviewed for errors

---

## SIGN-OFF

**Security Lead:**
- Name: ___________
- Date: ___________
- Approval: ❌ BLOCKED

**CTO/Technical Lead:**
- Name: ___________
- Date: ___________
- Approval: ❌ BLOCKED

---

**This checklist blocks production deployment. Do not proceed without completing all critical items and obtaining all approvals.**
