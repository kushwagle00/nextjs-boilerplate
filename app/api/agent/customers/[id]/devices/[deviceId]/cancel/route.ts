import { neon } from '@neondatabase/serverless'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; deviceId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('agent_session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, deviceId } = await params
    const customerId = parseInt(id)
    const deviceIdNum = parseInt(deviceId)

    if (isNaN(customerId) || isNaN(deviceIdNum)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    // Verify the device belongs to this customer before deleting
    const existing = await sql`
      SELECT id FROM devices
      WHERE id = ${deviceIdNum} AND customer_id = ${customerId}
    `

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    await sql`
      DELETE FROM devices
      WHERE id = ${deviceIdNum} AND customer_id = ${customerId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Agent device cancel error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
