import { handleDevice } from '@/lib/device-route'
import { getDb } from '@/lib/db'
import { getCustomerSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'

const sql = getDb()

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCustomerSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const customerId = Number(id)

    // Verify the logged-in customer owns this profile
    if (session.customerId !== customerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get customer info
    const customerResult = await sql`
      SELECT id, first_name, last_name, subscription_plan
      FROM customers
      WHERE id = ${customerId}
    `

    if (!customerResult || customerResult.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const customer = customerResult[0]

    // Get devices
    const devicesResult = await sql`
      SELECT *
      FROM devices
      WHERE customer_id = ${customerId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      customerId: customer.id,
      name: `${customer.first_name} ${customer.last_name}`,
      plan: customer.subscription_plan,
      devices: devicesResult || [],
    })
  } catch (error) {
    console.error('[portal] Get devices error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^\d+$/.test(id) || Number(id) < 1) return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 })
  return handleDevice(req, 'gadget', Number(id))
}
