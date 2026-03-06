import { neon } from '@neondatabase/serverless'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('customer_session')

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const session = JSON.parse(sessionCookie.value)
    const customerId = session.customerId

    // Get customer with devices
    const customers = await sql`
      SELECT 
        c.id, 
        c.first_name, 
        c.last_name, 
        c.email,
        c.subscription_plan,
        c.subscription_status,
        json_agg(
          json_build_object(
            'id', d.id,
            'device_type', d.device_type,
            'device_name', d.device_name,
            'brand', d.brand,
            'model', d.model,
            'imei', d.imei,
            'serial_number', d.serial_number,
            'color', d.color,
            'purchased_date', d.purchased_date,
            'created_at', d.created_at
          ) ORDER BY d.created_at DESC
        ) FILTER (WHERE d.id IS NOT NULL) as devices
      FROM customers c
      LEFT JOIN devices d ON c.id = d.customer_id
      WHERE c.id = ${customerId}
      GROUP BY c.id, c.first_name, c.last_name, c.email, c.subscription_plan, c.subscription_status
    `

    if (customers.length === 0) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      )
    }

    const customer = customers[0]

    return NextResponse.json({
      customer: {
        ...customer,
        devices: customer.devices || [],
      },
    })
  } catch (error) {
    console.error('[v0] Get customer profile error:', error)
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    )
  }
}
