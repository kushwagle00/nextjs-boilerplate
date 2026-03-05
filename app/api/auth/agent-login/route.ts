import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    // Validation
    if (!email || !email.trim()) {
      return NextResponse.json(
        { errors: { email: 'Email is required' } },
        { status: 400 }
      )
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { errors: { email: 'Please enter a valid email address' } },
        { status: 400 }
      )
    }

    // Mock authentication - allow any valid email
    // In production, this would check against a database
    const normalizedEmail = email.trim().toLowerCase()
    
    const agentData = {
      email: normalizedEmail,
      role: 'agent',
      loginTime: new Date().toISOString(),
    }

    // Create a session cookie
    const cookieStore = await cookies()
    cookieStore.set('agent_session', JSON.stringify(agentData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return NextResponse.json({
      success: true,
      email: agentData.email,
      role: agentData.role,
    })
  } catch (error) {
    console.error('[v0] Agent login error:', error)
    return NextResponse.json(
      { errors: { general: 'An error occurred during login' } },
      { status: 500 }
    )
  }
}
