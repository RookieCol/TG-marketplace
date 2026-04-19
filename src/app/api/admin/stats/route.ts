import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, orders } from '@/lib/db'
import { gte } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayOrders = await db.select().from(orders).where(gte(orders.created_at, today))
  const paid = todayOrders.filter((o) =>
    ['paid', 'accepted', 'on_the_way', 'delivered'].includes(o.status),
  )
  const todaySales = paid.reduce((s, o) => s + Number(o.total_usd), 0)
  const active = todayOrders.filter((o) =>
    ['paid', 'accepted', 'on_the_way'].includes(o.status),
  ).length

  return NextResponse.json({ todayOrders: todayOrders.length, todaySales, active })
}
