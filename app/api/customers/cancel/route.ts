import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(req: NextRequest) {
  try {
    const { id, reason } = await req.json()

    if (!id || !['customer', 'agent'].includes(reason)) {
      return NextResponse.json(
        { message: 'Invalid request' },
        { status: 400 }
      )
    }

    // Update customer status
    await sql`
      UPDATE customers
      SET is_active = false, status = 'cancelled', cancellation_reason = ${reason}, cancelled_at = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled',
    })
  } catch (error) {
    console.error('[v0] Cancel subscription error:', error)
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    )
  }
}
