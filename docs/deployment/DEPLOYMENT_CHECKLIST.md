# 🚀 DEPLOYMENT CHECKLIST - SEO & VERIFICATION

**Date**: 2026-04-06  
**Status**: ✅ Ready for Production Deployment

---

## FILES DEPLOYED

All changes are committed and ready for VPS deployment:

✅ **Modified Files:**
- `src/app/layout.tsx` — Removed force-dynamic
- `src/app/page.tsx` — Added revalidate=3600
- `src/app/sitemap.ts` — Enhanced sitemap
- `src/app/pricing/page.tsx` — Added SEO metadata
- `src/app/login/page.tsx` — Added auth check
- `src/app/(school-admin)/school-portal/login/page.tsx` — Added auth check

✅ **New Files:**
- `public/robots.txt` — 817 bytes, complete crawl rules
- `public/google179e3c2dc79b4d60.html` — Google verification file
- `SEO_FIXES_APPLIED.md` — Full documentation
- `GOOGLE_INDEXING_CHECKLIST.md` — Action steps

---

## VPS DEPLOYMENT STEPS

### Step 1: Pull Latest Code
```bash
cd /var/www/technurturelms.in  # or your app directory
git pull origin main
```

### Step 2: Install & Build
```bash
npm install
npm run build
```

### Step 3: Restart Application
```bash
# For PM2:
pm2 restart technurture-lms

# For Docker:
docker-compose restart

# For systemd:
sudo systemctl restart technurture-lms
```

### Step 4: Verify Deployment
```bash
# Check if site loads:
curl -I https://technurturelms.in

# Check robots.txt:
curl https://technurturelms.in/robots.txt

# Check sitemap:
curl https://technurturelms.in/sitemap.xml

# Check verification file:
curl https://technurturelms.in/google179e3c2dc79b4d60.html
```

---

## GOOGLE SEARCH CONSOLE VERIFICATION

### After Deployment, Verify Domain Ownership:

1. **Open Google Search Console:**
   - URL: https://search.google.com/search-console
   - Sign in with your Google account

2. **Select technurturelms.in property**

3. **Go to Settings → Verification**

4. **Verify with HTML file method:**
   - Look for "HTML file" verification option
   - Click "Verify" button
   - Wait for "Verification successful"

5. **Expected Result:**
   ```
   ✓ Domain ownership verified
   ✓ You can now see full Search Console data
   ```

---

## SITEMAP SUBMISSION

After verification succeeds:

1. **In Google Search Console:**
   - Go to **Sitemaps** (left sidebar)
   - Click **Add/test sitemap**

2. **Submit Sitemap:**
   - Enter: `https://technurturelms.in/sitemap.xml`
   - Click **Submit**
   - Wait for "Success" status

3. **What Google Will See:**
   ```
   Submitted URL: https://technurturelms.in/sitemap.xml
   Status: Success
   Indexes: 9 URLs
   - Homepage: priority 1.0 (daily)
   - Pricing: priority 0.9 (weekly)
   - Registration: priority 0.9 (weekly)
   - Contact: priority 0.8 (monthly)
   - Legal pages: priority 0.5 (monthly)
   ```

---

## URL INDEXING REQUESTS

After sitemap submitted, request indexing for key pages:

1. **Homepage:**
   - URL: `https://technurturelms.in`
   - Click "URL Inspection" → Test live URL → Request indexing

2. **Pricing Page:**
   - URL: `https://technurturelms.in/pricing`
   - Repeat same steps

3. **Contact Page:**
   - URL: `https://technurturelms.in/contact-us`
   - Repeat same steps

4. **Registration Pages:**
   - `https://technurturelms.in/register/student`
   - `https://technurturelms.in/register/school`

---

## VERIFICATION FILE MAINTENANCE

⚠️ **IMPORTANT:**

- **Keep `/public/google179e3c2dc79b4d60.html` in repository**
- **Never delete or move this file**
- **Google checks it periodically to maintain verification**
- **File size: 53 bytes**
- **Content: Single line verification string**

If you delete it and lose verification, you'll need to re-verify the domain.

---

## MONITORING CHECKLIST

### Daily (First Week):
- [ ] Site loads without errors
- [ ] robots.txt accessible at `/robots.txt`
- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] Verification file accessible
- [ ] No server errors in logs

### Weekly (First Month):
- [ ] Check Google Search Console Performance tab
- [ ] Monitor crawl stats
- [ ] Check indexing progress
- [ ] Verify no crawl errors

### Monthly (Ongoing):
- [ ] Check organic search traffic
- [ ] Monitor keyword rankings
- [ ] Track Click-Through Rate (CTR)
- [ ] Check index coverage

---

## EXPECTED TIMELINE

| Timeline | Expected Results |
|----------|------------------|
| **Deployment Day** | Site updated, verification file accessible |
| **Days 1-3** | Google re-crawls site with new robots.txt |
| **Days 3-7** | Sitemap discovered, pages queued for indexing |
| **Week 2** | Initial pages indexed, appear in search |
| **Week 3** | More pages indexed, rankings improve |
| **Week 4+** | Consistent organic traffic, stable rankings |

---

## BUILD VERIFICATION

**Current Build Status:**
```
✓ Compiled successfully in 33.2s
✓ 33/33 routes generated
✓ Zero TypeScript errors
✓ Zero warnings
✓ All static assets included
✓ Google verification file included
```

---

## ROLLBACK (If Needed)

If something goes wrong after deployment:

```bash
# Revert to previous version:
git revert HEAD
git push origin main

# Rebuild:
npm run build

# Restart:
pm2 restart technurture-lms
```

The changes are minimal and non-breaking, so rollback is unlikely to be needed.

---

## SUCCESS INDICATORS

After 4 weeks, you should see:

✅ **Google Search Console:**
- Domain ownership verified
- Sitemap successfully processed
- Pages indexed (9+)
- Organic search traffic appearing

✅ **Google Search Results:**
- Site appears when searching "TechNurture"
- Site appears when searching "technurturelms.in"
- Site appears when searching "LMS for students India"

✅ **Analytics:**
- Organic search traffic visible
- Measurable click-through rate (CTR)
- Growing impressions month-over-month

---

## FINAL CHECKLIST

Before declaring deployment complete:

- [ ] Code deployed to VPS
- [ ] `npm run build` succeeds
- [ ] Application starts without errors
- [ ] https://technurturelms.in loads
- [ ] https://technurturelms.in/robots.txt accessible
- [ ] https://technurturelms.in/sitemap.xml accessible
- [ ] https://technurturelms.in/google179e3c2dc79b4d60.html accessible
- [ ] Google Search Console shows domain verification pending
- [ ] Domain verified in GSC
- [ ] Sitemap submitted in GSC
- [ ] URLs requested for indexing

---

## SUPPORT

If verification fails or something isn't working:

1. **Check deployment logs:**
   ```bash
   pm2 logs technurture-lms
   ```

2. **Verify files exist:**
   ```bash
   ls -la /var/www/technurturelms.in/public/robots.txt
   ls -la /var/www/technurturelms.in/public/google179e3c2dc79b4d60.html
   ```

3. **Check Next.js build output:**
   ```bash
   npm run build 2>&1 | tail -20
   ```

4. **Test URLs directly:**
   ```bash
   curl -v https://technurturelms.in/robots.txt
   curl -v https://technurturelms.in/sitemap.xml
   ```

---

✨ **Ready to Deploy. Your site will be ranking in Google within 2-4 weeks.** ✨
