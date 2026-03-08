import { test, expect, type APIRequestContext } from '@playwright/test'

const enrollment = (email: string, plan = 'phone_plan') => ({
  firstName: 'Taylor', lastName: 'Demo', email, phone: '2025550111',
  addressLine1: '123 Test Street', addressLine2: '', city: 'Chicago', state: 'IL', zipCode: '60601',
  subscriptionPlan: plan, cardNumber: '4242424242424242',
  cardExpiry: '12/' + String(new Date().getFullYear() + 2).slice(-2), cardCvv: '101', cardholderName: 'Taylor Demo',
})
async function agent(api: APIRequestContext) {
  expect((await api.post('/api/auth/agent-login', { data: { email: 'agent@example.com', password: 'DemoAgent123!' } })).status()).toBe(200)
}
const phone = { deviceName: 'Test Phone', brand: 'Apple', model: 'iPhone', color: 'Black', purchaseDate: '2020-01-01', imei: '123456789012345' }

test('authentication denies anonymous and forged access on every sensitive route', async ({ request }) => {
  const paths = ['/api/customers/search?q=Alex','/api/customers/1','/api/agent/customers/1/devices','/api/customer/profile','/api/customers/1/devices']
  for (const path of paths) expect((await request.get(path)).status(), path).toBe(401)
  for (const path of ['/api/customers/cancel','/api/customers/1/cancel','/api/customers/enroll','/api/devices/phone','/api/devices/gadget','/api/customers/1/devices'])
    expect((await request.post(path, { data: { id: 1, reason: 'agent' } })).status(), path).toBe(401)
  for (const path of ['/api/customers/1/devices/1','/api/agent/customers/1/devices/1/cancel'])
    expect((await request.delete(path)).status(), path).toBe(401)
  expect((await request.get('/api/customers/search?q=Alex', { headers: { Cookie: 'agent_session=1:anything' } })).status()).toBe(401)
  expect((await request.get('/api/customer/profile', { headers: { Cookie: 'customer_session=' + encodeURIComponent(JSON.stringify({ customerId: 1 })) } })).status()).toBe(401)
  expect((await request.post('/api/auth/agent-login', { data: { email: 'agent@example.com' } })).status()).toBe(400)
  expect((await request.post('/api/auth/agent-login', { data: { email: 'agent@example.com', password: 'incorrect' } })).status()).toBe(401)
  expect((await request.post('/api/auth/register', { data: {} })).status()).toBe(403)
  expect((await request.post('/api/auth/login', { data: '{', headers: { 'Content-Type': 'application/json' } })).status()).toBe(400)
})

test('enrollment, decline, duplicate, ownership, plan limits, cancellation, and logout', async ({ playwright }) => {
  const api = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:3100' })
  const customer = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:3100' })
  try {
    await agent(api)
    expect((await api.post('/api/customers/enroll', { data: { ...enrollment('decline@example.com'), cardCvv: '010' } })).status()).toBe(402)
    expect((await api.post('/api/customers/enroll', { data: { ...enrollment('realcard@example.com'), cardNumber: '5555555555554444' } })).status()).toBe(400)
    const res = await api.post('/api/customers/enroll', { data: enrollment('limits@example.com') })
    expect(res.status(), await res.text()).toBe(200)
    const { customerId } = await res.json()
    expect((await api.post('/api/customers/enroll', { data: enrollment('limits@example.com') })).status()).toBe(409)
    const duplicates = await Promise.all([api.post('/api/customers/enroll', { data: enrollment('race@example.com') }), api.post('/api/customers/enroll', { data: enrollment('race@example.com') })])
    expect(duplicates.map(r => r.status()).sort()).toEqual([200, 409])
    expect((await api.get('/api/customers/1bad')).status()).toBe(400)
    expect((await customer.post('/api/auth/customer-login', { data: { email: 'limits@example.com', phone: '(202) 555-0111' } })).status()).toBe(200)
    expect((await customer.get('/api/customers/999999/devices')).status()).toBe(403)
    expect((await customer.delete('/api/customers/' + customerId + '/devices/not-a-number')).status()).toBe(400)
    const gadget = { deviceType: 'laptop', deviceName: 'Laptop', brand: 'Apple', model: 'Mac', serialNumber: 'DEMO', color: 'Silver', purchaseDate: '2020-01-01' }
    expect((await customer.post('/api/devices/gadget', { data: gadget })).status()).toBe(403)
    expect((await customer.post('/api/customers/' + customerId + '/devices', { data: { ...gadget, type: 'laptop' } })).status()).toBe(403)
    expect((await customer.post('/api/devices/phone', { data: { ...phone, imei: 'bad' } })).status()).toBe(400)
    const added = await Promise.all([customer.post('/api/devices/phone', { data: phone }), customer.post('/api/customers/' + customerId + '/devices', { data: { ...phone, type: 'phone' } })])
    expect(added.map(r => r.status()).sort()).toEqual([201, 409])
    const profile = await (await customer.get('/api/customer/profile')).json()
    expect(profile.customer.devices).toHaveLength(1)
    const deviceId = profile.customer.devices[0].id
    expect((await api.delete('/api/agent/customers/' + customerId + '/devices/' + deviceId + '/cancel')).status()).toBe(200)
    expect((await customer.post('/api/devices/phone', { data: phone })).status()).toBe(201)
    expect((await api.post('/api/customers/' + customerId + '/cancel', { data: { reason: 'customer' } })).status()).toBe(200)
    expect((await customer.get('/api/customer/profile')).status()).toBe(401)
    expect((await customer.post('/api/devices/phone', { data: phone })).status()).toBe(401)
    expect((await customer.post('/api/auth/customer-login', { data: { email: 'limits@example.com', phone: '2025550111' } })).status()).toBe(403)
    expect((await api.post('/api/customers/999999/cancel', { data: { reason: 'agent' } })).status()).toBe(404)
    await api.post('/api/auth/logout')
    expect((await api.get('/api/customers/search?q=Taylor')).status()).toBe(401)
  } finally { await api.dispose(); await customer.dispose() }
})

test('desktop walkthrough enrolls a customer and adds a gadget through the UI', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/auth/agent')
  await page.getByLabel('Email', { exact: true }).fill('agent@example.com')
  await page.getByLabel('Password', { exact: true }).fill('DemoAgent123!')
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.getByRole('button', { name: 'Enroll Customer', exact: true }).first().click()
  for (const [id, value] of Object.entries({ firstName: 'Jordan', lastName: 'Demo', email: 'walkthrough@example.com', phone: '2025550123' }))
    await page.locator('#' + id).fill(value)
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  for (const [id, value] of Object.entries({ addressLine1: '123 Test Street', city: 'Chicago', state: 'IL', zipCode: '60601' }))
    await page.locator('#' + id).fill(value)
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: /Gadget \+ Phone Plan/ }).click()
  for (const [id, value] of Object.entries({ cardholderName: 'Jordan Demo', cardNumber: '4242424242424242', cardExpiry: enrollment('').cardExpiry, cardCvv: '101' }))
    await page.locator('#' + id).fill(value)
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: 'Submit Enrollment' }).click()
  await expect(page).toHaveURL(/\/dashboard\/customer\/\d+/)
  await expect(page.getByText('Jordan Demo', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.goto('/auth/customer')
  await page.getByLabel('Email Address').fill('walkthrough@example.com')
  await page.getByLabel('Phone Number').fill('2025550123')
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page).toHaveURL(/\/customer\/devices$/)
  await page.getByRole('button', { name: 'Add Gadget' }).click()
  await page.getByRole('combobox').click()
  await page.getByRole('option', { name: 'Laptop', exact: true }).click()
  for (const [id, value] of Object.entries({ deviceName: 'Demo Laptop', brand: 'Apple', model: 'MacBook', serialNumber: 'DEMO-LAPTOP-1', color: 'Silver', purchaseDate: '2020-01-01' }))
    await page.locator('#' + id).fill(value)
  await page.getByRole('button', { name: /Add Gadget/ }).click()
  await expect(page).toHaveURL(/\/customer\/devices$/)
  await expect(page.getByText('Demo Laptop', { exact: true })).toBeVisible()
  await page.screenshot({ path: 'test-results/desktop-devices.png', fullPage: true })
  expect(errors).toEqual([])
})

test('mobile landing and sign-in render without horizontal overflow or runtime errors', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Device Protection Portal' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/mobile-home.png', fullPage: true })
  await page.getByRole('button', { name: 'Agent Portal', exact: false }).first().click()
  await expect(page.getByLabel('Password')).toBeVisible()
  expect(errors).toEqual([])
})

