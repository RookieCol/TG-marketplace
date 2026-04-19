import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, products } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await db.select().from(products)
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { name, description, category, price_usd, image_url, active } = body
  const [p] = await db.insert(products).values({ name, description, category, price_usd: price_usd.toString(), image_url, active }).returning()
  return NextResponse.json(p)
}
