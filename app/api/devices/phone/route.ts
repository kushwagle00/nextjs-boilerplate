import { NextRequest } from 'next/server'
import { handleDevice } from '@/lib/device-route'

export async function POST(req: NextRequest) {
  return handleDevice(req, 'phone')
}
