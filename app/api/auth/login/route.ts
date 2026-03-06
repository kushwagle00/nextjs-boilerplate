import { NextRequest, NextResponse } from 'next/server'
import { loginAgent, createSession } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = loginSchema.safeParse(body)

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

    const { email, password } = parsed.data
    const result = await loginAgent(email, password)

    if (result.error) {
      return NextResponse.json(
        { errors: { general: result.error } },
        { status: 401 }
      )
    }

    await createSession(result.agent!.id)

    return NextResponse.json({ success: true, agent: result.agent })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { errors: { general: 'An unexpected error occurred. Please try again.' } },
      { status: 500 }
    )
  }
}
