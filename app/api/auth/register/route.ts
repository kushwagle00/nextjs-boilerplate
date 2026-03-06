import { NextResponse } from 'next/server'
export async function POST() {
  return NextResponse.json({ errors: { general: 'Agent accounts are provisioned by an administrator' } }, { status: 403 })
}
