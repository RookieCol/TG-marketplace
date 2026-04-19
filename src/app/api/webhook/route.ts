import { NextRequest, NextResponse } from 'next/server'
import { getBot, notifyClientAccepted, notifyClientRejected } from '@/lib/bot'
import { db, orders } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { getConfig } from '@/lib/config'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const cb = body.callback_query
  if (!cb) return NextResponse.json({ ok: true })

  const [action, orderId] = (cb.data as string).split(':')
  if (!orderId) return NextResponse.json({ ok: true })

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) return NextResponse.json({ ok: true })

  const bot = getBot()

  if (action === 'accept') {
    await db.update(orders).set({ status: 'accepted' }).where(eq(orders.id, orderId))
    const cfg = await getConfig()
    await notifyClientAccepted(order.telegram_user_id, order.order_number!, cfg.estimated_time)
    await bot.api.answerCallbackQuery(cb.id, { text: '✅ Pedido aceptado' })
  } else if (action === 'reject') {
    await db.update(orders).set({ status: 'rejected' }).where(eq(orders.id, orderId))
    await notifyClientRejected(order.telegram_user_id, order.order_number!)
    await bot.api.answerCallbackQuery(cb.id, { text: '❌ Pedido rechazado' })
  }

  return NextResponse.json({ ok: true })
}
