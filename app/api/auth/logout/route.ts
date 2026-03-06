import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const cookieStore = await cookies()
    
    // Clear both agent and customer sessions
    cookieStore.delete('agent_session')
    cookieStore.delete('customer_session')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[portal] Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}
