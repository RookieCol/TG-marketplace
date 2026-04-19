import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, orders } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { status } = await req.json()
  await db.update(orders).set({ status }).where(eq(orders.id, id))
  return NextResponse.json({ ok: true })
}
