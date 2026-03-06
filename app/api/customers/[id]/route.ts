import { getDb } from '@/lib/db'
import { getAgentSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'

const sql = getDb()

export async function GET(
  request: NextRequest,
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

    const customers = await sql`
      SELECT 
        id, first_name, last_name, email, phone,
        address_line1, address_line2, city, state, zip_code,
        subscription_plan, subscription_price, subscription_status,
        plan_sku, card_last_four, card_expiry, created_at
      FROM customers
      WHERE id = ${customerId}
    `

    if (!customers || customers.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ customer: customers[0] })
  } catch (error) {
    console.error('[portal] Customer fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}
