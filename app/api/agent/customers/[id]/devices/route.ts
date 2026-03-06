import { getDb } from '@/lib/db'
import { getAgentSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'

const sql = getDb()

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAgentSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const customerId = Number(id)

    if ((!Number.isSafeInteger(customerId) || customerId < 1)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 })
    }

    const devices = await sql`
      SELECT
        id, device_type, device_name, brand, model,
        imei, serial_number, color, purchased_date, created_at
      FROM devices
      WHERE customer_id = ${customerId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ devices: devices || [] })
  } catch (error) {
    console.error('Agent get devices error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
