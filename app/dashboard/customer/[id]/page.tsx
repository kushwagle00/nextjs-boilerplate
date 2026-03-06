'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, User, MapPin, CreditCard, Calendar, Shield, Mail, Phone,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface Customer {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  zip_code: string
  subscription_plan: string
  card_last_four: string
  card_expiry: string
  is_active: boolean
  created_at: string
}

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetch(`/api/customers/${params.id}`)
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/')
            return
          }
          if (res.status === 404) {
            setError('Customer not found')
            return
          }
          throw new Error('Failed to fetch')
        }
        const data = await res.json()
        setCustomer(data.customer)
      } catch {
        setError('Failed to load customer details')
      } finally {
        setLoading(false)
      }
    }
    fetchCustomer()
  }, [params.id, router])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-destructive">{error || 'Customer not found'}</p>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Search
        </Button>
      </div>
    )
  }

  const planLabels: Record<string, string> = {
    phone_plan: 'Phone Plan',
    gadget_phone_plan: 'Gadget + Phone Plan',
  }

  const planPrices: Record<string, string> = {
    phone_plan: '$9.99/mo',
    gadget_phone_plan: '$19.99/mo',
  }

  function formatPhoneForDisplay(phone: string) {
    const digits = phone.replace(/\D/g, '').slice(0, 10)
    if (digits.length < 10) return phone   // incomplete input
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-1 flex-col gap-0.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
            {customer.first_name} {customer.last_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Customer ID: {customer.id}
          </p>
        </div>
        <Badge
          variant={customer.is_active ? 'default' : 'destructive'}
          className={customer.is_active ? 'bg-success text-success-foreground' : ''}
        >
          {customer.is_active ? 'Active' : 'Cancelled'}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <DetailField label="Full Name" value={`${customer.first_name} ${customer.last_name}`} />
            <DetailField label="Email" value={customer.email} icon={<Mail className="h-3.5 w-3.5" />} />
            <DetailField label="Phone" value={formatPhoneForDisplay(customer.phone)} icon={<Phone className="h-3.5 w-3.5" />} />
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <DetailField label="Street" value={customer.address_line1} />
            {customer.address_line2 && (
              <DetailField label="Line 2" value={customer.address_line2} />
            )}
            <DetailField label="City" value={customer.city} />
            <DetailField label="State" value={customer.state} />
            <DetailField label="ZIP Code" value={customer.zip_code} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <DetailField
              label="Plan"
              value={planLabels[customer.subscription_plan] || customer.subscription_plan}
            />
            <DetailField
              label="Price"
              value={planPrices[customer.subscription_plan] || 'N/A'}
            />
            <DetailField label="Status" value={customer.is_active ? 'Active' : 'Cancelled'} />
          </CardContent>
        </Card>

        {/* Payment - PCI DSS Compliant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-primary" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-muted-foreground">Card Number</span>
              <span className="text-sm font-mono text-foreground tracking-wider">
                {'**** **** **** '}{customer.card_last_four}
              </span>
            </div>
            <DetailField label="Expiration Date" value={customer.card_expiry} />
            <div className="mt-2 flex items-center gap-2 rounded-md bg-muted px-3 py-2">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                PCI DSS compliant - Only last 4 digits and expiration date are stored
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrollment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-primary" />
            Enrollment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <DetailField
              label="Enrolled On"
              value={new Date(customer.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DetailField({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 text-sm text-foreground">
        {icon}
        {value}
      </span>
    </div>
  )
}
