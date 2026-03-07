'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { customerLoginSchema, type CustomerLoginFormData } from '@/lib/validations'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export function CustomerLoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<CustomerLoginFormData>({
    resolver: zodResolver(customerLoginSchema),
  })

  const onSubmit = async (data: CustomerLoginFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/customer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.field) {
          setError(result.field as any, { message: result.message })
        } else {
          toast.error(result.message || 'Login failed')
        }
        return
      }

      toast.success('Login successful')
      router.push('/customer/devices')
      router.refresh()
    } catch {
      toast.error('An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Customer Login</CardTitle>
        <CardDescription>Access your account and manage devices</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="customer@example.com"
              disabled={isLoading}
              aria-invalid={!!errors.email}
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="1234567890"
              disabled={isLoading}
              aria-invalid={!!errors.phone}
              maxLength={10}
              {...register('phone')}
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>

        <div className="mt-4 space-y-2 text-sm text-muted-foreground text-center">
          <p>Use the email and phone from your enrollment</p>
          <Link href="/" className="text-primary hover:underline">
            Back to Home
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
