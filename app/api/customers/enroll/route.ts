import { getDb } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { enrollmentSchema } from '@/lib/validations'
import { getAgentSession } from '@/lib/session'

const sql = getDb()

export async function POST(request: NextRequest) {
  try {
    const session = await getAgentSession()

    // Check for agent session OR API key for Postman/CLI access
    const authHeader = request.headers.get('authorization')
    const apiKey = process.env.ENROLLMENT_API_KEY
    const isApiKeyValid = apiKey && apiKey.length >= 32 && authHeader === `Bearer ${apiKey}`

    if (!session && !isApiKeyValid) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide agent session cookie or Authorization: Bearer <ENROLLMENT_API_KEY> header' },
        { status: 401 }
      )
    }

    if (process.env.DEMO_MODE !== 'true') return NextResponse.json({ errors: { general: 'Enrollment is unavailable until a real payment provider is configured' } }, { status: 503 })
    const body = await request.json().catch(() => null)
    const parsed = enrollmentSchema.safeParse(body)

    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string
        if (!errors[field]) {
          errors[field] = issue.message
        }
      }
      return NextResponse.json({ errors }, { status: 400 })
    }

    const data = parsed.data

    if (data.cardNumber.replace(/\s/g, '') !== '4242424242424242') return NextResponse.json({ errors: { cardNumber: 'Use demo card 4242 4242 4242 4242 only' } }, { status: 400 })
    if (!['101', '010'].includes(data.cardCvv)) return NextResponse.json({ errors: { cardCvv: 'Use 101 to approve or 010 to decline the simulated payment' } }, { status: 400 })
    const duplicate = await sql`SELECT id FROM customers WHERE LOWER(email) = ${data.email.trim().toLowerCase()}`
    if (duplicate.length) return NextResponse.json({ errors: { email: 'A customer with this email already exists' } }, { status: 409 })
    // Simulated payments only; no real payment credentials are accepted.
    // CVV 101 = approved, CVV 010 = declined
    if (data.cardCvv === '010') {
      return NextResponse.json(
        {
          errors: {
            cardNumber: 'Card was declined. Please try a different payment method.',
          },
        },
        { status: 402 }
      )
    }

    // Store only the test card suffix and expiry.
    const cardNumberClean = data.cardNumber.replace(/\s/g, '')
    const cardLastFour = cardNumberClean.slice(-4)

    // Plan SKU mapping
    const planSkuMap: Record<string, string> = {
      phone_plan: 'DPPhoneProtect',
      gadget_phone_plan: 'DPTotalProtect',
    }
    const planSku = planSkuMap[data.subscriptionPlan] ?? data.subscriptionPlan

    // Get plan price
    const planPrice = data.subscriptionPlan === 'phone_plan' ? 9.99 : 19.99

    // Store phone as 10 digits only
    const phoneClean = data.phone.replace(/\D/g, '')

    const result = await sql`
      INSERT INTO customers (
        first_name, last_name, email, phone,
        address_line1, address_line2, city, state, zip_code,
        subscription_plan, subscription_price, card_last_four, card_expiry,
        plan_type, plan_sku, subscription_status, payment_status, enrolled_by_agent_id
      ) VALUES (
        ${data.firstName}, ${data.lastName}, ${data.email.trim().toLowerCase()}, ${phoneClean},
        ${data.addressLine1}, ${data.addressLine2 || ''}, ${data.city}, ${data.state}, ${data.zipCode},
        ${data.subscriptionPlan}, ${planPrice}, ${cardLastFour}, ${data.cardExpiry},
        ${data.subscriptionPlan}, ${planSku}, 'active', 'active', ${session?.agentId ?? null}
      )
      RETURNING id
    `

    return NextResponse.json({
      success: true,
      customerId: result[0].id,
      message: 'Customer enrolled successfully',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json({ errors: { email: 'A customer with this email already exists' } }, { status: 409 })
    }
    console.error('[portal] Enrollment error:', error)
    return NextResponse.json(
      { errors: { general: 'An unexpected error occurred. Please try again.' } },
      { status: 500 }
    )
  }
}
