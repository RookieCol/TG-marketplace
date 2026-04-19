import { NextRequest, NextResponse } from 'next/server'
import { db, orders } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { findIncomingUsdtTx } from '@/lib/ton'
import { notifyAdminNewOrder } from '@/lib/bot'
import { getConfig } from '@/lib/config'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (order.status !== 'pending_payment') {
    return NextResponse.json({ status: order.status, order })
  }

  if (new Date(order.expires_at) < new Date()) {
    await db.update(orders).set({ status: 'rejected' }).where(eq(orders.id, id))
    return NextResponse.json({ status: 'rejected', order })
  }

  const cfg = await getConfig()
  const memo = `ORD-${order.order_number}`
  const tx = await findIncomingUsdtTx(cfg.ton_wallet_address, memo, Number(order.total_usd))

  if (!tx) return NextResponse.json({ status: 'pending_payment', order })

  const [updated] = await db
    .update(orders)
    .set({ status: 'paid', ton_tx_hash: tx.hash })
    .where(eq(orders.id, id))
    .returning()

  if (updated) await notifyAdminNewOrder(updated)

  return NextResponse.json({ status: 'paid', order: updated })
}
