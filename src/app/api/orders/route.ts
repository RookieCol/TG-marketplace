import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db, orders } from '@/lib/db'
import { buildTonPaymentUri } from '@/lib/ton'
import { getConfig } from '@/lib/config'
import { parseTelegramUser } from '@/lib/telegram'

const Schema = z.object({
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
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { initData, items, delivery_address, delivery_note } = parsed.data
  const tgUser = parseTelegramUser(initData)
  if (!tgUser) {
    return NextResponse.json({ error: 'Invalid Telegram user' }, { status: 401 })
  }

  const cfg = await getConfig()
  const deliveryFee = parseFloat(cfg.delivery_fee)
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const total = subtotal + deliveryFee
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  const [order] = await db.insert(orders).values({
    telegram_user_id: tgUser.id,
    telegram_username: tgUser.username ?? '',
    items,
    delivery_address,
    delivery_note,
    subtotal_usd: subtotal.toFixed(2),
    delivery_fee_usd: deliveryFee.toFixed(2),
    total_usd: total.toFixed(2),
    ton_address: cfg.ton_wallet_address,
    expires_at: expiresAt,
  }).returning()

  const memo = `ORD-${order.order_number}`
  const paymentUri = buildTonPaymentUri(cfg.ton_wallet_address, total, memo)

  return NextResponse.json({ order, paymentUri, memo })
}
