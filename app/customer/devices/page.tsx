'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Smartphone, Tablet, Laptop, Headphones, Watch, Camera, Volume2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

interface Customer {
  id: number
  first_name: string
  subscription_plan: string
  devices: Device[]
}

const deviceIcons: Record<string, React.ReactNode> = {
  phone: <Smartphone className="h-5 w-5" />,
  laptop: <Laptop className="h-5 w-5" />,
  tablet: <Tablet className="h-5 w-5" />,
  watch: <Watch className="h-5 w-5" />,
  headphones: <Headphones className="h-5 w-5" />,
  camera: <Camera className="h-5 w-5" />,
  speaker: <Volume2 className="h-5 w-5" />,
}

export default function CustomerDevicesPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetch('/api/customer/profile')
        if (res.status === 401) {
          router.push('/auth/customer')
          return
        }
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setCustomer(data.customer)
      } catch (err) {
        console.error('[v0] Error fetching customer:', err)
        setError('Failed to load your profile')
      } finally {
        setLoading(false)
      }
    }
    fetchCustomer()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading your devices...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 px-4 py-3 text-destructive">
        {error}
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="rounded-md bg-destructive/10 px-4 py-3 text-destructive">
        Customer information not found
      </div>
    )
  }

  const canAddPhones = customer.subscription_plan !== 'phone_plan' || !customer.devices.some(d => d.device_type === 'phone')
  const canAddGadgets = customer.subscription_plan === 'gadget_phone_plan'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
          My Devices
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your protected devices ({customer.devices?.length || 0} total)
        </p>
      </div>

      {/* Plan Info Card */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Your Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Plan:</span>{' '}
              <Badge className="ml-2">
                {customer.subscription_plan === 'phone_plan' ? 'Phone Plan' : 'Gadget + Phone Plan'}
              </Badge>
            </p>
            <p className="text-sm text-muted-foreground">
              {customer.subscription_plan === 'phone_plan'
                ? 'Your plan includes one phone'
                : 'You can add phones and gadgets to your coverage'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add Device Buttons */}
      <div className="flex flex-col gap-2 sm:flex-row">
        {canAddPhones && (
          <Button
            onClick={() => router.push('/customer/add-device/phone')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Phone
          </Button>
        )}
        {canAddGadgets && (
          <Button
            onClick={() => router.push('/customer/add-device/gadget')}
            variant="outline"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Gadget
          </Button>
        )}
      </div>

      {/* Devices List */}
      {!customer.devices || customer.devices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Smartphone className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No devices added yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first device to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customer.devices.map((device) => (
            <Card key={device.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {deviceIcons[device.device_type] || deviceIcons.phone}
                    </div>
                    <div>
                      <CardTitle className="text-base">{device.device_name}</CardTitle>
                      <CardDescription className="text-xs">
                        {device.brand} {device.model}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1 text-sm">
                  {device.imei && (
                    <p>
                      <span className="text-muted-foreground">IMEI:</span>{' '}
                      <span className="font-mono">{device.imei}</span>
                    </p>
                  )}
                  {device.serial_number && (
                    <p>
                      <span className="text-muted-foreground">S/N:</span>{' '}
                      <span className="font-mono">{device.serial_number}</span>
                    </p>
                  )}
                  {device.color && (
                    <p>
                      <span className="text-muted-foreground">Color:</span> {device.color}
                    </p>
                  )}
                  <p>
                    <span className="text-muted-foreground">Purchase Date:</span>{' '}
                    {device.purchased_date
                      ? new Date(String(device.purchased_date).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                      : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
