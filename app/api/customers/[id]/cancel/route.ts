import { getDb } from '@/lib/db'
import { getAgentSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'

const sql = getDb()

export async function POST(
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

    const body = await req.json().catch(() => null)
    const reason = body?.reason

    if (!reason || !['customer', 'agent'].includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid cancellation reason' },
        { status: 400 }
      )
    }

    // Update customer subscription status
    const updated = await sql`
      UPDATE customers
      SET subscription_status = 'cancelled', payment_status = 'cancelled',
          cancellation_reason = ${reason},
          cancelled_by = 'agent',
          cancelled_at = NOW()
      WHERE id = ${customerId}
      RETURNING id
    `
    if (!updated.length) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
    })
  } catch (error) {
    console.error('[portal] Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
