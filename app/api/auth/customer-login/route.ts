import { getDb } from '@/lib/db'
import { setSession } from '@/lib/session'
import { customerLoginSchema } from '@/lib/validations'
import { NextRequest, NextResponse } from 'next/server'

const sql = getDb()

export async function POST(req: NextRequest) {
  try {
    if (process.env.DEMO_MODE !== 'true') return NextResponse.json({ errors: { general: 'Customer sign-in requires a verified identity provider before production use' } }, { status: 503 })
    const parsed = customerLoginSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ errors: Object.fromEntries(parsed.error.issues.map(i => [String(i.path[0]), i.message])) }, { status: 400 })
    const { email, phone } = parsed.data

    // Validation
    if (!email || !phone) {
      return NextResponse.json(
        { errors: { general: 'Email and phone are required' } },
        { status: 400 }
      )
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { errors: { email: 'Invalid email format' } },
        { status: 400 }
      )
    }

    // Phone validation - extract digits
    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length !== 10) {
      return NextResponse.json(
        { errors: { phone: 'Please enter a valid 10-digit phone number' } },
        { status: 400 }
      )
    }

    // Find customer by email and phone (phone stored as 10 digits)
    const result = await sql`
      SELECT id, first_name, last_name, email, phone, subscription_plan, subscription_status
      FROM customers
      WHERE LOWER(email) = LOWER(${email.trim()}) AND phone = ${phoneDigits}
      LIMIT 1
    `

    if (!result || result.length === 0) {
      return NextResponse.json(
        { errors: { general: 'No account found with these credentials' } },
        { status: 404 }
      )
    }

    const customer = result[0]

    // Check if subscription is active
    if (customer.subscription_status === 'cancelled') {
      return NextResponse.json(
        { errors: { general: 'Your subscription has been cancelled' } },
        { status: 403 }
      )
    }

    // Create a session cookie
    const customerSessionData = {
      customerId: customer.id,
      email: customer.email,
      name: `${customer.first_name} ${customer.last_name}`,
      role: 'customer',
      plan: customer.subscription_plan,
      loginTime: new Date().toISOString(),
    }

    await setSession(Number(customer.id), 'customer')

    return NextResponse.json({
      success: true,
      customerId: customer.id,
      name: customerSessionData.name,
      plan: customer.subscription_plan,
    })
  } catch (error) {
    console.error('[portal] Customer login error:', error)
    return NextResponse.json(
      { errors: { general: 'An error occurred during login' } },
      { status: 500 }
    )
  }
}
