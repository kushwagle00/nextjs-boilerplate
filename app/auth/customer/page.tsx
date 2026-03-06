'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Smartphone, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function CustomerAuthPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    const newErrors: Record<string, string> = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (phone.replace(/\D/g, '').length !== 10) {
      newErrors.phone = 'Please enter a valid 10-digit phone number'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/customer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.errors) {
          setErrors(result.errors)
        } else {
          setErrors({ general: result.message || 'Login failed' })
        }
        return
      }

      toast.success('Logged in successfully')
      router.push('/customer/devices')
    } catch (error) {
      console.error('[v0] Customer auth error:', error)
      setErrors({ general: 'An error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/')}
          className="self-start"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-col items-center gap-2 text-center w-full">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
            <Smartphone className="h-6 w-6 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
            Customer Portal
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Access your devices and coverage
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and phone number to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {errors.general && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                  {errors.general}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="customer-email">Email Address</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) {
                      const newErrors = { ...errors }
                      delete newErrors.email
                      setErrors(newErrors)
                    }
                  }}
                  placeholder="your@email.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'customer-email-error' : undefined}
                />
                {errors.email && (
                  <p id="customer-email-error" className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="customer-phone">Phone Number</Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(formatPhone(e.target.value))
                    if (errors.phone) {
                      const newErrors = { ...errors }
                      delete newErrors.phone
                      setErrors(newErrors)
                    }
                  }}
                  placeholder="(555) 123-4567"
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'customer-phone-error' : 'customer-phone-hint'}
                />
                <p id="customer-phone-hint" className="text-xs text-muted-foreground">
                  Use the phone number you enrolled with
                </p>
                {errors.phone && (
                  <p id="customer-phone-error" className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              <Button type="submit" disabled={loading} className="mt-2 w-full">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
