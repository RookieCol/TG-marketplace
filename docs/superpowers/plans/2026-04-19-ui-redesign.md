# UI Redesign — Sharp Light Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all `@material/web` M3 components with a custom sharp-light design system (white background, black CTAs, lime accent on prices only, 2px border-radius, no shadows).

**Architecture:** Swap CSS tokens in globals.css, delete Material Web infrastructure files, then rewrite each customer-facing page/component with plain HTML + Tailwind + inline CSS vars. The bottom sheet for product detail is a local React state overlay in the catalog page — no library needed.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4, Zustand, TypeScript

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/app/globals.css` | New light token set, remove all M3 vars |
| Modify | `src/app/layout.tsx` | Remove MaterialProvider, update title |
| Delete | `src/components/material-provider.tsx` | M3 loader (remove entirely) |
| Delete | `src/lib/material.ts` | M3 init util (remove entirely) |
| Delete | `src/components/md.d.ts` | `<md-*>` TS declarations (remove entirely) |
| Modify | `package.json` | Remove `@material/web` dependency |
| Modify | `src/components/age-gate.tsx` | New sharp design, cookie instead of localStorage |
| Modify | `src/app/page.tsx` | Read cookie for age verification |
| Modify | `src/app/catalog/page.tsx` | New topbar + cat-nav + 1px grid, open sheet on card click |
| Modify | `src/components/product-card.tsx` | Sharp light card, + button adds directly |
| Create | `src/components/product-sheet.tsx` | Bottom sheet overlay for product detail |
| Modify | `src/app/cart/page.tsx` | Light theme: white bg, black CTAs, accent prices |
| Modify | `src/components/cart-item.tsx` | New qty selector strip, light theme |
| Modify | `src/app/checkout/page.tsx` | Light theme inputs, order summary, CTA |
| Modify | `src/app/pay/[orderId]/page.tsx` | Light theme QR screen |
| Modify | `src/app/confirm/[orderId]/page.tsx` | Light theme confirmation screen |

---

## Task 1: Design tokens + remove Material Web

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `package.json`
- Delete: `src/components/material-provider.tsx`, `src/lib/material.ts`, `src/components/md.d.ts`

- [ ] **Step 1: Replace globals.css with new light token set**

Replace the entire file content:

```css
@import "tailwindcss";

:root {
  --bg:           #f5f5f5;
  --surface:      #ffffff;
  --border:       #e0e0e0;
  --border-strong:#b0b0b0;
  --text:         #0d0d0d;
  --text-2:       #666666;
  --text-3:       #999999;
  --accent:       #c9f04a;
  --accent-dark:  #8db200;
  --radius:       2px;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

* { box-sizing: border-box; }
```

- [ ] **Step 2: Update layout.tsx — remove MaterialProvider**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'TG Market',
  description: 'Tu tienda de confianza',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-screen max-w-md mx-auto" style={{ background: 'var(--bg)' }}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Remove @material/web from package.json**

Run:
```bash
npm uninstall @material/web
```

- [ ] **Step 4: Delete Material Web infrastructure files**

```bash
rm src/components/material-provider.tsx src/lib/material.ts src/components/md.d.ts
```

- [ ] **Step 5: Verify build compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: Build completes. If errors mention `material-provider` or `MaterialProvider`, check layout.tsx import was fully removed.

- [ ] **Step 6: Verify no md- references remain in customer files**

```bash
grep -r "md-\|material-provider\|@material/web" src/app src/components --include="*.tsx" --include="*.ts" -l
```

Expected: no output (zero matches).

- [ ] **Step 7: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx package.json package-lock.json
git rm src/components/material-provider.tsx src/lib/material.ts src/components/md.d.ts
git commit -m "feat: replace M3 tokens with sharp-light design system, remove @material/web"
```

---

## Task 2: Age gate redesign

**Files:**
- Modify: `src/components/age-gate.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Rewrite age-gate.tsx with new design and cookie storage**

Replace entire file:

```tsx
'use client'
import { useEffect, useState } from 'react'

export function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div style={{
      minHeight: '100svh',
      background: 'var(--surface)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      gap: 20,
      textAlign: 'center',
    }}>
      <div style={{ marginBottom: 8 }}>
        <p style={{
          fontSize: 12, fontWeight: 700, letterSpacing: '.22em',
          textTransform: 'uppercase', color: 'var(--text)', marginBottom: 24,
        }}>
          TG Market
        </p>
        <h1 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, color: 'var(--text)', marginBottom: 12 }}>
          Verificación de edad
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, maxWidth: 260 }}>
          Este sitio contiene productos de cannabis. Debes ser mayor de 18 años para continuar.
        </p>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        <button
          onClick={onConfirm}
          style={{
            width: '100%', height: 48,
            background: 'var(--text)', color: 'var(--surface)',
            border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase',
            borderRadius: 'var(--radius)',
          }}
        >
          Tengo 18 años o más
        </button>
        <button
          style={{
            width: '100%', height: 48,
            background: 'transparent', color: 'var(--text-2)',
            border: '1px solid var(--border)', cursor: 'default',
            fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase',
            borderRadius: 'var(--radius)',
          }}
        >
          Soy menor de edad
        </button>
      </div>

      <p style={{ fontSize: 9, color: 'var(--text-3)', lineHeight: 1.5, maxWidth: 240, marginTop: 8 }}>
        Al continuar aceptas nuestros términos de uso. El cannabis puede ser ilegal en tu jurisdicción. Verifica las leyes locales.
      </p>
    </div>
  )
}

export function useAgeVerified() {
  const [verified, setVerified] = useState<boolean | null>(null)

  useEffect(() => {
    const has = document.cookie.split(';').some((c) => c.trim().startsWith('age_verified=1'))
    setVerified(has)
  }, [])

  const confirm = () => {
    document.cookie = 'age_verified=1; max-age=31536000; path=/'
    setVerified(true)
  }

  return { verified, confirm }
}
```

- [ ] **Step 2: Verify page.tsx still works with the updated hook**

Read `src/app/page.tsx` — it calls `useAgeVerified()` and `confirm()`. No changes needed; the hook interface is identical.

- [ ] **Step 3: Verify no md- tags remain in age-gate.tsx**

```bash
grep "md-" src/components/age-gate.tsx
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/components/age-gate.tsx
git commit -m "feat: rewrite age gate with sharp-light design, switch to cookie storage"
```

---

## Task 3: Catalog page + ProductCard + ProductSheet (bottom sheet)

**Files:**
- Modify: `src/app/catalog/page.tsx`
- Modify: `src/components/product-card.tsx`
- Create: `src/components/product-sheet.tsx`

- [ ] **Step 1: Create product-sheet.tsx — bottom sheet overlay**

Create `src/components/product-sheet.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useCartStore } from '@/lib/cart'

const EMOJI: Record<string, string> = {
  preroll: '🌿', gummy: '🍬', oil: '💧', other: '📦',
}

interface Product {
  id: string; name: string; description: string; category: string;
  price_usd: string | number; image_url: string; active: boolean;
}

interface Props {
  product: Product
  onClose: () => void
}

export function ProductSheet({ product, onClose }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const [qty, setQty] = useState(1)
  const price = Number(product.price_usd)
  const total = (price * qty).toFixed(2)

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addItem(product as any)
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.35)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border-strong)',
          height: '72%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '4px 4px 0 0',
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 32, height: 2, background: 'var(--border-strong)', margin: '10px auto', flexShrink: 0 }} />

        {/* Product image */}
        <div style={{
          width: '100%', height: 180,
          background: 'var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 64, flexShrink: 0,
          borderBottom: '1px solid var(--border)',
        }}>
          {product.image_url
            ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : EMOJI[product.category] ?? '📦'}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            {product.category}
          </span>
          <span style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2, color: 'var(--text)' }}>
            {product.name}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
            {product.description}
          </span>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-dark)' }}>
            ${price.toFixed(2)}
          </span>

          {/* Qty selector */}
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-strong)', width: 'fit-content' }}>
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              style={{ width: 36, height: 36, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, fontWeight: 300, color: 'var(--text)' }}
            >−</button>
            <span style={{
              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600,
              borderLeft: '1px solid var(--border-strong)', borderRight: '1px solid var(--border-strong)',
            }}>{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              style={{ width: 36, height: 36, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, fontWeight: 300, color: 'var(--text)' }}
            >+</button>
          </div>
        </div>

        {/* Pinned CTA footer */}
        <div style={{ flexShrink: 0, padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          <button
            onClick={handleAdd}
            style={{
              width: '100%', height: 46,
              background: 'var(--text)', color: 'var(--surface)',
              border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase',
              borderRadius: 'var(--radius)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            AÑADIR AL CARRITO ·{' '}
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>${total}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite product-card.tsx with sharp-light design**

Replace entire file:

```tsx
'use client'
import { useCartStore } from '@/lib/cart'

const EMOJI: Record<string, string> = {
  preroll: '🌿', gummy: '🍬', oil: '💧', other: '📦',
}

interface Product {
  id: string; name: string; description: string; category: string;
  price_usd: string | number; image_url: string; active: boolean;
}

export function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const addItem = useCartStore((s) => s.addItem)

  return (
    <div
      onClick={onClick}
      style={{ background: 'var(--surface)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
    >
      {/* Image */}
      <div style={{
        width: '100%', aspectRatio: '1/1',
        background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 42,
        borderBottom: '1px solid var(--border)',
      }}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : EMOJI[product.category] ?? '📦'}
      </div>

      {/* Body */}
      <div style={{ padding: 10, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          {product.category}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, color: 'var(--text)' }}>
          {product.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-dark)' }}>
            ${Number(product.price_usd).toFixed(2)}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); addItem(product as any) }}
            style={{
              width: 26, height: 26,
              background: 'var(--text)', color: 'var(--surface)',
              border: 'none', cursor: 'pointer',
              fontSize: 16, fontWeight: 300,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--radius)',
              lineHeight: 1,
            }}
          >+</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Rewrite catalog/page.tsx with new layout and sheet integration**

Replace entire file:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProductCard } from '@/components/product-card'
import { ProductSheet } from '@/components/product-sheet'
import { useCartStore } from '@/lib/cart'

interface Product {
  id: string; name: string; description: string; category: string;
  price_usd: string | number; image_url: string; active: boolean;
}

type Category = 'all' | 'preroll' | 'gummy' | 'oil' | 'other'

const CATEGORIES: { label: string; value: Category }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Pre-rolls', value: 'preroll' },
  { label: 'Gomitas', value: 'gummy' },
  { label: 'Aceites', value: 'oil' },
  { label: 'Otros', value: 'other' },
]

export default function CatalogPage() {
  const router = useRouter()
  const [all, setAll] = useState<Product[]>([])
  const [category, setCategory] = useState<Category>('all')
  const [sheet, setSheet] = useState<Product | null>(null)
  const itemCount = useCartStore((s) => s.itemCount())

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then(setAll).catch(() => setAll([]))
  }, [])

  const filtered = category === 'all' ? all : all.filter((p) => p.category === category)

  return (
    <div style={{ paddingBottom: 32, minHeight: '100svh', background: 'var(--bg)' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--text)' }}>
          TG Market
        </span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => router.push('/cart')}
            style={{
              width: 32, height: 32,
              border: '1px solid var(--border)',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, color: 'var(--text)',
              borderRadius: 'var(--radius)',
              position: 'relative',
            }}
          >
            ⌁
            {itemCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                width: 14, height: 14,
                background: 'var(--text)', color: 'var(--surface)',
                fontSize: 8, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 0,
              }}>{itemCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Category nav */}
      <nav style={{
        display: 'flex', gap: 0,
        padding: '0 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        overflowX: 'auto',
      }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            style={{
              fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 500,
              color: category === c.value ? 'var(--text)' : 'var(--text-3)',
              padding: '10px 12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              borderBottom: category === c.value ? '1.5px solid var(--text)' : '1.5px solid transparent',
              marginBottom: -1,
              background: 'transparent',
              border: 'none',
              borderBottomStyle: 'solid',
              borderBottomWidth: 1.5,
              borderBottomColor: category === c.value ? 'var(--text)' : 'transparent',
            }}
          >
            {c.label}
          </button>
        ))}
      </nav>

      {/* Product grid: 1px gaps create editorial separators */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 1,
        background: 'var(--border)',
      }}>
        {filtered.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onClick={() => setSheet(p)}
          />
        ))}
      </div>

      {/* Bottom sheet overlay */}
      {sheet && <ProductSheet product={sheet} onClose={() => setSheet(null)} />}
    </div>
  )
}
```

- [ ] **Step 4: Verify no md- tags in any of the three files**

```bash
grep -n "md-\|@material" src/app/catalog/page.tsx src/components/product-card.tsx src/components/product-sheet.tsx
```

Expected: no output.

- [ ] **Step 5: Run build**

```bash
npm run build 2>&1 | tail -20
```

Expected: Compiled successfully.

- [ ] **Step 6: Commit**

```bash
git add src/app/catalog/page.tsx src/components/product-card.tsx src/components/product-sheet.tsx
git commit -m "feat: rebuild catalog with sharp-light design, add product bottom sheet"
```

---

## Task 4: Cart + CartItem redesign

**Files:**
- Modify: `src/app/cart/page.tsx`
- Modify: `src/components/cart-item.tsx`

- [ ] **Step 1: Rewrite cart-item.tsx with new qty selector**

Replace entire file:

```tsx
'use client'
import { useCartStore, type CartItem } from '@/lib/cart'

export function CartItemRow({ item }: { item: CartItem }) {
  const { updateQty } = useCartStore()

  return (
    <div style={{
      background: 'var(--surface)',
      padding: '12px 16px',
      display: 'flex', gap: 12, alignItems: 'center',
    }}>
      {/* Thumbnail */}
      <div style={{
        width: 52, height: 52,
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, flexShrink: 0,
      }}>
        🛍️
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>
          ${item.price.toFixed(2)} c/u
        </p>
      </div>

      {/* Right: price + qty */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-dark)' }}>
          ${(item.price * item.qty).toFixed(2)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-strong)' }}>
          <button
            onClick={() => updateQty(item.product_id, item.qty - 1)}
            style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >−</button>
          <span style={{
            width: 24, height: 24, fontSize: 11, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderLeft: '1px solid var(--border-strong)', borderRight: '1px solid var(--border-strong)',
          }}>{item.qty}</span>
          <button
            onClick={() => updateQty(item.product_id, item.qty + 1)}
            style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >+</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite cart/page.tsx with light theme**

Replace entire file:

```tsx
'use client'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/cart'
import { CartItemRow } from '@/components/cart-item'

const DELIVERY_FEE = 3

export default function CartPage() {
  const router = useRouter()
  const { items, total } = useCartStore()

  if (items.length === 0) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100svh', gap: 16, padding: '0 24px', textAlign: 'center',
    }}>
      <span style={{ fontSize: 48 }}>🛒</span>
      <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Tu carrito está vacío</p>
      <button
        onClick={() => router.push('/catalog')}
        style={{
          background: 'var(--text)', color: 'var(--surface)',
          border: 'none', cursor: 'pointer',
          fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase',
          padding: '12px 24px', borderRadius: 'var(--radius)',
        }}
      >
        Ver catálogo
      </button>
    </div>
  )

  const subtotal = total()
  const grandTotal = subtotal + DELIVERY_FEE

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text)' }}>←</button>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--text)' }}>
          Tu pedido
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{items.length} productos</span>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border)' }}>
        {items.map((i) => <CartItemRow key={i.product_id} item={i} />)}
      </div>

      {/* Summary */}
      <div style={{ background: 'var(--surface)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)' }}>
          <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)' }}>
          <span>Envío</span><span>${DELIVERY_FEE.toFixed(2)}</span>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 14, fontWeight: 700,
          borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4,
        }}>
          <span style={{ color: 'var(--text)' }}>Total</span>
          <span style={{ color: 'var(--accent-dark)' }}>${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Footer CTA */}
      <div style={{ padding: '12px 16px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => router.push('/checkout')}
          style={{
            width: '100%', height: 46,
            background: 'var(--text)', color: 'var(--surface)',
            border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase',
            borderRadius: 'var(--radius)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          IR A PAGAR ·{' '}
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>${grandTotal.toFixed(2)}</span>
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | tail -10
```

Expected: Compiled successfully.

- [ ] **Step 4: Commit**

```bash
git add src/app/cart/page.tsx src/components/cart-item.tsx
git commit -m "feat: rebuild cart and cart item with sharp-light design"
```

---

## Task 5: Checkout page redesign

**Files:**
- Modify: `src/app/checkout/page.tsx`

- [ ] **Step 1: Rewrite checkout/page.tsx with light theme**

Replace entire file:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/cart'

declare global { interface Window { Telegram?: { WebApp?: { initData: string } } } }

const DELIVERY_FEE = 3

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: 13,
  borderRadius: 'var(--radius)',
  padding: '10px 12px',
  outline: 'none',
  border: '1px solid var(--border)',
  resize: 'none' as const,
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: '.14em',
  textTransform: 'uppercase' as const,
  color: 'var(--text-3)',
  fontWeight: 500,
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clear } = useCartStore()
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const grandTotal = total() + DELIVERY_FEE

  const handleSubmit = async () => {
    if (address.trim().length < 10) { setError('Dirección muy corta (mínimo 10 caracteres)'); return }
    setLoading(true); setError('')
    try {
      const initData = window.Telegram?.WebApp?.initData ?? ''
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, items, delivery_address: address.trim(), delivery_note: note.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al crear pedido'); setLoading(false); return }
      clear()
      router.push(`/pay/${data.order.id}?uri=${encodeURIComponent(data.paymentUri)}&memo=${encodeURIComponent(data.memo)}`)
    } catch {
      setError('Error de red. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)',
      }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text)' }}>←</button>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--text)' }}>
          Checkout
        </span>
      </div>

      <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Address form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={labelStyle}>Dirección de entrega *</span>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Calle, número, barrio, ciudad..."
            rows={3}
            style={inputStyle}
          />
          <span style={labelStyle}>Nota al repartidor (opcional)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Apto 201, timbre no funciona..."
            style={inputStyle}
          />
        </div>

        {/* Order summary */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={labelStyle}>Resumen</span>
          {items.map((i) => (
            <div key={i.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-2)' }}>{i.name} ×{i.qty}</span>
              <span style={{ color: 'var(--text)' }}>${(i.price * i.qty).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
            <span style={{ color: 'var(--text-2)' }}>Envío</span>
            <span style={{ color: 'var(--text)' }}>${DELIVERY_FEE.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
            <span style={{ color: 'var(--text)' }}>Total</span>
            <span style={{ color: 'var(--accent-dark)' }}>${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {error && <p style={{ color: '#e53935', fontSize: 12 }}>{error}</p>}
      </div>

      {/* Footer CTA */}
      <div style={{ padding: '12px 16px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', height: 46,
            background: 'var(--text)', color: 'var(--surface)',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1,
            fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase',
            borderRadius: 'var(--radius)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          {loading ? 'PROCESANDO...' : (
            <>CONFIRMAR PEDIDO · <span style={{ color: 'var(--accent)', fontWeight: 700 }}>${grandTotal.toFixed(2)}</span></>
          )}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -10
```

Expected: Compiled successfully.

- [ ] **Step 3: Commit**

```bash
git add src/app/checkout/page.tsx
git commit -m "feat: rebuild checkout page with sharp-light design"
```

---

## Task 6: Pay + Confirm pages redesign

**Files:**
- Modify: `src/app/pay/[orderId]/page.tsx`
- Modify: `src/app/confirm/[orderId]/page.tsx`

- [ ] **Step 1: Rewrite pay/[orderId]/page.tsx with light theme**

Replace entire file:

```tsx
'use client'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import QRCode from 'qrcode'
import { CountdownTimer } from '@/components/countdown-timer'

function PayPageInner() {
  const { orderId } = useParams<{ orderId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tonAddress, setTonAddress] = useState('')
  const [expired, setExpired] = useState(false)
  const [expiresAt] = useState(() => new Date(Date.now() + 15 * 60 * 1000))
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const paymentUri = decodeURIComponent(searchParams.get('uri') ?? '')
  const memo = searchParams.get('memo') ? decodeURIComponent(searchParams.get('memo')!) : ''

  useEffect(() => {
    const match = paymentUri.match(/ton:\/\/transfer\/([^?]+)/)
    if (match) setTonAddress(match[1])
    if (canvasRef.current && paymentUri) {
      QRCode.toCanvas(canvasRef.current, paymentUri, {
        width: 180, margin: 2,
        color: { dark: '#0d0d0d', light: '#ffffff' },
      })
    }
  }, [paymentUri])

  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`)
        const data = await res.json()
        if (data.status === 'paid') { clearInterval(pollingRef.current!); router.push(`/confirm/${orderId}`) }
      } catch { /* keep polling */ }
    }, 5000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [orderId, router])

  const handleCopy = () => navigator.clipboard.writeText(tonAddress)

  if (expired) return (
    <div style={{
      minHeight: '100svh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16, textAlign: 'center', padding: '0 24px',
    }}>
      <span style={{ fontSize: 40 }}>⏰</span>
      <p style={{ color: 'var(--text-2)', fontSize: 13 }}>El tiempo de pago expiró</p>
      <button
        onClick={() => router.push('/catalog')}
        style={{
          background: 'var(--text)', color: 'var(--surface)',
          border: 'none', cursor: 'pointer',
          fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase',
          padding: '12px 24px', borderRadius: 'var(--radius)',
        }}
      >Volver al catálogo</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--text)' }}>
          Pago USDT
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
          <CountdownTimer expiresAt={expiresAt} onExpire={() => setExpired(true)} />
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ alignSelf: 'flex-start' }}>
          <p style={{ fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>
            Total a pagar
          </p>
          <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent-dark)', lineHeight: 1 }}>
            USDT · TON
          </p>
          {memo && (
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
              Memo: <span style={{ fontFamily: 'monospace', color: 'var(--text-2)' }}>{memo}</span>
            </p>
          )}
        </div>

        {/* QR */}
        <div style={{
          border: '1px solid var(--border-strong)',
          background: 'var(--surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 8,
        }}>
          <canvas ref={canvasRef} />
        </div>

        {/* Wallet address */}
        {tonAddress && (
          <div style={{
            width: '100%', background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '10px 12px',
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <span style={{
              flex: 1, fontSize: 10, fontFamily: 'monospace',
              color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{tonAddress}</span>
            <button
              onClick={handleCopy}
              style={{
                fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 600,
                color: 'var(--text)', background: 'transparent',
                border: '1px solid var(--border-strong)', padding: '4px 8px', cursor: 'pointer',
                borderRadius: 'var(--radius)',
              }}
            >Copiar</button>
          </div>
        )}

        <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
          Detectamos el pago automáticamente. No cierres esta pantalla.
        </p>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => window.open(paymentUri, '_blank')}
          style={{
            width: '100%', height: 46,
            background: 'var(--text)', color: 'var(--surface)',
            border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase',
            borderRadius: 'var(--radius)',
          }}
        >
          ABRIR WALLET
        </button>
      </div>
    </div>
  )
}

export default function PayPage() {
  return <Suspense><PayPageInner /></Suspense>
}
```

- [ ] **Step 2: Rewrite confirm/[orderId]/page.tsx with light theme**

Replace entire file:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ConfirmPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/orders/${orderId}/status`).then((r) => r.json()).then((d) => setOrder(d.order))
  }, [orderId])

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--text)' }}>
          Confirmación
        </span>
      </div>

      <div style={{ flex: 1, padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
        {/* Check mark */}
        <div style={{
          width: 56, height: 56,
          border: '2px solid var(--text)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>✓</div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>¡Pago recibido!</h1>

        {order && (
          <>
            {/* Order items */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              padding: '14px 16px', width: '100%', textAlign: 'left',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <span style={{ fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                Pedido #{order.order_number}
              </span>
              {(order.items as any[]).map((item: any) => (
                <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-2)' }}>{item.name} ×{item.qty}</span>
                  <span style={{ color: 'var(--text)' }}>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                <span style={{ color: 'var(--text)' }}>Total</span>
                <span style={{ color: 'var(--accent-dark)' }}>${Number(order.total_usd).toFixed(2)} USDT</span>
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
              Tu pedido llegará en aproximadamente<br />
              <span style={{ color: 'var(--text)', fontWeight: 700 }}>30–45 minutos</span>
            </p>

            {order.ton_tx_hash && (
              <p style={{ fontSize: 9, color: 'var(--text-3)', fontFamily: 'monospace' }}>
                Tx: {order.ton_tx_hash.slice(0, 24)}...
              </p>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => router.push('/catalog')}
          style={{
            width: '100%', height: 46,
            background: 'transparent', color: 'var(--text)',
            border: '1px solid var(--border-strong)', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase',
            borderRadius: 'var(--radius)',
          }}
        >
          SEGUIR COMPRANDO
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | tail -10
```

Expected: Compiled successfully.

- [ ] **Step 4: Final verification — zero md- references in customer files**

```bash
grep -r "md-\|@material/web\|material-provider\|--md-sys" \
  src/app/page.tsx \
  src/app/catalog \
  src/app/cart \
  src/app/checkout \
  src/app/pay \
  src/app/confirm \
  src/components/age-gate.tsx \
  src/components/product-card.tsx \
  src/components/product-sheet.tsx \
  src/components/cart-item.tsx \
  2>/dev/null
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/app/pay src/app/confirm
git commit -m "feat: rebuild pay and confirm pages with sharp-light design"
```

- [ ] **Step 6: Final acceptance check commit**

```bash
git log --oneline -6
```

Expected output (6 commits):
```
feat: rebuild pay and confirm pages with sharp-light design
feat: rebuild checkout page with sharp-light design
feat: rebuild cart and cart item with sharp-light design
feat: rebuild catalog with sharp-light design, add product bottom sheet
feat: rewrite age gate with sharp-light design, switch to cookie storage
feat: replace M3 tokens with sharp-light design system, remove @material/web
```
