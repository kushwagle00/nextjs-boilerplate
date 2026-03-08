import { deviceSchema, enrollmentSchema } from '@/lib/validations'

const enrollment = {
  firstName: 'Alex', lastName: 'Demo', email: 'alex@example.com', phone: '2025550100',
  addressLine1: '123 Test Street', city: 'Chicago', state: 'IL', zipCode: '60601',
  subscriptionPlan: 'phone_plan', cardNumber: '4242424242424242', cardCvv: '101', cardholderName: 'Alex Demo',
}
test('card remains valid through the end of the expiry month', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-11-20T12:00:00Z'))
  try {
    expect(enrollmentSchema.safeParse({ ...enrollment, cardExpiry: '11/26' }).success).toBe(true)
    expect(enrollmentSchema.safeParse({ ...enrollment, cardExpiry: '10/26' }).success).toBe(false)
  } finally { jest.useRealTimers() }
})
test('all device endpoints share strict identifiers and calendar dates', () => {
  const device = { type: 'phone', deviceName: 'Phone', brand: 'Apple', model: 'Test', color: 'Black', purchaseDate: '2020-01-01' }
  expect(deviceSchema.safeParse(device).success).toBe(false)
  expect(deviceSchema.safeParse({ ...device, imei: '123456789012345' }).success).toBe(true)
  expect(deviceSchema.safeParse({ ...device, imei: '123456789012345', purchaseDate: '2025-02-30' }).success).toBe(false)
  expect(deviceSchema.safeParse({ ...device, type: 'laptop' }).success).toBe(false)
  expect(deviceSchema.safeParse({ ...device, type: 'laptop', serialNumber: 'DEMO-123' }).success).toBe(true)
})

