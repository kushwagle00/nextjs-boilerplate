import { NextRequest, NextResponse } from 'next/server'
import { registerAgent, createSession } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

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

    const { email, password, fullName } = parsed.data
    const result = await registerAgent(email, password, fullName)

    if (result.error) {
      return NextResponse.json({ errors: { email: result.error } }, { status: 400 })
    }

    await createSession(result.agent!.id)

    return NextResponse.json({ success: true, agent: result.agent })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { errors: { general: 'An unexpected error occurred. Please try again.' } },
      { status: 500 }
    )
  }
}
