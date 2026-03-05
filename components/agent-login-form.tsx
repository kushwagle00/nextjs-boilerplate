'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function AgentLoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    if (!email.trim()) {
      setErrors({ email: 'Email is required' })
      setIsLoading(false)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Please enter a valid email address' })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/agent-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok) {
        setErrors(result.errors || { general: 'Login failed' })
        return
      }

      toast.success(`Logged in as agent (${email})`)
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      toast.error('An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Agent Portal</CardTitle>
        <CardDescription>Enter your email to access the agent dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {errors.general && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.general}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="agent@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) {
                  const newErrors = { ...errors }
                  delete newErrors.email
                  setErrors(newErrors)
                }
              }}
              disabled={isLoading}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Sign In
          </Button>
        </form>

        <div className="mt-4 text-sm text-muted-foreground text-center">
          <p>Use any valid email address to sign in</p>
        </div>
      </CardContent>
    </Card>
  )
}
