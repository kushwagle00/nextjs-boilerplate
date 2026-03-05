'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function AgentAuthPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [email, setEmail] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    // Validate email is provided
    if (!email.trim()) {
      setErrors({ email: 'Email is required' })
      setLoading(false)
      return
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Please enter a valid email address' })
      setLoading(false)
      return
    }

    try {
      // Mock login - allow any valid email
      const response = await fetch('/api/auth/agent-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const result = await response.json()
        setErrors(result.errors || { general: 'Login failed' })
        return
      }

      toast.success(`Logged in as agent (${email})`)
      router.push('/dashboard')
    } catch (error) {
      console.error('[v0] Agent auth error:', error)
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
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
            Agent Portal
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Sign in to manage customer enrollments and subscriptions
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Enter your email to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {errors.general && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                  {errors.general}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="agent-email">Email</Label>
                <Input
                  id="agent-email"
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
                  placeholder="agent@company.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'agent-email-error' : undefined}
                />
                {errors.email && (
                  <p id="agent-email-error" className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <Button type="submit" disabled={loading} className="mt-2 w-full">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Use any valid email address to sign in as an agent
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
