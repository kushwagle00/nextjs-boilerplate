/** @jest-environment node */
import { NextRequest } from 'next/server'
import { POST as enroll } from '@/app/api/customers/enroll/route'
import { POST as customerLogin } from '@/app/api/auth/customer-login/route'

jest.mock('@/lib/session', () => ({
  getAgentSession: jest.fn(async () => ({ agentId: 1, email: 'agent@example.com', fullName: 'Agent' })),
  setSession: jest.fn(),
}))
jest.mock('@/lib/db', () => ({ getDb: () => jest.fn(() => { throw new Error('Database should not be accessed') }) }))

test('simulated enrollment and phone-based customer login fail closed outside demo mode', async () => {
  const previous = process.env.DEMO_MODE
  delete process.env.DEMO_MODE
  try {
    const request = () => new NextRequest('http://localhost/api', { method: 'POST', body: '{}' })
    expect((await enroll(request())).status).toBe(503)
    expect((await customerLogin(request())).status).toBe(503)
  } finally {
    if (previous === undefined) delete process.env.DEMO_MODE
    else process.env.DEMO_MODE = previous
  }
})

