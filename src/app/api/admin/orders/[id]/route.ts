import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, orders } from '@/lib/db'
import { eq } from 'drizzle-orm'

const VALID_STATUSES = ['pending_payment','paid','accepted','on_the_way','delivered','rejected'] as const
type OrderStatus = typeof VALID_STATUSES[number]

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { status } = await req.json()
  if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  await db.update(orders).set({ status: status as OrderStatus }).where(eq(orders.id, id))
  return NextResponse.json({ ok: true })
}
