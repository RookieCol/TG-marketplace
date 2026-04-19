<div align="center">

# TG Marketplace

**A Telegram Mini App storefront with TON blockchain payments**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://postgresql.org)
[![TON](https://img.shields.io/badge/TON-Blockchain-0098EA?logo=telegram)](https://ton.org)
[![Telegram](https://img.shields.io/badge/Telegram-Mini_App-2CA5E0?logo=telegram)](https://core.telegram.org/bots/webapps)

</div>

---

## Overview

TG Marketplace is a full-stack **Telegram Mini App** that lets customers browse a product catalog, add items to a cart, and pay with **USDT on TON** — all without leaving Telegram.

Orders are routed to an admin Telegram group where operators accept or reject them with a single tap. A Next.js admin dashboard provides full CRUD for products, order tracking, and runtime configuration.

---

## Screenshots

| Catalog | Product Sheet | Cart |
|---------|--------------|------|
| ![Catalog](docs/screenshots/catalog.png) | ![Sheet](docs/screenshots/sheet.png) | ![Cart](docs/screenshots/cart.png) |

| Checkout | Payment (QR) | Confirmation |
|----------|-------------|--------------|
| ![Checkout](docs/screenshots/checkout.png) | ![Pay](docs/screenshots/pay.png) | ![Confirm](docs/screenshots/confirm.png) |

> Add screenshots to `docs/screenshots/` to populate the table above.

---

## Features

**Customer App (Telegram Mini App)**
- Age verification gate on first visit
- Product catalog with category filters (Pre-rolls, Gummies, Oils, Other)
- Bottom-sheet product detail with quantity selector
- Persistent cart via Zustand + localStorage
- Delivery address form at checkout
- TON USDT payment with QR code + wallet deeplink
- 15-minute payment countdown with auto-expiry
- Real-time payment detection via TON Center polling
- Order confirmation screen with transaction hash

**Admin Bot**
- Inline keyboard notifications for every new order
- One-tap Accept / Reject buttons
- Customer receives automatic notification on either action

**Admin Dashboard** (`/admin`)
- Password-protected (NextAuth credentials)
- Product CRUD (name, price, category, image, active toggle)
- Order list with status tracking and manual status updates
- Revenue and order count statistics
- Runtime config (delivery fee, estimated delivery time, TON wallet address)

---

## Architecture

```
Telegram Client
      │  opens Mini App via Menu Button or t.me link
      ▼
┌─────────────────────────────────────┐
│        Next.js 16 (App Router)      │
│                                     │
│  /catalog  /cart  /checkout         │  ◄── Customer pages
│  /pay/[id]  /confirm/[id]           │
│                                     │
│  /admin  (protected by NextAuth)    │  ◄── Admin dashboard
│                                     │
│  /api/products  /api/orders         │  ◄── REST API
│  /api/webhook  /api/admin/*         │
└───────────────┬─────────────────────┘
                │
       ┌────────┴────────┐
       │                 │
  PostgreSQL        Telegram Bot
  (Drizzle ORM)    (grammY)
                         │
                    Admin Group
                   (inline buttons)
                         │
                   TON Center API
                 (payment detection)
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 · React 19 · TypeScript 5 |
| Styling | Tailwind CSS v4 · CSS custom properties |
| Database | PostgreSQL 16 · Drizzle ORM |
| Auth | NextAuth v5 (Credentials provider) |
| State | Zustand 5 (persisted cart) |
| Payments | TON blockchain · USDT (Jetton) |
| Bot | grammY (polling dev / webhook prod) |
| Validation | Zod |
| Testing | Vitest · Testing Library |
| Deployment | Docker Compose · Railway · VPS + Nginx |

---

## Prerequisites

- Node.js 22+
- Docker & Docker Compose
- A Telegram bot token (from [@BotFather](https://t.me/BotFather))
- A TON wallet address that accepts USDT (Jettons)
- ngrok (for local Telegram WebApp testing)

---

## Getting Started

### 1. Clone and install

```bash
git clone git@github.com:RookieCol/TG-marketplace.git
cd TG-marketplace
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tgmarketplace

# Auth
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your-random-secret-here

# Telegram
TELEGRAM_BOT_TOKEN=123456:your-bot-token
TELEGRAM_ADMIN_CHAT_ID=-100your-group-id

# TON
TON_WALLET_ADDRESS=UQB...your-wallet-address
TON_CENTER_API_KEY=                          # optional, increases rate limits

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Start the database

```bash
docker compose up -d db
```

### 4. Run migrations and seed

```bash
npm run db:migrate
npx tsx scripts/seed.ts
```

This creates the schema and inserts:
- Default config (delivery fee $3, 30-45 min ETA)
- Sample products in each category
- Admin user: `admin@greenstore.local` / `admin1234`

### 5. Start development server

```bash
npm run dev
```

App is running at [http://localhost:3000](http://localhost:3000).

---

## Testing in Telegram

Telegram requires an HTTPS URL. Use ngrok:

```bash
ngrok http 3000
```

Then in BotFather:
1. `/mybots` → select your bot → **Bot Settings** → **Menu Button** → **Configure menu button**
2. Enter your ngrok URL (e.g. `https://abc123.ngrok-free.app/catalog`)

Update `next.config.ts` with your ngrok host so HMR works:

```ts
allowedDevOrigins: ['abc123.ngrok-free.app'],
```

Open your bot in Telegram and tap the menu button (⊞) to launch the Mini App.

---

## Database

```bash
npm run db:generate   # generate migrations after schema changes
npm run db:migrate    # apply migrations
npm run db:studio     # open Drizzle Studio (visual DB browser)
```

### Schema overview

| Table | Description |
|-------|-------------|
| `products` | Catalog items with category, price, image |
| `orders` | Customer orders with JSONB items array, TON payment details, status |
| `config` | Key-value runtime settings (delivery fee, wallet address, etc.) |
| `admin_users` | bcrypt-hashed admin credentials |

---

## Project Structure

```
src/
├── app/
│   ├── catalog/          # Product grid + category nav
│   ├── cart/             # Cart review
│   ├── checkout/         # Address form
│   ├── pay/[orderId]/    # QR + TON payment
│   ├── confirm/[orderId]/# Success screen
│   ├── product/[id]/     # Product detail page
│   ├── admin/            # Dashboard (protected)
│   └── api/              # REST API routes
├── components/
│   ├── age-gate.tsx
│   ├── product-card.tsx
│   ├── product-sheet.tsx
│   ├── cart-item.tsx
│   ├── countdown-timer.tsx
│   └── admin/
├── lib/
│   ├── cart.ts           # Zustand store
│   ├── db/               # Drizzle schema + migrations
│   ├── auth.ts           # NextAuth config
│   ├── bot.ts            # Telegram bot notifications
│   ├── telegram.ts       # initData validation
│   ├── ton.ts            # Payment URI + TON Center
│   └── config.ts         # Runtime config loader
scripts/
├── seed.ts               # DB seed (products + admin user)
└── run-bot.ts            # Bot polling service
docker/
├── Dockerfile            # Next.js production image
└── Dockerfile.bot        # Bot service image
```

---

## Payment Flow

```
Customer checkout
       │
       ▼
POST /api/orders  ──► Creates order + generates ton:// URI
       │
       ▼
/pay/[orderId]  ──► Shows QR code, polls /api/orders/[id]/status every 5s
       │
       ▼ (customer pays)
TON Center API  ──► Payment detected, order marked paid
       │
       ▼
Telegram Bot  ──► Notifies admin group with Accept/Reject buttons
       │
       ▼
/confirm/[orderId]  ──► Customer sees confirmation + order summary
```

---

## Deployment

### Docker Compose (VPS)

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# Check logs
docker compose -f docker-compose.prod.yml logs -f app
```

Includes: Next.js app · PostgreSQL · Telegram bot · Nginx reverse proxy

### Railway

```bash
# Uses railway.toml — just connect your repo
railway up
```

Set environment variables via Railway dashboard. The bot runs as a separate service using `docker/Dockerfile.bot`.

See `.env.railway.example` for required variables.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | JWT signing secret |
| `NEXTAUTH_URL` | ✅ | App base URL for auth callbacks |
| `AUTH_SECRET` | ✅ | NextAuth v5 secret |
| `TELEGRAM_BOT_TOKEN` | ✅ | Bot token from BotFather |
| `TELEGRAM_ADMIN_CHAT_ID` | ✅ | Admin group chat ID (negative number) |
| `TON_WALLET_ADDRESS` | ✅ | Merchant USDT-receiving wallet |
| `TON_CENTER_API_KEY` | ➖ | TON Center API key (higher rate limits) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public frontend URL (used in bot links) |
| `NODE_ENV` | ✅ | `development` or `production` |

---

## Scripts

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run start        # Start production server
npm run test         # Run unit tests (Vitest)
npm run test:watch   # Watch mode
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Apply migrations
npm run db:studio    # Open Drizzle Studio
npx tsx scripts/seed.ts        # Seed database
npx tsx scripts/run-bot.ts     # Start bot (dev polling)
```

---

## Design System

The UI uses a custom **sharp light** design system defined in CSS custom properties:

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#f5f5f5` | Page background |
| `--surface` | `#ffffff` | Cards, sheets, nav |
| `--text` | `#0d0d0d` | Primary text + CTA backgrounds |
| `--accent` | `#c9f04a` | Lime accent (price highlights) |
| `--accent-dark` | `#8db200` | Price text color |
| `--border` | `#e0e0e0` | Dividers, grid gaps |
| `--border-strong` | `#b0b0b0` | Inputs, buttons |
| `--radius` | `2px` | Border radius |

No component library dependencies — all UI is plain HTML + inline styles with CSS tokens.

---

## License

MIT
