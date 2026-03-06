import { NextRequest, NextResponse } from 'next/server'
import { getCustomerSession } from './session'
import { addDevice } from './devices'

export async function handleDevice(req: NextRequest, type: 'phone' | 'gadget', expectedId?: number) {
  const session = await getCustomerSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized', error: 'Unauthorized' }, { status: 401 })
  if (expectedId !== undefined && expectedId !== session.customerId)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  const result = await addDevice(session.customerId, { ...body, type: type === 'phone' ? 'phone' : body.deviceType ?? body.type })
  if ('errors' in result && result.errors) {
    const [field, message] = Object.entries(result.errors)[0]
    return NextResponse.json({ errors: result.errors, field, message }, { status: result.status })
  }
  return NextResponse.json({ success: true, deviceId: result.deviceId, message: 'Device added successfully' }, { status: result.status })
}

