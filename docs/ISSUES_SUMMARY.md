# Student Dashboard Issues - Summary Report

## Status: ✅ ALL THREE ISSUES CONFIRMED & ANALYZED

---

## **ISSUE #1: CONTENT DOWNLOADS NOT RESTRICTED** 🔴 HIGH PRIORITY

### Locations Found

#### 1. PDF Viewer → "Open in Browser" Button
- **File**: `src/modules/student/components/learning/pdf-viewer.tsx`
- **Lines**: 240-248
- **Code**: `<a href={absoluteUrl} target="_blank"><ExternalLink /></a>`
- **Problem**: Opens PDF in new tab where users can right-click → download

#### 2. PPT Viewer → "Download File" Button  
- **File**: `src/modules/student/components/learning/ppt-viewer.tsx`
- **Lines**: 197-205
- **Code**: `<a href={url} download><Download /> Download File</a>`
- **Problem**: Direct download link with `download` attribute

#### 3. Lesson Content → "Download & Continue" Button
- **File**: `src/modules/student/components/lesson/lesson-content.tsx`
- **Lines**: 244-270
- **Code**: `<a href={block.url} download onClick={() => onComplete()}>Download & Continue</a>`
- **Problem**: Direct download for presentation files

### Root Cause
Buttons designed for convenience expose files for download.

### Required Fix
**Remove 3 buttons** that allow download/external access.

---

## **ISSUE #2: PDF FULLSCREEN SCROLLING BROKEN** 🟡 MEDIUM PRIORITY

### Location
- **File**: `src/modules/student/components/learning/pdf-viewer.tsx`
- **Lines**: 220-343

### Root Cause IDENTIFIED ✅

**Parent container (line 273):**
```tsx
className="...h-[75vh]...overflow-hidden..."
```
- `h-[75vh]` = Height locked to 75% viewport ❌
- `overflow-hidden` = **BLOCKS SCROLLING** ❌

**Child content (line 300):**
```tsx
className="...overflow-y-auto...h-full..."
```
- `overflow-y-auto` = Allows scroll ✅
- `h-full` = Takes full parent height ✅

**Problem Chain:**
1. Parent has `overflow-hidden` ← Blocks child scrolling
2. Parent height `h-[75vh]` ← Only 75% viewport
3. Fullscreen: Container becomes `fixed inset-0` but content still `h-[75vh]`
4. Header `sticky top-0` ← Takes space at top
5. **Result**: No scrolling possible

### Required Fix
- Change `overflow-hidden` → `overflow-y-auto` in fullscreen mode
- Adjust height to `h-full` when fullscreen
- Account for header height

---

## **ISSUE #3: VIDEO SCROLL-OVER FEATURE MISSING** 🟡 MEDIUM PRIORITY

### Current State
Videos are **NOT** sticky/floating. Scrolling down = video disappears.

### Desired Behavior (YouTube-style)
```
Normal scrolling:   [Video at top] ↓ Scroll down
                    ↓
Becomes floating:   [Small video in corner]
                    (Can scroll content behind it)
                    (Can drag to reposition)
```

### Files Affected
1. **Regular Videos**: `src/modules/student/components/video/video-player.tsx`
   - Uses Vidstack player
   - ❌ No sticky/floating logic
   
2. **Cloudflare Stream**: `src/modules/student/components/video/cloudflare-stream-player.tsx`
   - Uses iframe embed
   - ❌ Limited external control via iframe sandbox

### Required Implementation
- Sticky positioning CSS
- Scroll event listeners for shrinking
- Drag-to-reposition functionality
- Special handling for Cloudflare iframe

---

## Summary Table

| Issue | File | Lines | Type | Fix |
|-------|------|-------|------|-----|
| **1a. PDF "Open in Browser"** | pdf-viewer.tsx | 240-248 | Delete button | Remove ExternalLink button |
| **1b. PPT "Download File"** | ppt-viewer.tsx | 197-205 | Delete button | Remove download link |
| **1c. Lesson "Download & Continue"** | lesson-content.tsx | 244-270 | Delete button | Remove download attribute |
| **2. PDF Fullscreen Scroll** | pdf-viewer.tsx | 273-343 | CSS fix | overflow-hidden → overflow-y-auto |
| **3. Video Scroll-Over** | video-player.tsx<br/>cloudflare-stream-player.tsx | — | New feature | Implement sticky floating UI |

---

## Fix Priority

### Phase 1 - CRITICAL (Remove Downloads)
- **Time**: 15 minutes
- **Impact**: ✅ Blocks unauthorized downloads
- **Actions**: Remove 3 buttons

### Phase 2 - IMPORTANT (Fix PDF Scrolling)
- **Time**: 20-30 minutes  
- **Impact**: ✅ Users can scroll PDFs in fullscreen
- **Actions**: CSS fixes + height adjustments

### Phase 3 - ENHANCEMENT (Video Scroll Feature)
- **Time**: 1-2 hours
- **Impact**: ✅ Better mobile UX
- **Actions**: Sticky video + drag interaction

---

## ✅ ANALYSIS COMPLETE

All issues identified, root causes found, fix locations pinpointed.

**Ready to proceed with fixes when approved.**
