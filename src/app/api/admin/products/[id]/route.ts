import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, products } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const { name, description, category, price_usd, image_url, active } = body
  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (description !== undefined) updateData.description = description
  if (category !== undefined) updateData.category = category
  if (price_usd !== undefined) updateData.price_usd = price_usd.toString()
  if (image_url !== undefined) updateData.image_url = image_url
  if (active !== undefined) updateData.active = active
  const [p] = await db.update(products)
    .set(updateData as any)
    .where(eq(products.id, id))
    .returning()
  return NextResponse.json(p)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await db.delete(products).where(eq(products.id, id))
  return NextResponse.json({ ok: true })
}
