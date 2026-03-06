import { NextRequest, NextResponse } from 'next/server'
import { getAgentSession } from '@/lib/session'
import { POST as cancel } from '../[id]/cancel/route'

export async function POST(req: NextRequest) {
  if (!await getAgentSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.clone().json().catch(() => null)
  if (!Number.isSafeInteger(body?.id) || body.id < 1)
    return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 })
  return cancel(req, { params: Promise.resolve({ id: String(body.id) }) })
}
