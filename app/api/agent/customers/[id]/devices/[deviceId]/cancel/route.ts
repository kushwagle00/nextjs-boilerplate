import { getDb } from '@/lib/db'
import { getAgentSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'

const sql = getDb()

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; deviceId: string }> }
) {
  try {
    const session = await getAgentSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, deviceId } = await params
    const customerId = Number(id)
    const deviceIdNum = Number(deviceId)

    if ((!Number.isSafeInteger(customerId) || customerId < 1) || (!Number.isSafeInteger(deviceIdNum) || deviceIdNum < 1)) {
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
