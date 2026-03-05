import { neon } from '@neondatabase/serverless'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { devicePhoneSchema } from '@/lib/validations'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('customer_session')

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validation = devicePhoneSchema.safeParse(body)

    if (!validation.success) {
      const error = validation.error.errors[0]
      return NextResponse.json(
        {
          message: error.message,
          field: error.path[0],
        },
        { status: 400 }
      )
    }

    const session = JSON.parse(sessionCookie.value)
    const customerId = session.customerId

    // Insert device
    await sql`
      INSERT INTO devices (customer_id, device_type, device_name, brand, model, imei, color, purchase_date, created_at)
      VALUES (${customerId}, 'phone', ${body.deviceName}, ${body.brand}, ${body.model}, ${body.imei}, ${body.color}, ${body.purchaseDate}, NOW())
    `

    return NextResponse.json(
      { message: 'Phone added successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Add phone error:', error)
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    )
  }
}
