import { neon } from '@neondatabase/serverless'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; deviceId: string } }
) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('customer_session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)
    const customerId = parseInt(params.id)
    const deviceId = parseInt(params.deviceId)

    if (session.customerId !== customerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify device belongs to customer
    const deviceResult = await sql`
      SELECT id FROM devices
      WHERE id = ${deviceId} AND customer_id = ${customerId}
    `

    if (!deviceResult || deviceResult.length === 0) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    // Delete device
    await sql`DELETE FROM devices WHERE id = ${deviceId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Delete device error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
