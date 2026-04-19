# UI Redesign — Sharp Light Design System

## Overview

Replace all `@material/web` (Material 3) components with a custom design system that is minimalist, futuristic, and exclusive-feeling. The new aesthetic is **sharp light**: white/off-white backgrounds, black typography, angular geometry, and a single lime accent used only on prices and CTA highlights.

---

## Design Tokens

```css
:root {
  --bg:           #f5f5f5;   /* page background */
  --surface:      #ffffff;   /* cards, sheets, navbars */
  --border:       #e0e0e0;   /* default border */
  --border-strong:#b0b0b0;   /* interactive borders (qty, inputs) */
  --text:         #0d0d0d;   /* primary text + CTA buttons */
  --text-2:       #666666;   /* secondary text, descriptions */
  --text-3:       #999999;   /* muted labels, timestamps */
  --accent:       #c9f04a;   /* lime — CTA accent spans only */
  --accent-dark:  #8db200;   /* lime — price text (WCAG AA on white) */
  --radius:       2px;       /* universal border-radius */
}
```

No shadows. No gradients. No rounded pills.

---

## Typography

- **Font stack:** `'Helvetica Neue', Helvetica, Arial, sans-serif`
- **Size scale:** 9px labels → 12px body → 13px prices → 17-20px sheet titles → 32px pay amount
- **Uppercase + letter-spacing** for all labels, category links, and CTA text (`letter-spacing: .12–.18em`)
- **Font weights:** 400 body · 600 card names · 700 prices, CTAs, headings

---

## Layout Rules

- **Border-radius:** 2px maximum everywhere (inputs, buttons, cards, sheets)
- **Grid gaps:** 1px (creates editorial separator lines between cards)
- **Grid:** 2-column product grid, full-width on mobile
- **No box shadows** — use 1px borders for depth instead

---

## Components

### Top Bar
- Height: ~52px, `border-bottom: 1px solid var(--border)`, `background: var(--surface)`
- Logo: uppercase, letter-spaced, 12px, bold
- Right: search icon button + cart icon button (32×32px, 1px border)
- Cart button shows item count badge: black square, white number, positioned top-right

### Category Nav
- Horizontal scrollable row below top bar
- Text links (not pills/chips): `font-size: 11px`, uppercase, letter-spaced
- Active indicator: `border-bottom: 1.5px solid var(--text)` (underline, not background)
- `margin-bottom: -1px` to sit on the container's bottom border

### Product Card
- `background: var(--surface)`, no border (separated by 1px grid gap)
- Image area: square aspect-ratio 1:1, `background: var(--bg)`, emoji or real image
- Body: category label (9px muted) → name (12px bold) → price + add button row
- Price: `color: var(--accent-dark)`, bold
- Add button: 26×26px, `background: var(--text)`, white `+`, no radius (2px)

### Product Detail Sheet (bottom sheet)
- Triggered on card tap
- Overlay: `rgba(0,0,0,.35)` scrim behind sheet
- Sheet height: 72% of screen, `border-top: 1px solid var(--border-strong)`
- Structure: drag handle → image (180px fixed) → scrollable body → pinned footer
- Scrollable body: category · name (17px bold) · description · price (20px) · qty selector
- Qty selector: three-cell strip with 1px borders, no radius
- Pinned footer: full-width CTA button with accent price span inside: `"AÑADIR AL CARRITO · $35.00"` (price in `var(--accent)`)

### CTA Button (primary)
- `background: var(--text)`, `color: var(--surface)`, `height: 46-48px`
- `font-size: 11px`, `font-weight: 700`, `letter-spacing: .16em`, uppercase
- `border-radius: var(--radius)` (2px)
- Accent price spans within: `color: var(--accent)`

### Secondary Button / Ghost
- `background: transparent`, `border: 1px solid var(--border)`, `color: var(--text-2)`
- Same size and typography as CTA

### Qty Selector
- Three-cell strip: `[−][n][+]`, separated by 1px borders
- Outer border: `1px solid var(--border-strong)`
- No border-radius

### Cart Item Row
- Thumbnail 52×52px with 1px border
- Name (12px bold) + sub-label (11px muted)
- Right: price (accent-dark) + inline qty selector

### Cart Summary
- Subtotal / Envío / Total rows
- Total row separated by top border, font-size 14px bold
- Total price in `var(--accent-dark)`

### QR Payment Screen
- Amount: 32px bold in `var(--accent-dark)`
- Countdown: 22px bold, turns red `#e53935` when < 60s
- QR canvas: 180×180px, 1px border, white background
- Wallet address row: monospace address + "COPIAR" ghost button
- Verify CTA button at bottom

### Age Gate
- Full-screen white, centered content
- Logo, title, description
- Two buttons: "TENGO 18 AÑOS O MÁS" (CTA black) + "SOY MENOR DE EDAD" (ghost)
- Legal disclaimer text at bottom (9px muted)

---

## What Gets Removed

- All `@material/web` imports and web component usages (`<md-*>` tags)
- All M3 color tokens (`--md-sys-color-*`)
- All Material ripple effects and M3 typography scale
- Rounded pill buttons and chip components

---

## What Gets Added / Changed

- New `src/lib/design-tokens.css` with the token set above
- All interactive elements rebuilt as plain HTML elements + Tailwind classes
- Bottom sheet implemented as a Zustand-controlled overlay (no library)
- Age gate page/component at `/age-gate` route (checked via cookie on first visit)

---

## Screen Inventory

| Screen | Route | Notes |
|--------|-------|-------|
| Age Gate | `/age-gate` or modal | Cookie `age_verified=1`, 365d |
| Home / Catalog | `/` | Category nav + 2-col grid |
| Product Detail | Sheet overlay on `/` | No route change |
| Cart | `/cart` | Items + summary + CTA |
| Checkout | `/checkout` | Address form |
| Payment QR | `/pay/[orderId]` | QR + countdown + polling |
| Order Confirm | `/confirm/[orderId]` | Status + tx hash |
| Admin (all) | `/admin/*` | Dark exception allowed for admin |

---

## Admin Exception

Admin panel (`/admin/*`) keeps a dark theme (`#0d0d0d` bg) since it's operator-only and not part of the customer experience. Same angular design language, just dark.

---

## Acceptance Criteria

- Zero `<md-*>` elements in the customer-facing pages
- No `@material/web` imports in customer-facing files
- All buttons pass WCAG AA contrast (black on white ✓, white on black ✓, `#8db200` on white ✓)
- Accent color (`#c9f04a` / `#8db200`) appears **only** on prices and CTA accent spans
- Border-radius never exceeds 4px on any customer-facing element
- Product detail sheet opens without page navigation
- Age gate shows on first visit, skipped on subsequent visits (cookie)
