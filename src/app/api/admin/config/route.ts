import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, config } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await db.select().from(config)
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value
  return NextResponse.json(map)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body: Record<string, string> = await req.json()
  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      db.insert(config).values({ key, value })
        .onConflictDoUpdate({ target: config.key, set: { value } }),
    ),
  )
  return NextResponse.json({ ok: true })
}
