

## Make All Modals Fully Responsive

This plan addresses the modal sizing and responsiveness issues across three modal components: **ProductDetailModal**, **PriceComparator**, and **SavingsBreakdown**. Each will be updated to use relative/viewport units, flexbox centering, internal scrolling, and smooth animations.

---

### What Changes

**1. ProductDetailModal** (`src/components/products/ProductDetailModal.tsx`)

Current problem: Uses `sm:w-[680px]` (fixed pixel width) and `fixed inset-4` which can clip content on small screens.

Changes:
- Replace the outer container positioning with a **flexbox centering wrapper** (`fixed inset-0 flex items-center justify-center`) instead of translate-based centering
- Set width to `w-[95vw] sm:w-[90vw] max-w-[800px]` (relative units with a sensible max)
- Set height to `max-h-[90vh]` across all breakpoints
- Add mobile safe area padding via `pb-[env(safe-area-inset-bottom)]`
- On mobile: apply `mx-2` minimal margins so it's nearly fullscreen
- Keep the existing `ScrollArea` for internal content scrolling (already correct)
- Keep the existing scale + opacity framer-motion entrance animation
- Ensure the close button stays pinned in the sticky header

**2. PriceComparator** (`src/components/products/PriceComparator.tsx`)

Current problem: Uses `sm:max-w-md` and `inset-x-4 top-[10%]` with `overflow-y-auto` on the modal container itself (not ideal structure).

Changes:
- Replace positioning with a **flexbox centering wrapper** (`fixed inset-0 flex items-center justify-center p-4`)
- Set width to `w-full sm:w-[90vw] max-w-md`
- Set height to `max-h-[90vh]`
- Move `overflow-y-auto` to the internal content area only, keeping the header sticky
- Structure as `flex flex-col` with a shrink-0 header and `flex-1 overflow-y-auto` body
- Add mobile safe area inset

**3. SavingsBreakdown** (`src/components/cart/SavingsBreakdown.tsx`)

Current problem: Uses a slide-in drawer pattern (`fixed right-0 top-0 bottom-0`) with `sm:max-w-sm`. This is intentionally a side drawer, but needs responsive width.

Changes:
- On mobile: use `w-full` (full width) for the drawer
- On tablet/desktop: keep `sm:max-w-sm` side drawer
- Ensure `max-h-screen` with internal scroll (already has `overflow-y-auto`)
- Add safe area bottom padding

---

### Technical Details

**Files modified (3):**

| File | Change |
|------|--------|
| `src/components/products/ProductDetailModal.tsx` | Refactor modal container to use flexbox centering wrapper, viewport-relative sizing, and safe area padding |
| `src/components/products/PriceComparator.tsx` | Refactor to flexbox centering wrapper, move scroll to inner content, viewport-relative sizing |
| `src/components/cart/SavingsBreakdown.tsx` | Add safe area padding and ensure full-width on mobile |

**Responsive behavior summary:**

```text
ProductDetailModal:
  Mobile  (<640px):  w-[95vw], max-h-[90vh], ~2.5vw side margins
  Tablet  (640-1024): w-[90vw], max-h-[90vh], centered
  Desktop (>1024):   max-w-[800px], max-h-[90vh], centered

PriceComparator:
  Mobile  (<640px):  w-full with p-4 wrapper (effectively ~92vw)
  Tablet  (640-1024): w-[90vw] max-w-md, centered
  Desktop (>1024):   max-w-md (~28rem), centered

SavingsBreakdown (side drawer):
  Mobile  (<640px):  w-full (entire screen width)
  Tablet+ (>=640px): max-w-sm (24rem), right-anchored
```

**Key patterns used:**
- Flexbox centering wrapper instead of `translate-x/y` hack (more robust, respects safe areas)
- `max-h-[90vh]` ensures modals never overflow the viewport
- Internal `overflow-y-auto` or `ScrollArea` for content scrolling
- `pb-[env(safe-area-inset-bottom)]` for iOS notch/home-bar safe areas
- Existing framer-motion `scale + opacity` animations are preserved

No new dependencies or database changes are required.

