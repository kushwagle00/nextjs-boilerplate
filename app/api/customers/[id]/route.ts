import { neon } from '@neondatabase/serverless'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('agent_session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customerId = parseInt(params.id, 10)
    if (isNaN(customerId)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 })
    }

    const customers = await sql`
      SELECT 
        id, first_name, last_name, email, phone,
        address_line1, address_line2, city, state, zip_code,
        subscription_plan, card_last_four, card_expiry,
        is_active, created_at
      FROM customers
      WHERE id = ${customerId}
    `

    if (!customers || customers.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ customer: customers[0] })
  } catch (error) {
    console.error('[v0] Customer fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}
