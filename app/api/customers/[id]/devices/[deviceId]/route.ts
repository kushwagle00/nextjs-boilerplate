import { getDb } from '@/lib/db'
import { getCustomerSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'

const sql = getDb()

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; deviceId: string }> }
) {
  try {
    const session = await getCustomerSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, deviceId: deviceIdParam } = await params
    const customerId = Number(id)
    const deviceId = Number(deviceIdParam)
    if (!Number.isSafeInteger(customerId) || customerId < 1 || !Number.isSafeInteger(deviceId) || deviceId < 1) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

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
    console.error('[portal] Delete device error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
