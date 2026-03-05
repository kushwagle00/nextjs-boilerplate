'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, UserPlus, Mail, Phone, CreditCard, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface Customer {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  city: string
  state: string
  subscription_plan: string
  is_active: boolean
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [cancelReason, setCancelReason] = useState<'customer' | 'agent' | ''>('')
  const [canceling, setCanceling] = useState(false)

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setCustomers([])
      setSearched(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/customers/search?q=${encodeURIComponent(searchQuery.trim())}`)
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/')
          return
        }
        throw new Error('Search failed')
      }
      const data = await res.json()
      setCustomers(data.customers)
      setSearched(true)
    } catch {
      setError('Failed to search customers. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    handleSearch(query)
  }

  async function handleCancelSubscription() {
    if (!selectedCustomer || !cancelReason) return

    setCanceling(true)
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      })

      if (!res.ok) {
        toast.error('Failed to cancel subscription')
        return
      }

      toast.success('Subscription cancelled successfully')
      setCancelDialogOpen(false)
      setCancelReason('')
      setSelectedCustomer(null)
      
      // Update local state
      setCustomers(customers.map(c =>
        c.id === selectedCustomer.id ? { ...c, is_active: false } : c
      ))
    } catch (err) {
      console.error('[v0] Cancel error:', err)
      toast.error('An error occurred')
    } finally {
      setCanceling(false)
    }
  }

  const planNames: Record<string, string> = {
    phone_plan: 'Phone Plan',
    gadget_phone_plan: 'Gadget + Phone',
  }

  const planColors: Record<string, string> = {
    phone_plan: 'bg-primary/10 text-primary',
    gadget_phone_plan: 'bg-accent/10 text-accent',
  }

  function formatPhoneForDisplay(phone: string): string {
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) return phone
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
          Customer Search
        </h1>
        <p className="text-sm text-muted-foreground">
          Search by name, email, or phone number
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={loading || query.trim().length < 2}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </form>

      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      {searched && customers.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-sm font-medium text-foreground">No customers found</p>
              <p className="text-sm text-muted-foreground">
                {'Try a different search term or enroll a new customer'}
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/dashboard/enroll')}>
              <UserPlus className="h-4 w-4" />
              Enroll New Customer
            </Button>
          </CardContent>
        </Card>
      )}

      {customers.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {customers.length} customer{customers.length !== 1 ? 's' : ''} found
          </p>
          {customers.map((customer) => (
            <Card
              key={customer.id}
              className="transition-all hover:shadow-md"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => router.push(`/dashboard/customer/${customer.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        router.push(`/dashboard/customer/${customer.id}`)
                      }
                    }}
                  >
                    <CardTitle className="text-base">
                      {customer.first_name} {customer.last_name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {customer.city}, {customer.state}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={planColors[customer.subscription_plan] || ''}
                    >
                      {planNames[customer.subscription_plan] || customer.subscription_plan}
                    </Badge>
                    <Badge
                      variant={customer.is_active ? 'default' : 'destructive'}
                      className={customer.is_active ? 'bg-success text-success-foreground' : ''}
                    >
                      {customer.is_active ? 'Active' : 'Cancelled'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {customer.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {formatPhoneForDisplay(customer.phone)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" />
                    {'Enrolled '}
                    {new Date(customer.created_at).toLocaleDateString()}
                  </span>
                </div>
                {customer.is_active && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit text-destructive hover:text-destructive"
                    onClick={() => {
                      setSelectedCustomer(customer)
                      setCancelDialogOpen(true)
                      setCancelReason('')
                    }}
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Cancel Subscription
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!searched && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-sm font-medium text-foreground">
                Search for existing customers
              </p>
              <p className="text-sm text-muted-foreground">
                Enter at least 2 characters to search by name, email, or phone
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCustomer && (
                <div className="space-y-4 mt-4">
                  <p>
                    Are you sure you want to cancel the subscription for{' '}
                    <strong>{selectedCustomer.first_name} {selectedCustomer.last_name}</strong>?
                  </p>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Reason for cancellation:</label>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setCancelReason('customer')}
                        className={`w-full text-left px-3 py-2 rounded border-2 transition-colors ${
                          cancelReason === 'customer'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <div className="font-medium">Customer Initiated</div>
                        <div className="text-xs text-muted-foreground">Customer requested cancellation</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelReason('agent')}
                        className={`w-full text-left px-3 py-2 rounded border-2 transition-colors ${
                          cancelReason === 'agent'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <div className="font-medium">Agent Initiated</div>
                        <div className="text-xs text-muted-foreground">Agent initiated the cancellation</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={!cancelReason || canceling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {canceling ? 'Canceling...' : 'Cancel Subscription'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
