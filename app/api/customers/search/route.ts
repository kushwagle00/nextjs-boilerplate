import { neon } from '@neondatabase/serverless'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('agent_session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ customers: [] })
    }

    const searchTerm = `%${query}%`

    const customers = await sql`
      SELECT 
        id, first_name, last_name, email, phone,
        city, state,
        subscription_plan, subscription_status, created_at
      FROM customers
      WHERE 
        LOWER(first_name) LIKE LOWER(${searchTerm})
        OR LOWER(last_name) LIKE LOWER(${searchTerm})
        OR LOWER(email) LIKE LOWER(${searchTerm})
        OR phone LIKE ${searchTerm}
      ORDER BY created_at DESC
      LIMIT 50
    `

    return NextResponse.json({ customers })
  } catch (error) {
    console.error('[v0] Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search customers' },
      { status: 500 }
    )
  }
}
