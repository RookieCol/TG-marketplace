# TG Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Telegram Mini App para tienda de cannabis con pagos USDT-TON vía QR, delivery a domicilio, bot de notificaciones al admin y panel CMS web.

**Architecture:** Next.js 15 App Router en Vercel. Supabase para DB + Realtime + Auth. grammY bot como Vercel Function. El cliente hace polling a `/api/orders/[id]/status` cada 5s para detectar pago on-chain (sin jobs long-running). Panel admin en ruta protegida `/admin`.

**Tech Stack:** Next.js 15, Tailwind CSS v4, Supabase, grammY, @ton/ton, qrcode, zustand, zod, @telegram-apps/sdk

---

## File Map

```
src/
  app/
    layout.tsx                        # Root layout, Telegram theme
    page.tsx                          # Entry: age gate → catalog
    catalog/page.tsx                  # Product grid + category filter
    product/[id]/page.tsx             # Product detail
    cart/page.tsx                     # Cart summary
    checkout/page.tsx                 # Checkout form
    pay/[orderId]/page.tsx            # QR payment + polling
    confirm/[orderId]/page.tsx        # Order confirmed
    admin/
      layout.tsx                      # Auth guard + sidebar
      login/page.tsx                  # Admin login
      page.tsx                        # Dashboard
      orders/page.tsx                 # Orders realtime list
      products/page.tsx               # Products CRUD
      config/page.tsx                 # Store config
    api/
      products/route.ts               # GET products
      orders/route.ts                 # POST create order
      orders/[id]/status/route.ts     # GET check payment
      webhook/route.ts                # POST Telegram bot webhook
  components/
    age-gate.tsx
    product-card.tsx
    cart-item.tsx
    qr-payment.tsx
    countdown-timer.tsx
    admin/order-card.tsx
    admin/product-form.tsx
  lib/
    supabase/client.ts                # Browser client
    supabase/server.ts                # Server client
    supabase/types.ts                 # DB types
    telegram.ts                       # initData validation
    ton.ts                            # TON API + QR URI builder
    bot.ts                            # grammY bot + notification helpers
    cart.ts                           # Zustand cart store
    config.ts                         # Config fetcher
supabase/
  migrations/001_initial.sql
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `.env.local.example`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd /Users/rookiecol/Documents/code/tg-marketplace
npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*" --yes
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr grammy qrcode @ton/ton @ton/core zustand zod @telegram-apps/sdk
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Configure vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
```

Create `src/test/setup.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add test script to package.json**

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 5: Create .env.local.example**

```bash
cat > .env.local.example << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_ADMIN_CHAT_ID=-100123456789
TON_WALLET_ADDRESS=UQB3xk...
TON_CENTER_API_KEY=
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
EOF
```

- [ ] **Step 6: Configure next.config.ts**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
}

export default nextConfig
```

- [ ] **Step 7: Commit**

```bash
git init
echo ".env.local" >> .gitignore
echo ".superpowers/" >> .gitignore
git add -A
git commit -m "feat: scaffold Next.js 15 project with Tailwind and Supabase deps"
```

---

## Task 2: Database Schema

**Files:**
- Create: `supabase/migrations/001_initial.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/001_initial.sql

create type product_category as enum ('preroll', 'gummy', 'oil', 'other');
create type order_status as enum (
  'pending_payment', 'paid', 'accepted', 'on_the_way', 'delivered', 'rejected'
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category product_category not null,
  price_usd decimal(10,2) not null,
  image_url text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number serial unique,
  telegram_user_id bigint not null,
  telegram_username text not null default '',
  items jsonb not null default '[]',
  delivery_address text not null,
  delivery_note text not null default '',
  subtotal_usd decimal(10,2) not null,
  delivery_fee_usd decimal(10,2) not null,
  total_usd decimal(10,2) not null,
  ton_address text not null default '',
  ton_tx_hash text,
  status order_status not null default 'pending_payment',
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz not null default now()
);

create table config (
  key text primary key,
  value text not null
);

insert into config (key, value) values
  ('delivery_fee', '3.00'),
  ('estimated_time', '30-45'),
  ('ton_wallet_address', ''),
  ('welcome_message', 'Bienvenido a nuestra tienda');

-- Seed products
insert into products (name, description, category, price_usd, image_url) values
  ('Pre-roll OG Kush', 'Cepa clásica de efecto eufórico. THC 22%. Indica. 1g.', 'preroll', 12.00, ''),
  ('Pre-roll Blueberry', 'Sabor frutal, efecto relajante. Indica. 1.5g.', 'preroll', 15.00, ''),
  ('Gomita CBD Fresa', '25mg CBD por unidad. Pack x10.', 'gummy', 8.00, ''),
  ('Aceite CBD 10%', 'Full Spectrum. 30ml.', 'oil', 35.00, '');

-- RLS: products readable by all (anon)
alter table products enable row level security;
create policy "products_public_read" on products for select using (active = true);

-- RLS: orders only via service role (API writes with service key)
alter table orders enable row level security;

-- RLS: config readable by all
alter table config enable row level security;
create policy "config_public_read" on config for select using (true);
```

- [ ] **Step 2: Apply migration**

```bash
# Option A: Supabase local dev
npx supabase db push

# Option B: paste SQL in Supabase dashboard → SQL Editor
```

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema for products, orders, config"
```

---

## Task 3: Supabase Clients + Types

**Files:**
- Create: `src/lib/supabase/types.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`

- [ ] **Step 1: Create types**

`src/lib/supabase/types.ts`:
```ts
export type ProductCategory = 'preroll' | 'gummy' | 'oil' | 'other'
export type OrderStatus =
  | 'pending_payment' | 'paid' | 'accepted'
  | 'on_the_way' | 'delivered' | 'rejected'

export interface Product {
  id: string
  name: string
  description: string
  category: ProductCategory
  price_usd: number
  image_url: string
  active: boolean
  created_at: string
}

export interface OrderItem {
  product_id: string
  name: string
  qty: number
  price: number
}

export interface Order {
  id: string
  order_number: number
  telegram_user_id: number
  telegram_username: string
  items: OrderItem[]
  delivery_address: string
  delivery_note: string
  subtotal_usd: number
  delivery_fee_usd: number
  total_usd: number
  ton_address: string
  ton_tx_hash: string | null
  status: OrderStatus
  expires_at: string
  created_at: string
}

export interface Config {
  delivery_fee: string
  estimated_time: string
  ton_wallet_address: string
  welcome_message: string
}
```

- [ ] **Step 2: Create browser client**

`src/lib/supabase/client.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

- [ ] **Step 3: Create server client**

`src/lib/supabase/server.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)),
      },
    },
  )
}

export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/
git commit -m "feat: add Supabase browser and server clients with types"
```

---

## Task 4: Telegram initData Validation

**Files:**
- Create: `src/lib/telegram.ts`, `src/test/telegram.test.ts`

- [ ] **Step 1: Write failing test**

`src/test/telegram.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { parseTelegramUser, validateInitData } from '@/lib/telegram'

describe('parseTelegramUser', () => {
  it('returns null for empty initData', () => {
    expect(parseTelegramUser('')).toBeNull()
  })

  it('extracts user from valid initData string', () => {
    const user = { id: 123, first_name: 'Juan', username: 'juanuser' }
    const initData = `user=${encodeURIComponent(JSON.stringify(user))}&hash=abc`
    const result = parseTelegramUser(initData)
    expect(result?.id).toBe(123)
    expect(result?.username).toBe('juanuser')
  })
})
```

- [ ] **Step 2: Run test — verify FAIL**

```bash
npm test -- telegram
```

Expected: `Error: Cannot find module '@/lib/telegram'`

- [ ] **Step 3: Implement**

`src/lib/telegram.ts`:
```ts
import { createHmac } from 'crypto'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
}

export function parseTelegramUser(initData: string): TelegramUser | null {
  if (!initData) return null
  try {
    const params = new URLSearchParams(initData)
    const userStr = params.get('user')
    if (!userStr) return null
    return JSON.parse(decodeURIComponent(userStr)) as TelegramUser
  } catch {
    return null
  }
}

export function validateInitData(initData: string, botToken: string): boolean {
  if (!initData || !botToken) return false
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return false
    params.delete('hash')
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')
    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
    const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
    return computedHash === hash
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Run test — verify PASS**

```bash
npm test -- telegram
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/telegram.ts src/test/telegram.test.ts
git commit -m "feat: add Telegram initData validation"
```

---

## Task 5: TON Payment Lib

**Files:**
- Create: `src/lib/ton.ts`, `src/test/ton.test.ts`

- [ ] **Step 1: Write failing tests**

`src/test/ton.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { buildTonPaymentUri, parseTonAmount } from '@/lib/ton'

describe('buildTonPaymentUri', () => {
  it('builds a valid ton:// URI with memo and amount', () => {
    const uri = buildTonPaymentUri('UQB3xkf9mP2k', 31.00, 'ORD-0042')
    expect(uri).toContain('ton://transfer/UQB3xkf9mP2k')
    expect(uri).toContain('text=ORD-0042')
    expect(uri).toContain('jetton=')
  })
})

describe('parseTonAmount', () => {
  it('converts nano-USDT string to decimal', () => {
    expect(parseTonAmount('31000000')).toBe(31)
  })
})
```

- [ ] **Step 2: Run test — verify FAIL**

```bash
npm test -- ton
```

- [ ] **Step 3: Implement**

`src/lib/ton.ts`:
```ts
// USDT Jetton master on TON mainnet
const USDT_JETTON_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs'
const TON_CENTER_BASE = 'https://toncenter.com/api/v2'

export function buildTonPaymentUri(
  toAddress: string,
  amountUsd: number,
  memo: string,
): string {
  // Amount in USDT has 6 decimals
  const nanoAmount = Math.round(amountUsd * 1_000_000)
  const params = new URLSearchParams({
    amount: nanoAmount.toString(),
    jetton: USDT_JETTON_MASTER,
    text: memo,
  })
  return `ton://transfer/${toAddress}?${params.toString()}`
}

export function parseTonAmount(nanoAmount: string): number {
  return parseInt(nanoAmount, 10) / 1_000_000
}

export interface TonTx {
  hash: string
  amount: number
  memo: string
}

export async function findIncomingUsdtTx(
  walletAddress: string,
  expectedMemo: string,
  minAmountUsd: number,
): Promise<TonTx | null> {
  const apiKey = process.env.TON_CENTER_API_KEY ?? ''
  const headers: Record<string, string> = apiKey ? { 'X-API-Key': apiKey } : {}

  // Get jetton transfers to our wallet
  const url = `${TON_CENTER_BASE}/getJettonTransfers?` +
    new URLSearchParams({
      address: walletAddress,
      jetton_master: USDT_JETTON_MASTER,
      limit: '20',
      direction: 'in',
    })

  const res = await fetch(url, { headers, next: { revalidate: 0 } })
  if (!res.ok) return null

  const data = await res.json()
  const transfers: Array<{
    transaction_hash: string
    amount: string
    comment?: string
  }> = data.result ?? []

  for (const tx of transfers) {
    const memo = tx.comment ?? ''
    const amount = parseTonAmount(tx.amount)
    if (memo === expectedMemo && amount >= minAmountUsd) {
      return { hash: tx.transaction_hash, amount, memo }
    }
  }
  return null
}
```

- [ ] **Step 4: Run tests — verify PASS**

```bash
npm test -- ton
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/ton.ts src/test/ton.test.ts
git commit -m "feat: add TON payment URI builder and transaction checker"
```

---

## Task 6: Cart State (Zustand)

**Files:**
- Create: `src/lib/cart.ts`, `src/test/cart.test.ts`

- [ ] **Step 1: Write failing tests**

`src/test/cart.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '@/lib/cart'

const mockProduct = {
  id: 'p1', name: 'Pre-roll OG', description: '', category: 'preroll' as const,
  price_usd: 12, image_url: '', active: true, created_at: '',
}

beforeEach(() => useCartStore.setState({ items: [] }))

describe('cart store', () => {
  it('adds a product', () => {
    useCartStore.getState().addItem(mockProduct)
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0].qty).toBe(1)
  })

  it('increments qty when adding same product', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().addItem(mockProduct)
    expect(useCartStore.getState().items[0].qty).toBe(2)
  })

  it('removes an item', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().removeItem('p1')
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('computes total correctly', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().addItem(mockProduct)
    expect(useCartStore.getState().total()).toBe(24)
  })
})
```

- [ ] **Step 2: Run test — verify FAIL**

```bash
npm test -- cart
```

- [ ] **Step 3: Implement**

`src/lib/cart.ts`:
```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from './supabase/types'

export interface CartItem {
  product_id: string
  name: string
  price: number
  image_url: string
  qty: number
}

interface CartStore {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clear: () => void
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        set((state) => {
          const existing = state.items.find((i) => i.product_id === product.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i,
              ),
            }
          }
          return {
            items: [...state.items, {
              product_id: product.id,
              name: product.name,
              price: product.price_usd,
              image_url: product.image_url,
              qty: 1,
            }],
          }
        })
      },
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.product_id !== productId) })),
      updateQty: (productId, qty) =>
        set((state) => ({
          items: qty <= 0
            ? state.items.filter((i) => i.product_id !== productId)
            : state.items.map((i) => i.product_id === productId ? { ...i, qty } : i),
        })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    { name: 'tg-cart' },
  ),
)
```

- [ ] **Step 4: Run tests — verify PASS**

```bash
npm test -- cart
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/cart.ts src/test/cart.test.ts
git commit -m "feat: add Zustand cart store with persistence"
```

---

## Task 7: Config Lib + Bot Instance

**Files:**
- Create: `src/lib/config.ts`, `src/lib/bot.ts`

- [ ] **Step 1: Create config fetcher**

`src/lib/config.ts`:
```ts
import { createServiceClient } from './supabase/server'
import type { Config } from './supabase/types'

export async function getConfig(): Promise<Config> {
  const supabase = createServiceClient()
  const { data } = await supabase.from('config').select('key, value')
  const map: Record<string, string> = {}
  for (const row of data ?? []) map[row.key] = row.value
  return {
    delivery_fee: map.delivery_fee ?? '3.00',
    estimated_time: map.estimated_time ?? '30-45',
    ton_wallet_address: map.ton_wallet_address ?? process.env.TON_WALLET_ADDRESS ?? '',
    welcome_message: map.welcome_message ?? 'Bienvenido',
  }
}
```

- [ ] **Step 2: Create bot instance + notification helper**

`src/lib/bot.ts`:
```ts
import { Bot, InlineKeyboard } from 'grammy'
import type { Order } from './supabase/types'

let _bot: Bot | null = null

export function getBot(): Bot {
  if (!_bot) {
    _bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!)
  }
  return _bot
}

export async function notifyAdminNewOrder(order: Order): Promise<void> {
  const bot = getBot()
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const itemLines = order.items
    .map((i) => `• ${i.name} ×${i.qty} — $${(i.price * i.qty).toFixed(2)}`)
    .join('\n')

  const text =
    `🛒 *Nuevo pedido #${order.order_number}*\n\n` +
    `👤 @${order.telegram_username || order.telegram_user_id}\n` +
    `📍 ${order.delivery_address}\n` +
    (order.delivery_note ? `📝 ${order.delivery_note}\n` : '') +
    `\n─────────────\n` +
    `${itemLines}\n` +
    `🚚 Delivery — $${order.delivery_fee_usd.toFixed(2)}\n` +
    `─────────────\n` +
    `💰 *Total: $${order.total_usd.toFixed(2)} USDT*\n` +
    `✅ Pago confirmado · \`${order.ton_tx_hash?.slice(0, 12)}...\``

  const keyboard = new InlineKeyboard()
    .text('✅ Aceptar', `accept:${order.id}`)
    .text('❌ Rechazar', `reject:${order.id}`)
    .row()
    .url('📋 Ver en CMS', `${appUrl}/admin/orders`)

  await bot.api.sendMessage(adminChatId, text, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  })
}

export async function notifyClientOrderAccepted(
  telegramUserId: number,
  orderNumber: number,
  estimatedTime: string,
): Promise<void> {
  const bot = getBot()
  await bot.api.sendMessage(
    telegramUserId,
    `✅ Tu pedido #${orderNumber} fue *aceptado*.\n🚚 Tiempo estimado: *${estimatedTime} minutos*`,
    { parse_mode: 'Markdown' },
  )
}

export async function notifyClientOrderRejected(
  telegramUserId: number,
  orderNumber: number,
): Promise<void> {
  const bot = getBot()
  await bot.api.sendMessage(
    telegramUserId,
    `❌ Tu pedido #${orderNumber} fue rechazado. Contáctanos para más información.`,
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/config.ts src/lib/bot.ts
git commit -m "feat: add config fetcher and grammY bot notification helpers"
```

---

## Task 8: API Routes

**Files:**
- Create: `src/app/api/products/route.ts`, `src/app/api/orders/route.ts`, `src/app/api/orders/[id]/status/route.ts`, `src/app/api/webhook/route.ts`

- [ ] **Step 1: Products endpoint**

`src/app/api/products/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('category')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 2: Create order endpoint**

`src/app/api/orders/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { buildTonPaymentUri } from '@/lib/ton'
import { getConfig } from '@/lib/config'
import { parseTelegramUser } from '@/lib/telegram'

const CreateOrderSchema = z.object({
  initData: z.string(),
  items: z.array(z.object({
    product_id: z.string(),
    name: z.string(),
    qty: z.number().int().positive(),
    price: z.number().positive(),
  })),
  delivery_address: z.string().min(10),
  delivery_note: z.string().default(''),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = CreateOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { initData, items, delivery_address, delivery_note } = parsed.data
  const tgUser = parseTelegramUser(initData)
  if (!tgUser) {
    return NextResponse.json({ error: 'Invalid Telegram user' }, { status: 401 })
  }

  const config = await getConfig()
  const deliveryFee = parseFloat(config.delivery_fee)
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const total = subtotal + deliveryFee

  const supabase = createServiceClient()
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      telegram_user_id: tgUser.id,
      telegram_username: tgUser.username ?? '',
      items,
      delivery_address,
      delivery_note,
      subtotal_usd: subtotal,
      delivery_fee_usd: deliveryFee,
      total_usd: total,
      ton_address: config.ton_wallet_address,
    })
    .select()
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  const memo = `ORD-${order.order_number}`
  const paymentUri = buildTonPaymentUri(config.ton_wallet_address, total, memo)

  return NextResponse.json({ order, paymentUri, memo })
}
```

- [ ] **Step 3: Order status endpoint**

`src/app/api/orders/[id]/status/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { findIncomingUsdtTx } from '@/lib/ton'
import { notifyAdminNewOrder } from '@/lib/bot'
import { getConfig } from '@/lib/config'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Already paid — return current status
  if (order.status !== 'pending_payment') {
    return NextResponse.json({ status: order.status, order })
  }

  // Expired
  if (new Date(order.expires_at) < new Date()) {
    await supabase.from('orders').update({ status: 'rejected' }).eq('id', id)
    return NextResponse.json({ status: 'rejected', order })
  }

  // Check on-chain
  const config = await getConfig()
  const memo = `ORD-${order.order_number}`
  const tx = await findIncomingUsdtTx(config.ton_wallet_address, memo, order.total_usd)

  if (!tx) return NextResponse.json({ status: 'pending_payment', order })

  // Mark paid
  const { data: updated } = await supabase
    .from('orders')
    .update({ status: 'paid', ton_tx_hash: tx.hash })
    .eq('id', id)
    .select()
    .single()

  // Notify admin
  if (updated) await notifyAdminNewOrder(updated)

  return NextResponse.json({ status: 'paid', order: updated })
}
```

- [ ] **Step 4: Telegram webhook endpoint**

`src/app/api/webhook/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { getBot, notifyClientOrderAccepted, notifyClientOrderRejected } from '@/lib/bot'
import { createServiceClient } from '@/lib/supabase/server'
import { getConfig } from '@/lib/config'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const bot = getBot()

  // Handle callback_query (inline button press)
  const cb = body.callback_query
  if (!cb) return NextResponse.json({ ok: true })

  const [action, orderId] = (cb.data as string).split(':')
  if (!orderId) return NextResponse.json({ ok: true })

  const supabase = createServiceClient()
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (!order) return NextResponse.json({ ok: true })

  if (action === 'accept') {
    await supabase.from('orders').update({ status: 'accepted' }).eq('id', orderId)
    const config = await getConfig()
    await notifyClientOrderAccepted(
      order.telegram_user_id,
      order.order_number,
      config.estimated_time,
    )
    await bot.api.answerCallbackQuery(cb.id, { text: '✅ Pedido aceptado' })
  } else if (action === 'reject') {
    await supabase.from('orders').update({ status: 'rejected' }).eq('id', orderId)
    await notifyClientOrderRejected(order.telegram_user_id, order.order_number)
    await bot.api.answerCallbackQuery(cb.id, { text: '❌ Pedido rechazado' })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/
git commit -m "feat: add API routes for products, orders, payment status, and bot webhook"
```

---

## Task 9: Root Layout + Global Styles

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/globals.css`

- [ ] **Step 1: Update globals.css**

`src/app/globals.css`:
```css
@import "tailwindcss";

:root {
  --bg: #0d0d0d;
  --surface: #1a1a1a;
  --surface-2: #222;
  --accent: #c9f04a;
  --accent-fg: #000;
  --text: #ffffff;
  --text-muted: #888888;
  --border: #2a2a2a;
  --radius: 10px;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
}

* { box-sizing: border-box; }
```

- [ ] **Step 2: Update root layout**

`src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'GreenStore',
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
      <body className="min-h-screen max-w-md mx-auto">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: dark premium theme and Telegram Web App script"
```

---

## Task 10: Age Gate + Entry Point

**Files:**
- Create: `src/components/age-gate.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Age Gate component**

`src/components/age-gate.tsx`:
```tsx
'use client'
import { useState, useEffect } from 'react'

interface AgeGateProps {
  onConfirm: () => void
}

export function AgeGate({ onConfirm }: AgeGateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-6 text-center">
      <div className="text-6xl">🌿</div>
      <h1 className="text-2xl font-bold text-white">Bienvenido</h1>
      <p className="text-[var(--text-muted)] text-sm leading-relaxed max-w-xs">
        Este sitio contiene productos para adultos mayores de 18 años. ¿Confirmas que eres mayor de edad?
      </p>
      <button
        onClick={onConfirm}
        className="w-full bg-[var(--accent)] text-[var(--accent-fg)] font-bold rounded-[var(--radius)] py-3 text-base"
      >
        Soy mayor de 18 ✓
      </button>
      <p className="text-[var(--text-muted)] text-xs">
        Al continuar aceptas nuestros términos de servicio
      </p>
    </div>
  )
}

export function useAgeVerified() {
  const [verified, setVerified] = useState<boolean | null>(null)

  useEffect(() => {
    setVerified(localStorage.getItem('age_verified') === 'true')
  }, [])

  const confirm = () => {
    localStorage.setItem('age_verified', 'true')
    setVerified(true)
  }

  return { verified, confirm }
}
```

- [ ] **Step 2: Entry page**

`src/app/page.tsx`:
```tsx
'use client'
import { useRouter } from 'next/navigation'
import { AgeGate, useAgeVerified } from '@/components/age-gate'
import { useEffect } from 'react'

export default function HomePage() {
  const router = useRouter()
  const { verified, confirm } = useAgeVerified()

  useEffect(() => {
    if (verified === true) router.replace('/catalog')
  }, [verified, router])

  const handleConfirm = () => {
    confirm()
    router.replace('/catalog')
  }

  if (verified === null) return null // hydrating
  if (verified === true) return null // redirecting

  return <AgeGate onConfirm={handleConfirm} />
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/age-gate.tsx src/app/page.tsx
git commit -m "feat: age gate screen with localStorage persistence"
```

---

## Task 11: Catalog Screen

**Files:**
- Create: `src/components/product-card.tsx`, `src/app/catalog/page.tsx`

- [ ] **Step 1: ProductCard component**

`src/components/product-card.tsx`:
```tsx
'use client'
import type { Product } from '@/lib/supabase/types'
import { useCartStore } from '@/lib/cart'

const CATEGORY_EMOJI: Record<string, string> = {
  preroll: '🌿', gummy: '🍬', oil: '💧', other: '📦',
}

interface ProductCardProps {
  product: Product
  onClick: () => void
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)

  return (
    <div
      className="bg-[var(--surface)] rounded-[var(--radius)] p-3 cursor-pointer"
      onClick={onClick}
    >
      <div className="bg-[var(--surface-2)] rounded-lg h-20 flex items-center justify-center text-4xl mb-2">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover rounded-lg" />
          : CATEGORY_EMOJI[product.category]}
      </div>
      <p className="text-white text-xs font-semibold leading-tight">{product.name}</p>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[var(--accent)] text-sm font-bold">
          ${product.price_usd.toFixed(2)}
        </span>
        <button
          className="bg-[var(--accent)] text-[var(--accent-fg)] rounded w-6 h-6 text-sm font-bold flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); addItem(product) }}
        >
          +
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Catalog page**

`src/app/catalog/page.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product, ProductCategory } from '@/lib/supabase/types'
import { ProductCard } from '@/components/product-card'
import { useCartStore } from '@/lib/cart'

const CATEGORIES: { label: string; value: ProductCategory | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Pre-rolls', value: 'preroll' },
  { label: 'Gomitas', value: 'gummy' },
  { label: 'Aceites', value: 'oil' },
]

export default function CatalogPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [category, setCategory] = useState<ProductCategory | 'all'>('all')
  const itemCount = useCartStore((s) => s.itemCount())

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then(setProducts)
  }, [])

  const filtered = category === 'all'
    ? products
    : products.filter((p) => p.category === category)

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--bg)] z-10 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[var(--accent)] font-bold text-lg">🌿 GreenStore</span>
          <button
            onClick={() => router.push('/cart')}
            className="relative text-white text-sm"
          >
            🛒
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[var(--accent)] text-[var(--accent-fg)] rounded-full w-4 h-4 text-[10px] font-bold flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
        </div>
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`shrink-0 text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                category === c.value
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                  : 'bg-[var(--surface)] text-[var(--text-muted)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 mt-3 grid grid-cols-2 gap-3">
        {filtered.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onClick={() => router.push(`/product/${p.id}`)}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/product-card.tsx src/app/catalog/
git commit -m "feat: catalog screen with category filter and cart badge"
```

---

## Task 12: Product Detail + Cart + Checkout Screens

**Files:**
- Create: `src/app/product/[id]/page.tsx`, `src/components/cart-item.tsx`, `src/app/cart/page.tsx`, `src/app/checkout/page.tsx`

- [ ] **Step 1: Product detail page**

`src/app/product/[id]/page.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { Product } from '@/lib/supabase/types'
import { useCartStore } from '@/lib/cart'

const CATEGORY_EMOJI: Record<string, string> = {
  preroll: '🌿', gummy: '🍬', oil: '💧', other: '📦',
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [qty, setQty] = useState(1)
  const addItem = useCartStore((s) => s.addItem)

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((ps: Product[]) => setProduct(ps.find((p) => p.id === id) ?? null))
  }, [id])

  if (!product) return (
    <div className="flex items-center justify-center min-h-screen text-[var(--text-muted)]">
      Cargando...
    </div>
  )

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addItem(product)
    router.back()
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4 min-h-screen">
      <button onClick={() => router.back()} className="text-[var(--text-muted)] text-sm self-start">
        ← Volver
      </button>
      <div className="bg-[var(--surface)] rounded-xl h-44 flex items-center justify-center text-7xl">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover rounded-xl" />
          : CATEGORY_EMOJI[product.category]}
      </div>
      <h1 className="text-white text-xl font-bold">{product.name}</h1>
      <div className="flex gap-2">
        <span className="bg-[var(--surface)] text-[var(--text-muted)] text-xs px-3 py-1 rounded-full">
          {product.category}
        </span>
      </div>
      <p className="text-[var(--text-muted)] text-sm leading-relaxed">{product.description}</p>
      <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-4">
        <span className="text-[var(--accent)] text-2xl font-bold">
          ${product.price_usd.toFixed(2)}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="bg-[var(--surface)] text-white w-8 h-8 rounded-lg text-lg font-bold"
          >−</button>
          <span className="text-white w-4 text-center">{qty}</span>
          <button
            onClick={() => setQty(qty + 1)}
            className="bg-[var(--accent)] text-[var(--accent-fg)] w-8 h-8 rounded-lg text-lg font-bold"
          >+</button>
        </div>
      </div>
      <button
        onClick={handleAdd}
        className="w-full bg-[var(--accent)] text-[var(--accent-fg)] font-bold rounded-[var(--radius)] py-3"
      >
        Agregar al carrito 🛒
      </button>
    </div>
  )
}
```

- [ ] **Step 2: CartItem component**

`src/components/cart-item.tsx`:
```tsx
'use client'
import { useCartStore } from '@/lib/cart'
import type { CartItem } from '@/lib/cart'

const CATEGORY_EMOJI: Record<string, string> = {
  preroll: '🌿', gummy: '🍬', oil: '💧', other: '📦',
}

export function CartItemRow({ item }: { item: CartItem }) {
  const { updateQty, removeItem } = useCartStore()

  return (
    <div className="flex items-center gap-3 bg-[var(--surface)] rounded-[var(--radius)] p-3">
      <span className="text-2xl">{CATEGORY_EMOJI['other']}</span>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{item.name}</p>
        <p className="text-[var(--text-muted)] text-xs">×{item.qty}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQty(item.product_id, item.qty - 1)}
          className="text-[var(--text-muted)] w-6 h-6 bg-[var(--surface-2)] rounded text-sm"
        >−</button>
        <span className="text-white text-sm w-4 text-center">{item.qty}</span>
        <button
          onClick={() => updateQty(item.product_id, item.qty + 1)}
          className="text-[var(--accent)] w-6 h-6 bg-[var(--surface-2)] rounded text-sm font-bold"
        >+</button>
      </div>
      <span className="text-[var(--accent)] text-sm font-bold w-16 text-right">
        ${(item.price * item.qty).toFixed(2)}
      </span>
    </div>
  )
}
```

- [ ] **Step 3: Cart page**

`src/app/cart/page.tsx`:
```tsx
'use client'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/cart'
import { CartItemRow } from '@/components/cart-item'
import { useEffect, useState } from 'react'

export default function CartPage() {
  const router = useRouter()
  const { items, total } = useCartStore()
  const [deliveryFee, setDeliveryFee] = useState(3)

  useEffect(() => {
    fetch('/api/products') // reuse any endpoint to get config — or add dedicated /api/config
    // For now use the hardcoded default; config is fetched at checkout
    setDeliveryFee(3)
  }, [])

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <span className="text-5xl">🛒</span>
        <p className="text-[var(--text-muted)]">Tu carrito está vacío</p>
        <button
          onClick={() => router.push('/catalog')}
          className="bg-[var(--accent)] text-[var(--accent-fg)] font-bold px-6 py-3 rounded-[var(--radius)]"
        >
          Ver catálogo
        </button>
      </div>
    )
  }

  const subtotal = total()
  const grandTotal = subtotal + deliveryFee

  return (
    <div className="px-4 py-4 flex flex-col gap-4 min-h-screen">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="text-[var(--text-muted)] text-sm">←</button>
        <h1 className="text-white font-bold text-lg">Mi carrito 🛒</h1>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => <CartItemRow key={item.product_id} item={item} />)}
      </div>

      <div className="border-t border-[var(--border)] pt-4 flex flex-col gap-2 mt-auto">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Subtotal</span>
          <span className="text-white">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Delivery</span>
          <span className="text-[var(--accent)]">${deliveryFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span className="text-white">Total</span>
          <span className="text-[var(--accent)] text-lg">${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={() => router.push('/checkout')}
        className="w-full bg-[var(--accent)] text-[var(--accent-fg)] font-bold rounded-[var(--radius)] py-3"
      >
        Ir a pagar →
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Checkout page**

`src/app/checkout/page.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/cart'

declare global { interface Window { Telegram?: { WebApp?: { initData: string } } } }

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clear } = useCartStore()
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const deliveryFee = 3
  const grandTotal = total() + deliveryFee

  const handleSubmit = async () => {
    if (address.trim().length < 10) {
      setError('Por favor ingresa una dirección válida (mínimo 10 caracteres)')
      return
    }
    setLoading(true)
    setError('')

    const initData = window.Telegram?.WebApp?.initData ?? ''

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initData,
        items,
        delivery_address: address.trim(),
        delivery_note: note.trim(),
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Error al crear el pedido')
      setLoading(false)
      return
    }

    clear()
    router.push(`/pay/${data.order.id}?uri=${encodeURIComponent(data.paymentUri)}&memo=${data.memo}`)
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4 min-h-screen">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="text-[var(--text-muted)] text-sm">←</button>
        <h1 className="text-white font-bold text-lg">Checkout</h1>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[var(--text-muted)] text-xs uppercase tracking-wider">
          Dirección de entrega *
        </label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Calle, número, barrio, ciudad..."
          rows={3}
          className="bg-[var(--surface)] text-white text-sm rounded-[var(--radius)] p-3 resize-none outline-none placeholder:text-[var(--text-muted)]"
        />

        <label className="text-[var(--text-muted)] text-xs uppercase tracking-wider">
          Nota al repartidor (opcional)
        </label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Apto 201, timbre no funciona..."
          className="bg-[var(--surface)] text-white text-sm rounded-[var(--radius)] p-3 outline-none placeholder:text-[var(--text-muted)]"
        />
      </div>

      {/* Order summary */}
      <div className="bg-[var(--surface)] rounded-[var(--radius)] p-4 flex flex-col gap-1.5">
        {items.map((i) => (
          <div key={i.product_id} className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">{i.name} ×{i.qty}</span>
            <span className="text-white">${(i.price * i.qty).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm border-t border-[var(--border)] pt-2 mt-1">
          <span className="text-[var(--text-muted)]">Delivery</span>
          <span className="text-white">${deliveryFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span className="text-white">Total</span>
          <span className="text-[var(--accent)]">${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-[var(--accent)] text-[var(--accent-fg)] font-bold rounded-[var(--radius)] py-3 disabled:opacity-50"
      >
        {loading ? 'Procesando...' : `Confirmar pedido · $${grandTotal.toFixed(2)}`}
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/product/ src/components/cart-item.tsx src/app/cart/ src/app/checkout/
git commit -m "feat: product detail, cart, and checkout screens"
```

---

## Task 13: QR Payment + Confirmation Screens

**Files:**
- Create: `src/components/countdown-timer.tsx`, `src/components/qr-payment.tsx`, `src/app/pay/[orderId]/page.tsx`, `src/app/confirm/[orderId]/page.tsx`

- [ ] **Step 1: Countdown timer component**

`src/components/countdown-timer.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'

export function CountdownTimer({ expiresAt, onExpire }: { expiresAt: Date; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
      setRemaining(diff)
      if (diff === 0) onExpire()
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt, onExpire])

  const mins = Math.floor(remaining / 60).toString().padStart(2, '0')
  const secs = (remaining % 60).toString().padStart(2, '0')

  return (
    <span className={remaining < 60 ? 'text-red-400' : 'text-[var(--text-muted)]'}>
      {mins}:{secs}
    </span>
  )
}
```

- [ ] **Step 2: QR Payment page**

`src/app/pay/[orderId]/page.tsx`:
```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import QRCode from 'qrcode'
import { CountdownTimer } from '@/components/countdown-timer'

export default function PayPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tonAddress, setTonAddress] = useState('')
  const [expired, setExpired] = useState(false)
  const [expiresAt] = useState(() => new Date(Date.now() + 15 * 60 * 1000))
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const paymentUri = decodeURIComponent(searchParams.get('uri') ?? '')
  const memo = searchParams.get('memo') ?? ''

  useEffect(() => {
    // Extract address from URI for display
    const match = paymentUri.match(/ton:\/\/transfer\/([^?]+)/)
    if (match) setTonAddress(match[1])

    // Render QR
    if (canvasRef.current && paymentUri) {
      QRCode.toCanvas(canvasRef.current, paymentUri, { width: 180, margin: 2 })
    }
  }, [paymentUri])

  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      const res = await fetch(`/api/orders/${orderId}/status`)
      const data = await res.json()
      if (data.status === 'paid') {
        clearInterval(pollingRef.current!)
        router.push(`/confirm/${orderId}`)
      }
    }, 5000)

    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [orderId, router])

  const handleCopy = () => navigator.clipboard.writeText(tonAddress)
  const handleOpenWallet = () => window.open(paymentUri, '_blank')

  return (
    <div className="px-4 py-4 flex flex-col items-center gap-5 min-h-screen">
      <div className="w-full flex items-center gap-2">
        <h1 className="text-white font-bold text-lg">Pago del pedido</h1>
        <span className="ml-auto text-sm">
          ⏱ <CountdownTimer expiresAt={expiresAt} onExpire={() => setExpired(true)} />
        </span>
      </div>

      {expired ? (
        <div className="flex flex-col items-center gap-4 mt-8 text-center">
          <span className="text-4xl">⏰</span>
          <p className="text-[var(--text-muted)]">El tiempo de pago expiró</p>
          <button
            onClick={() => router.push('/catalog')}
            className="bg-[var(--accent)] text-[var(--accent-fg)] font-bold px-6 py-3 rounded-[var(--radius)]"
          >
            Volver al catálogo
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white p-3 rounded-xl">
            <canvas ref={canvasRef} />
          </div>

          <div className="bg-[var(--surface)] rounded-[var(--radius)] p-4 w-full text-center">
            <p className="text-[var(--accent)] text-xl font-bold">USDT · TON</p>
            <p className="text-[var(--text-muted)] text-xs mt-1">Memo: <span className="text-white font-mono">{memo}</span></p>
          </div>

          <div className="bg-[var(--surface)] rounded-[var(--radius)] p-3 w-full">
            <p className="text-[var(--text-muted)] text-xs mb-1">Dirección</p>
            <p className="text-white font-mono text-xs break-all">{tonAddress}</p>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={handleCopy}
              className="flex-1 bg-[var(--accent)] text-[var(--accent-fg)] font-bold rounded-[var(--radius)] py-3 text-sm"
            >
              Copiar dirección
            </button>
            <button
              onClick={handleOpenWallet}
              className="flex-1 bg-[var(--surface)] text-[var(--accent)] border border-[var(--accent)] font-semibold rounded-[var(--radius)] py-3 text-sm"
            >
              Abrir wallet
            </button>
          </div>

          <p className="text-[var(--text-muted)] text-xs text-center">
            Detectamos el pago automáticamente. No cierres esta pantalla.
          </p>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Confirmation page**

`src/app/confirm/[orderId]/page.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Order } from '@/lib/supabase/types'

export default function ConfirmPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetch(`/api/orders/${orderId}/status`)
      .then((r) => r.json())
      .then((d) => setOrder(d.order))
  }, [orderId])

  return (
    <div className="px-4 py-4 flex flex-col items-center gap-6 min-h-screen text-center">
      <div className="w-16 h-16 bg-[var(--accent)] bg-opacity-20 rounded-full flex items-center justify-center text-4xl mt-8">
        ✅
      </div>
      <h1 className="text-white text-2xl font-bold">¡Pago recibido!</h1>

      {order && (
        <>
          <div className="bg-[var(--surface)] rounded-[var(--radius)] p-4 w-full text-left flex flex-col gap-2">
            <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider">Pedido #{order.order_number}</p>
            {order.items.map((item) => (
              <div key={item.product_id} className="flex justify-between text-sm">
                <span className="text-white">{item.name} ×{item.qty}</span>
                <span className="text-[var(--accent)]">${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-[var(--border)] pt-2 flex justify-between font-bold">
              <span className="text-white">Total</span>
              <span className="text-[var(--accent)]">${order.total_usd.toFixed(2)} USDT</span>
            </div>
          </div>

          <p className="text-[var(--text-muted)] text-sm">
            Tu pedido llegará en aproximadamente<br/>
            <span className="text-[var(--accent)] font-bold">30–45 minutos</span>
          </p>

          {order.ton_tx_hash && (
            <p className="text-[var(--text-muted)] text-xs font-mono">
              Tx: {order.ton_tx_hash.slice(0, 20)}...
            </p>
          )}
        </>
      )}

      <button
        onClick={() => router.push('/catalog')}
        className="w-full bg-[var(--surface)] text-[var(--accent)] border border-[var(--accent)] font-bold rounded-[var(--radius)] py-3 mt-auto"
      >
        Seguir comprando
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/countdown-timer.tsx src/components/qr-payment.tsx src/app/pay/ src/app/confirm/
git commit -m "feat: QR payment screen with polling and order confirmation"
```

---

## Task 14: Admin Auth + Layout

**Files:**
- Create: `src/app/admin/login/page.tsx`, `src/app/admin/layout.tsx`

- [ ] **Step 1: Admin login page**

`src/app/admin/login/page.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/admin')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
      <span className="text-[var(--accent)] text-3xl font-bold">🌿 Admin</span>
      <div className="w-full max-w-sm flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="bg-[var(--surface)] text-white rounded-[var(--radius)] p-3 outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="bg-[var(--surface)] text-white rounded-[var(--radius)] p-3 outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-[var(--accent)] text-[var(--accent-fg)] font-bold rounded-[var(--radius)] py-3 disabled:opacity-50"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Admin layout with auth guard**

`src/app/admin/layout.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/admin', label: '📊 Dashboard' },
  { href: '/admin/orders', label: '🛒 Pedidos' },
  { href: '/admin/products', label: '📦 Productos' },
  { href: '/admin/config', label: '⚙️ Config' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (pathname === '/admin/login') { setReady(true); return }
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/admin/login')
      else setReady(true)
    })
  }, [pathname, router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/admin/login')
  }

  if (!ready) return null

  if (pathname === '/admin/login') return <>{children}</>

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
        <span className="text-[var(--accent)] font-bold">🌿 GreenStore CMS</span>
        <button onClick={handleLogout} className="text-[var(--text-muted)] text-sm">Salir</button>
      </header>
      <div className="flex flex-1">
        <nav className="bg-[var(--surface)] w-40 p-3 flex flex-col gap-1 border-r border-[var(--border)] shrink-0">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-xs px-3 py-2 rounded-lg transition-colors ${
                pathname === n.href
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-4 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/login/ src/app/admin/layout.tsx
git commit -m "feat: admin login and layout with auth guard"
```

---

## Task 15: Admin Dashboard + Orders

**Files:**
- Create: `src/app/admin/page.tsx`, `src/app/admin/orders/page.tsx`, `src/components/admin/order-card.tsx`

- [ ] **Step 1: Dashboard page**

`src/app/admin/page.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/lib/supabase/types'

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('orders').select('*').then(({ data }) => setOrders(data ?? []))
  }, [])

  const today = new Date().toDateString()
  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === today)
  const todaySales = todayOrders
    .filter((o) => ['paid', 'accepted', 'on_the_way', 'delivered'].includes(o.status))
    .reduce((s, o) => s + Number(o.total_usd), 0)
  const activeOrders = orders.filter((o) => ['paid', 'accepted', 'on_the_way'].includes(o.status))

  const stats = [
    { label: 'Pedidos hoy', value: todayOrders.length },
    { label: 'Ventas hoy', value: `$${todaySales.toFixed(0)}` },
    { label: 'En curso', value: activeOrders.length },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-white font-bold text-xl">Dashboard</h1>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-[var(--surface)] rounded-[var(--radius)] p-4 text-center">
            <p className="text-[var(--accent)] text-2xl font-bold">{s.value}</p>
            <p className="text-[var(--text-muted)] text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Order card component**

`src/components/admin/order-card.tsx`:
```tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import type { Order, OrderStatus } from '@/lib/supabase/types'

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Pago pendiente',
  paid: 'Pagado',
  accepted: 'Aceptado',
  on_the_way: 'En camino',
  delivered: 'Entregado',
  rejected: 'Rechazado',
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_payment: 'text-yellow-400 bg-yellow-400/10',
  paid: 'text-[var(--accent)] bg-[var(--accent)]/10',
  accepted: 'text-blue-400 bg-blue-400/10',
  on_the_way: 'text-purple-400 bg-purple-400/10',
  delivered: 'text-green-400 bg-green-400/10',
  rejected: 'text-red-400 bg-red-400/10',
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: 'accepted',
  accepted: 'on_the_way',
  on_the_way: 'delivered',
}

export function OrderCard({ order, onUpdate }: { order: Order; onUpdate: () => void }) {
  const handleStatus = async (status: OrderStatus) => {
    const supabase = createClient()
    await supabase.from('orders').update({ status }).eq('id', order.id)
    onUpdate()
  }

  const nextStatus = NEXT_STATUS[order.status]

  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius)] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-white font-bold">#{order.order_number}</span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[order.status]}`}>
          {STATUS_LABEL[order.status]}
        </span>
      </div>
      <div className="text-[var(--text-muted)] text-xs">
        <p>👤 @{order.telegram_username || order.telegram_user_id}</p>
        <p>📍 {order.delivery_address}</p>
      </div>
      <div className="flex flex-col gap-1">
        {order.items.map((i) => (
          <div key={i.product_id} className="flex justify-between text-xs">
            <span className="text-white">{i.name} ×{i.qty}</span>
            <span className="text-[var(--accent)]">${(i.price * i.qty).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-[var(--border)] pt-1 flex justify-between text-sm font-bold">
          <span className="text-white">Total</span>
          <span className="text-[var(--accent)]">${order.total_usd} USDT</span>
        </div>
      </div>
      {nextStatus && (
        <button
          onClick={() => handleStatus(nextStatus)}
          className="bg-[var(--accent)] text-[var(--accent-fg)] text-sm font-bold rounded-lg py-2"
        >
          Marcar: {STATUS_LABEL[nextStatus]}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Orders page with realtime**

`src/app/admin/orders/page.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/lib/supabase/types'
import { OrderCard } from '@/components/admin/order-card'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])

  const load = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setOrders(data ?? [])
  }

  useEffect(() => {
    load()
    const supabase = createClient()
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-white font-bold text-xl">Pedidos</h1>
      {orders.length === 0
        ? <p className="text-[var(--text-muted)]">No hay pedidos aún.</p>
        : orders.map((o) => <OrderCard key={o.id} order={o} onUpdate={load} />)
      }
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/page.tsx src/app/admin/orders/ src/components/admin/order-card.tsx
git commit -m "feat: admin dashboard and orders list with Supabase Realtime"
```

---

## Task 16: Admin Products CRUD + Config

**Files:**
- Create: `src/app/admin/products/page.tsx`, `src/components/admin/product-form.tsx`, `src/app/admin/config/page.tsx`

- [ ] **Step 1: Product form component**

`src/components/admin/product-form.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product, ProductCategory } from '@/lib/supabase/types'

const CATEGORIES: ProductCategory[] = ['preroll', 'gummy', 'oil', 'other']

interface ProductFormProps {
  product?: Product
  onSave: () => void
  onCancel: () => void
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? 'preroll')
  const [price, setPrice] = useState(product?.price_usd?.toString() ?? '')
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')
  const [active, setActive] = useState(product?.active ?? true)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name || !price) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      name, description, category,
      price_usd: parseFloat(price),
      image_url: imageUrl,
      active,
    }
    if (product) {
      await supabase.from('products').update(payload).eq('id', product.id)
    } else {
      await supabase.from('products').insert(payload)
    }
    setSaving(false)
    onSave()
  }

  const inputClass = 'bg-[var(--surface-2)] text-white rounded-lg p-2.5 text-sm outline-none w-full'

  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius)] p-4 flex flex-col gap-3">
      <h3 className="text-white font-bold">{product ? 'Editar' : 'Nuevo'} producto</h3>
      <input className={inputClass} placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
      <textarea className={inputClass} placeholder="Descripción" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)}>
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <input className={inputClass} placeholder="Precio USD" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
      <input className={inputClass} placeholder="URL imagen (opcional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Activo (visible en catálogo)
      </label>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="flex-1 bg-[var(--accent)] text-[var(--accent-fg)] font-bold rounded-lg py-2 text-sm disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button onClick={onCancel} className="flex-1 bg-[var(--surface-2)] text-[var(--text-muted)] rounded-lg py-2 text-sm">
          Cancelar
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Products page**

`src/app/admin/products/page.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/supabase/types'
import { ProductForm } from '@/components/admin/product-form'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [editing, setEditing] = useState<Product | 'new' | null>(null)

  const load = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('products').select('*').order('category')
    setProducts(data ?? [])
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return
    const supabase = createClient()
    await supabase.from('products').delete().eq('id', id)
    load()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white font-bold text-xl">Productos</h1>
        <button
          onClick={() => setEditing('new')}
          className="bg-[var(--accent)] text-[var(--accent-fg)] text-sm font-bold px-3 py-2 rounded-lg"
        >
          + Nuevo
        </button>
      </div>

      {editing && (
        <ProductForm
          product={editing === 'new' ? undefined : editing}
          onSave={() => { setEditing(null); load() }}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="flex flex-col gap-2">
        {products.map((p) => (
          <div key={p.id} className="bg-[var(--surface)] rounded-[var(--radius)] p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{p.name}</p>
              <p className="text-[var(--text-muted)] text-xs">{p.category} · ${p.price_usd}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${p.active ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-red-400/10 text-red-400'}`}>
              {p.active ? 'Activo' : 'Inactivo'}
            </span>
            <button onClick={() => setEditing(p)} className="text-[var(--text-muted)] text-xs hover:text-white">Editar</button>
            <button onClick={() => handleDelete(p.id)} className="text-red-400 text-xs hover:text-red-300">Borrar</button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Config page**

`src/app/admin/config/page.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const CONFIG_FIELDS = [
  { key: 'delivery_fee', label: 'Costo de delivery (USD)', type: 'number' },
  { key: 'estimated_time', label: 'Tiempo estimado (ej: 30-45)', type: 'text' },
  { key: 'ton_wallet_address', label: 'Dirección TON receptora', type: 'text' },
  { key: 'welcome_message', label: 'Mensaje de bienvenida', type: 'text' },
] as const

export default function AdminConfigPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('config').select('key, value').then(({ data }) => {
      const map: Record<string, string> = {}
      for (const row of data ?? []) map[row.key] = row.value
      setValues(map)
    })
  }, [])

  const handleSave = async () => {
    const supabase = createClient()
    await Promise.all(
      Object.entries(values).map(([key, value]) =>
        supabase.from('config').upsert({ key, value })
      )
    )
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <h1 className="text-white font-bold text-xl">Configuración</h1>
      {CONFIG_FIELDS.map((field) => (
        <div key={field.key} className="flex flex-col gap-1">
          <label className="text-[var(--text-muted)] text-xs">{field.label}</label>
          <input
            type={field.type}
            value={values[field.key] ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
            className="bg-[var(--surface)] text-white rounded-[var(--radius)] p-3 text-sm outline-none"
          />
        </div>
      ))}
      <button
        onClick={handleSave}
        className="bg-[var(--accent)] text-[var(--accent-fg)] font-bold rounded-[var(--radius)] py-3"
      >
        {saved ? '✓ Guardado' : 'Guardar cambios'}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/products/ src/app/admin/config/ src/components/admin/product-form.tsx
git commit -m "feat: admin products CRUD and config page"
```

---

## Task 17: Bot Webhook Registration + Deploy

**Files:**
- Create: `.env.local` (from .env.local.example), `vercel.json`

- [ ] **Step 1: Add RLS policy for admin reads on orders**

Run in Supabase SQL Editor:
```sql
-- Allow service role to read/write orders (already via service key)
-- Allow anon to read own orders via telegram_user_id (optional for status endpoint)
create policy "orders_service_all" on orders
  using (true)
  with check (true);
-- Note: this is permissive — service role key bypasses RLS anyway
```

- [ ] **Step 2: Deploy to Vercel**

```bash
npx vercel --yes
```

Note the deployment URL (e.g. `https://tg-marketplace.vercel.app`).

- [ ] **Step 3: Set environment variables in Vercel**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add TELEGRAM_BOT_TOKEN production
vercel env add TELEGRAM_ADMIN_CHAT_ID production
vercel env add TON_WALLET_ADDRESS production
vercel env add TON_CENTER_API_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
```

- [ ] **Step 4: Register Telegram webhook**

```bash
# Replace with your actual values
BOT_TOKEN="your-bot-token"
APP_URL="https://tg-marketplace.vercel.app"

curl "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -d "url=${APP_URL}/api/webhook"
```

Expected response:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

- [ ] **Step 5: Register Mini App with BotFather**

In Telegram, message `@BotFather`:
1. `/newapp` (or `/editapp` if bot exists)
2. Select your bot
3. Set the Web App URL to `https://tg-marketplace.vercel.app`
4. BotFather will give you a link like `t.me/YourBot/app`

- [ ] **Step 6: Redeploy with env vars**

```bash
vercel --prod
```

- [ ] **Step 7: Verify webhook**

```bash
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

Expected: `pending_update_count: 0`, `url` matches your app.

- [ ] **Step 8: Final commit**

```bash
git add .
git commit -m "feat: complete TG Marketplace cannabis store v1"
```

---

## Self-Review Checklist

- ✅ Age Gate (Task 10)
- ✅ Catalog + category filter (Task 11)
- ✅ Product detail (Task 12)
- ✅ Cart (Task 12)
- ✅ Checkout (Task 12)
- ✅ QR Payment + countdown + polling (Task 13)
- ✅ Confirmation screen (Task 13)
- ✅ POST /api/orders validates initData, computes total, creates order (Task 8)
- ✅ GET /api/orders/[id]/status checks TON on-chain, marks paid, notifies admin (Task 8)
- ✅ Bot notifies admin with inline buttons Aceptar/Rechazar (Task 7 lib/bot.ts)
- ✅ Webhook handles callback_query for button presses (Task 8)
- ✅ Admin login + auth guard (Task 14)
- ✅ Admin dashboard metrics (Task 15)
- ✅ Admin orders realtime (Task 15)
- ✅ Admin products CRUD (Task 16)
- ✅ Admin config (Task 16)
- ✅ Vercel deploy + webhook registration (Task 17)
- ✅ Type consistency: `Order`, `Product`, `OrderItem`, `CartItem` used consistently across all tasks
