import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'
import { enrollmentSchema } from '@/lib/validations'
import { cookies } from 'next/headers'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('agent_session')

    // Check for agent session OR API key for Postman/CLI access
    const authHeader = request.headers.get('authorization')
    const isApiKeyValid = authHeader?.startsWith('Bearer ') && authHeader.slice(7) === process.env.ENROLLMENT_API_KEY

    if (!sessionCookie?.value && !isApiKeyValid) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide agent session cookie or Authorization: Bearer <ENROLLMENT_API_KEY> header' },
        { status: 401 }
      )
    }

    const body = await request.json()
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

    // Mock payment processing - PCI DSS: never store full card number or CVV
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

    // PCI DSS compliant: Only store last 4 digits and expiry
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
        plan_type, plan_sku, subscription_status, payment_status
      ) VALUES (
        ${data.firstName}, ${data.lastName}, ${data.email}, ${phoneClean},
        ${data.addressLine1}, ${data.addressLine2 || ''}, ${data.city}, ${data.state}, ${data.zipCode},
        ${data.subscriptionPlan}, ${planPrice}, ${cardLastFour}, ${data.cardExpiry},
        ${data.subscriptionPlan}, ${planSku}, 'active', 'active'
      )
      RETURNING id
    `

    return NextResponse.json({
      success: true,
      customerId: result[0].id,
      message: 'Customer enrolled successfully',
    })
  } catch (error) {
    console.error('[v0] Enrollment error:', error)
    return NextResponse.json(
      { errors: { general: 'An unexpected error occurred. Please try again.' } },
      { status: 500 }
    )
  }
}
