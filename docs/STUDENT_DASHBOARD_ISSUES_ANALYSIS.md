# Student Dashboard Issues Analysis

**Date**: 2026-04-07  
**Analysis Phase**: IDENTIFICATION & VERIFICATION  
**Status**: THREE ISSUES CONFIRMED

---

## Issue 1: Download Buttons for Content (CONFIRMED ✅)

### **Current Behavior**
Download buttons currently exist for:
- **PPT/Presentation files**: `src/modules/student/components/learning/ppt-viewer.tsx` (line 197-205)
  ```tsx
  <a href={url} download className="...">
      <Download size={14} /> Download File
  </a>
  ```
  
- **Lesson content (generic)**: `src/modules/student/components/lesson/lesson-content.tsx` (line 244-270)
  ```tsx
  <a href={block.url} download onClick={() => onComplete()}>
      Download & Continue
  </a>
  ```

### **Issue Details**
Files that can be downloaded:
- ✅ PDF files (via external link in pdf-viewer.tsx line 240-248 - "Open in Browser" button)
- ✅ Presentation/PPT files (explicit download button in ppt-viewer.tsx)
- ✅ Generic lesson content (direct download link in lesson-content.tsx)

### **PDF-Specific Issue**
In `pdf-viewer.tsx` (lines 240-248), there are TWO buttons:
1. **"Open in Browser" (ExternalLink icon)** - Opens PDF in new tab (external link)
2. **"Fullscreen" (Maximize icon)** - Opens in fullscreen mode

⚠️ **PROBLEM**: The "Open in Browser" button allows opening the PDF in a new tab. While this isn't technically a download, it exposes the file in a new window where users can download it via browser context menu.

### **Root Cause**
The PDF viewer intentionally provides an external link to give users an escape hatch if the embedded viewer fails. However, this allows file exposure.

### **Required Action**
Remove the "Open in Browser" (`ExternalLink`) button from PDF viewer to prevent file access.

---

## Issue 2: PDF Fullscreen Scrolling Problem (CONFIRMED ✅)

### **Current Implementation**
In `pdf-viewer.tsx`:

**Lines 220-228**: Fullscreen container setup
```tsx
<div 
    className={cn(
        'w-full flex flex-col bg-slate-50 relative',
        isFullscreen ? 'fixed inset-0 z-[200] max-w-none' : 'rounded-3xl overflow-hidden border border-slate-100 shadow-sm',
        className
    )} 
    ref={containerRef}
>
```

**Lines 273-343**: Content scrolling area
```tsx
<div className="flex-1 min-h-[500px] h-[75vh] bg-slate-200/50 relative overflow-hidden">
    {/* ... PDF content ... */}
    <div className="h-full overflow-y-auto no-scrollbar scroll-smooth p-4 space-y-6 flex flex-col items-center">
        {/* PDF pages rendered here */}
    </div>
</div>
```

### **Issue Analysis**

**Problem Identified**: The PDF content container (line 300) has:
```tsx
<div className="h-full overflow-y-auto no-scrollbar scroll-smooth ...">
```

But the parent container (line 273) has:
```tsx
<div className="flex-1 min-h-[500px] h-[75vh] bg-slate-200/50 relative overflow-hidden">
```

**The Problem Chain**:
1. In fullscreen mode, the container becomes `fixed inset-0` (full viewport)
2. The content area has `overflow-hidden` ❌ - This BLOCKS scrolling!
3. The inner div has `overflow-y-auto`, but its parent won't let it scroll
4. When fullscreen, the parent container's height is `h-[75vh]` (75% of viewport), which doesn't adjust to fullscreen

**Additional Issue**:
- Line 174-176: Body scroll is locked when fullscreen
  ```tsx
  useEffect(() => {
      document.body.style.overflow = isFullscreen ? 'hidden' : '';
      return () => { document.body.style.overflow = ''; };
  }, [isFullscreen]);
  ```
  This is correct, but the inner container needs `overflow-y-auto` to work properly.

### **Root Cause**
When fullscreen:
- Container is `fixed inset-0` ✅
- But content wrapper is `overflow-hidden` ❌ - This prevents scrolling
- Height is still `h-[75vh]` ❌ - Should be `h-full` in fullscreen
- Header is `sticky top-0 z-10` ✅ - This is correct

### **Required Fix**
1. Change content container from `overflow-hidden` to `overflow-y-auto` in fullscreen mode
2. Change height from `h-[75vh]` to be `h-full` minus header when fullscreen
3. Ensure scrollbar styling doesn't interfere

---

## Issue 3: Video Scroll-Over Feature (CONFIRMED ❌ MISSING)

### **Current Video Implementation**
- **Regular videos**: `src/modules/student/components/video/video-player.tsx`
  - Uses Vidstack player with `DefaultVideoLayout`
  - Desktop: Full controls visible
  - Mobile: Controls auto-hide after 3 seconds
  
- **Cloudflare Stream videos**: `src/modules/student/components/video/cloudflare-stream-player.tsx`
  - Uses iframe embed from `https://iframe.videodelivery.net/`
  - Limited control options (controlled by Cloudflare)

### **What Is "Scroll-Over Feature"?**
YouTube behavior: When watching a video in fullscreen on mobile, you can scroll down through comments/recommendations while the video stays pinned at the top of the viewport. The video is draggable/scrollable but remains accessible.

### **Current State**
✅ **Videos in normal mode**: 
- Responsive and playable in a container
- Can scroll past the video in the page

❌ **Missing Feature**:
- No "sticky" or "floating" video behavior
- When you scroll the page, the video scrolls away
- No YouTube-style scroll-over pinned video
- Mobile experience: Video takes full width, scrolling hides it

### **Implementation Challenge**
This feature requires:
1. **Sticky/Fixed positioning** - Keep video at top when scrolling
2. **Responsive resizing** - Shrink video as you scroll down
3. **Drag interaction** - Allow dragging to reposition floating video
4. **Page content scrolling** - Enable content to scroll behind/below video

### **Cloudflare iframe limitation**:
The Cloudflare embedded iframe (uses `<iframe src="https://iframe.videodelivery.net/...">`) has:
- ✅ Full playback controls
- ❌ Limited external control via postMessage
- ❌ May not support floating/sticky positioning due to iframe sandbox restrictions
- ⚠️ Custom scroll behavior might not work with iframes

---

## Summary: All Three Issues CONFIRMED

| Issue | Location | Status | Severity |
|-------|----------|--------|----------|
| **Issue 1: Download Access** | `pdf-viewer.tsx` line 240-248 | CONFIRMED | 🔴 HIGH |
| | `ppt-viewer.tsx` line 197-205 | CONFIRMED | 🔴 HIGH |
| | `lesson-content.tsx` line 244-270 | CONFIRMED | 🔴 HIGH |
| **Issue 2: PDF Scroll (Fullscreen)** | `pdf-viewer.tsx` line 273-343 | CONFIRMED | 🟡 MEDIUM |
| | Root: `overflow-hidden` on content area | ROOT CAUSE FOUND | 🟡 MEDIUM |
| **Issue 3: Video Scroll-Over** | `video-player.tsx` | NOT IMPLEMENTED | 🟡 MEDIUM |
| | `cloudflare-stream-player.tsx` | NOT IMPLEMENTED | 🟡 MEDIUM |

---

## Recommended Fix Priority

### **Phase 1: Critical (Download Access - Security)**
1. Remove "Open in Browser" button from PDF viewer
2. Remove direct download link from PPT viewer
3. Remove download functionality from lesson-content.tsx (for non-certificate content)

### **Phase 2: Important (PDF Scrolling)**
1. Fix `overflow-hidden` → `overflow-y-auto` for fullscreen content
2. Adjust height calculations for fullscreen mode
3. Test scrolling in fullscreen on desktop and mobile

### **Phase 3: Enhancement (Video Scroll-Over)**
1. Design sticky/floating video UI for mobile
2. Implement scroll-lock behavior for Cloudflare player (if possible)
3. Add drag-to-reposition for floating video
4. Test on multiple devices

---

## Next Steps

Awaiting user confirmation to proceed with fixes. All issues have been thoroughly identified and root causes located.
