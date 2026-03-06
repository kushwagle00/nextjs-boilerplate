import { neon } from '@neondatabase/serverless'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('agent_session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const customerId = parseInt(id)

    if (isNaN(customerId)) {
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
