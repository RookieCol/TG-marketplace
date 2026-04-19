import { NextResponse } from 'next/server'
import { db, products } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function GET() {
  const rows = await db.select().from(products).where(eq(products.active, true))
  return NextResponse.json(rows)
}
