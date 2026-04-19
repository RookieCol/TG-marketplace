import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, orders } from '@/lib/db'
import { desc } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await db.select().from(orders).orderBy(desc(orders.created_at)).limit(50)
  return NextResponse.json(rows)
}
