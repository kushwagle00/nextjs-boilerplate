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
    const sessionCookie = cookieStore.get('customer_session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)
    const { id } = await params
    const customerId = parseInt(id)

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
    console.error('[v0] Get devices error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('customer_session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)
    const { id } = await params
    const customerId = parseInt(id)

    if (session.customerId !== customerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { type, deviceName, brand, model, imei, serialNumber, color, purchaseDate } = body

    // Validation
    const errors: Record<string, string> = {}
    if (!type) errors.type = 'Device type is required'
    if (!deviceName) errors.deviceName = 'Device name is required'
    if (!brand) errors.brand = 'Brand is required'
    if (!model) errors.model = 'Model is required'
    if (!purchaseDate) errors.purchaseDate = 'Purchase date is required'

    if (type === 'phone' && !imei) {
      errors.imei = 'IMEI is required for phones'
    }
    if (type !== 'phone' && !serialNumber) {
      errors.serialNumber = 'Serial number is required'
    }
    if (type !== 'speaker' && !color) {
      errors.color = 'Color is required'
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 })
    }

    // Check device limit based on plan
    const deviceCountResult = await sql`
      SELECT COUNT(*) as count
      FROM devices
      WHERE customer_id = ${customerId} AND device_type = ${type}
    `

    const deviceCount = parseInt(deviceCountResult[0]?.count || '0')

    // Phone plan can only have 1 phone
    if (session.plan === 'phone_plan' && type === 'phone' && deviceCount >= 1) {
      return NextResponse.json(
        { errors: { general: 'You can only add 1 phone with the Phone Plan' } },
        { status: 400 }
      )
    }

    // Add device
    const result = await sql`
      INSERT INTO devices (
        customer_id, device_type, device_name, brand, model,
        imei, serial_number, color, purchased_date
      ) VALUES (
        ${customerId}, ${type}, ${deviceName}, ${brand}, ${model},
        ${imei || null}, ${serialNumber || null}, ${color || null}, ${purchaseDate}
      )
      RETURNING id
    `

    return NextResponse.json({
      success: true,
      deviceId: result[0].id,
    })
  } catch (error) {
    console.error('[v0] Add device error:', error)
    return NextResponse.json(
      { errors: { general: 'An error occurred' } },
      { status: 500 }
    )
  }
}
