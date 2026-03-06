'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, User, MapPin, CreditCard, Calendar, Shield, Mail, Phone,
  Smartphone, Tablet, Laptop, Speaker, Trash2, AlertTriangle, Package,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
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
  address_line1: string
  address_line2?: string
  city: string
  state: string
  zip_code: string
  subscription_plan: string
  subscription_price?: number
  subscription_status: string
  plan_sku?: string
  card_last_four: string
  card_expiry: string
  created_at: string
}

interface Device {
  id: number
  device_type: string
  device_name: string
  brand: string
  model: string
  imei?: string
  serial_number?: string
  color?: string
  purchased_date?: string
  created_at: string
}

const deviceTypeIcons: Record<string, React.ReactNode> = {
  phone: <Smartphone className="h-4 w-4" />,
  tablet: <Tablet className="h-4 w-4" />,
  laptop: <Laptop className="h-4 w-4" />,
  smartwatch: <Smartphone className="h-4 w-4" />,
  speaker: <Speaker className="h-4 w-4" />,
}

const deviceTypeLabels: Record<string, string> = {
  phone: 'Phone',
  tablet: 'Tablet',
  laptop: 'Laptop',
  smartwatch: 'Smartwatch',
  speaker: 'Speaker',
}

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [devicesLoading, setDevicesLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelDeviceDialog, setCancelDeviceDialog] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [cancelingDevice, setCancelingDevice] = useState(false)

  const enrolledParamCleaned = useRef(false)

  // Clean up the ?enrolled=1 param silently (no toast needed - the page itself is the confirmation)
  useEffect(() => {
    if (searchParams.get('enrolled') === '1' && !enrolledParamCleaned.current) {
      enrolledParamCleaned.current = true
      router.replace(`/dashboard/customer/${params.id}`, { scroll: false })
    }
  }, [searchParams, params.id, router])

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetch(`/api/customers/${params.id}`)
        if (!res.ok) {
          if (res.status === 401) { router.push('/'); return }
          if (res.status === 404) { setError('Customer not found'); return }
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

    async function fetchDevices() {
      try {
        const res = await fetch(`/api/agent/customers/${params.id}/devices`)
        if (!res.ok) return
        const data = await res.json()
        setDevices(data.devices || [])
      } catch {
        // non-fatal
      } finally {
        setDevicesLoading(false)
      }
    }

    fetchCustomer()
    fetchDevices()
  }, [params.id, router])

  async function handleCancelDevice() {
    if (!selectedDevice || !customer) return
    setCancelingDevice(true)
    try {
      const res = await fetch(
        `/api/agent/customers/${customer.id}/devices/${selectedDevice.id}/cancel`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        toast.error('Failed to remove device')
        return
      }
      setDevices((prev) => prev.filter((d) => d.id !== selectedDevice.id))
      toast.success(`${selectedDevice.device_name} removed successfully`)
      setCancelDeviceDialog(false)
      setSelectedDevice(null)
    } catch {
      toast.error('An error occurred')
    } finally {
      setCancelingDevice(false)
    }
  }

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
    if (digits.length < 10) return phone
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  // Group devices by type for summary
  const deviceSummary = devices.reduce<Record<string, number>>((acc, d) => {
    acc[d.device_type] = (acc[d.device_type] || 0) + 1
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-1 flex-col gap-0.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {customer.first_name} {customer.last_name}
            </h1>
            <p className="text-xs text-muted-foreground">Customer ID: {customer.id}</p>
          </div>
        </div>
        <Badge
          variant={customer.subscription_status === 'active' ? 'default' : 'destructive'}
          className={customer.subscription_status === 'active' ? 'bg-success text-success-foreground' : ''}
        >
          {customer.subscription_status === 'active' ? 'Active' : 'Cancelled'}
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
            {customer.address_line2 && <DetailField label="Line 2" value={customer.address_line2} />}
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
            <DetailField label="Plan" value={planLabels[customer.subscription_plan] || customer.subscription_plan} />
            {customer.plan_sku && <DetailField label="Plan SKU" value={customer.plan_sku} />}
            <DetailField label="Price" value={planPrices[customer.subscription_plan] || 'N/A'} />
            <DetailField label="Status" value={customer.subscription_status === 'active' ? 'Active' : 'Cancelled'} />
          </CardContent>
        </Card>

        {/* Payment */}
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
            <div className="mt-1 flex items-center gap-2 rounded-md bg-muted px-3 py-2">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                PCI DSS compliant — last 4 digits and expiry only
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Devices */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Enrolled Devices</CardTitle>
                {devices.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{devices.length}</Badge>
                )}
              </div>
            </div>
            {devices.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(deviceSummary).map(([type, count]) => (
                  <span
                    key={type}
                    className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {deviceTypeIcons[type] ?? <Smartphone className="h-3 w-3" />}
                    {count} {deviceTypeLabels[type] ?? type}{count > 1 ? 's' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {devicesLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : devices.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Package className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No devices enrolled yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {deviceTypeIcons[device.device_type] ?? <Smartphone className="h-4 w-4" />}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{device.device_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {deviceTypeLabels[device.device_type] ?? device.device_type}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {device.brand} {device.model}
                        {device.color ? ` · ${device.color}` : ''}
                        {device.imei ? ` · IMEI: ****${device.imei.slice(-4)}` : ''}
                        {device.serial_number ? ` · S/N: ****${device.serial_number.slice(-4)}` : ''}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setSelectedDevice(device)
                      setCancelDeviceDialog(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove device</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrollment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-primary" />
            Enrollment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DetailField
            label="Enrolled On"
            value={new Date(customer.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          />
        </CardContent>
      </Card>

      {/* Cancel Device Dialog */}
      <AlertDialog open={cancelDeviceDialog} onOpenChange={setCancelDeviceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remove Device
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-3 mt-1">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to remove{' '}
                  <strong className="text-foreground">{selectedDevice?.device_name}</strong>{' '}
                  ({selectedDevice?.brand} {selectedDevice?.model}) from this customer's account?
                  This action cannot be undone.
                </p>
                {selectedDevice?.imei && (
                  <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground font-mono">
                    IMEI: ****{selectedDevice.imei.slice(-4)}
                  </div>
                )}
                {selectedDevice?.serial_number && (
                  <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground font-mono">
                    S/N: ****{selectedDevice.serial_number.slice(-4)}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end pt-2">
            <AlertDialogCancel disabled={cancelingDevice}>Keep Device</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleCancelDevice}
              disabled={cancelingDevice}
            >
              {cancelingDevice ? 'Removing...' : 'Remove Device'}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
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
