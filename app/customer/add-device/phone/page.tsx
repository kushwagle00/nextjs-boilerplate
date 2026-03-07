'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { type DevicePhoneFormData } from '@/lib/validations'

export default function AddPhonePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof DevicePhoneFormData, string>>>({})
  const [form, setForm] = useState<DevicePhoneFormData>({
    deviceName: '',
    imei: '',
    brand: '',
    model: '',
    color: '',
    purchaseDate: '',
  })
  const [, setTouched] = useState<Set<keyof DevicePhoneFormData>>(new Set())

  function handleFieldChange(field: keyof DevicePhoneFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setTouched(prev => new Set([...prev, field]))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function handleBlur(field: keyof DevicePhoneFormData) {
    setTouched(prev => new Set([...prev, field]))
    validateField(field)
  }

  function validateField(field: keyof DevicePhoneFormData) {
    const newErrors = { ...errors }
    const value = form[field]

    switch (field) {
      case 'deviceName':
        if (!value?.trim()) {
          newErrors.deviceName = 'Device name is required'
        } else if (value.length > 100) {
          newErrors.deviceName = 'Device name must be less than 100 characters'
        } else {
          delete newErrors.deviceName
        }
        break
      case 'imei':
        if (!value?.trim()) {
          newErrors.imei = 'IMEI is required'
        } else if (!/^\d{15}$/.test(value)) {
          newErrors.imei = 'IMEI must be exactly 15 digits'
        } else {
          delete newErrors.imei
        }
        break
      case 'brand':
        if (!value?.trim()) {
          newErrors.brand = 'Brand is required'
        } else if (value.length > 100) {
          newErrors.brand = 'Brand must be less than 100 characters'
        } else {
          delete newErrors.brand
        }
        break
      case 'model':
        if (!value?.trim()) {
          newErrors.model = 'Model is required'
        } else if (value.length > 100) {
          newErrors.model = 'Model must be less than 100 characters'
        } else {
          delete newErrors.model
        }
        break
      case 'color':
        if (!value?.trim()) {
          newErrors.color = 'Color is required'
        } else if (value.length > 50) {
          newErrors.color = 'Color must be less than 50 characters'
        } else {
          delete newErrors.color
        }
        break
      case 'purchaseDate':
        if (!value?.trim()) {
          newErrors.purchaseDate = 'Purchase date is required'
        } else {
          const date = new Date(value)
          if (date > new Date()) {
            newErrors.purchaseDate = 'Purchase date cannot be in the future'
          } else {
            delete newErrors.purchaseDate
          }
        }
        break
    }

    setErrors(newErrors)
  }

  function validateAllFields(): boolean {
    const newErrors: Partial<Record<keyof DevicePhoneFormData, string>> = {}

    // Check all fields
    const fields: (keyof DevicePhoneFormData)[] = ['deviceName', 'imei', 'brand', 'model', 'color', 'purchaseDate']
    
    for (const field of fields) {
      if (!form[field]?.trim()) {
        const fieldLabels: Record<keyof DevicePhoneFormData, string> = {
          deviceName: 'Device name',
          imei: 'IMEI',
          brand: 'Brand',
          model: 'Model',
          color: 'Color',
          purchaseDate: 'Purchase date',
        }
        newErrors[field] = `${fieldLabels[field]} is required`
      }
    }

    // Validate formats
    if (form.imei && !/^\d{15}$/.test(form.imei)) {
      newErrors.imei = 'IMEI must be exactly 15 digits'
    }

    if (form.purchaseDate && new Date(form.purchaseDate) > new Date()) {
      newErrors.purchaseDate = 'Purchase date cannot be in the future'
    }

    setErrors(newErrors)
    setTouched(new Set(fields))
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!validateAllFields()) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/devices/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.field && data.message) {
          setErrors(prev => ({ ...prev, [data.field]: data.message }))
        } else {
          toast.error(data.message || 'Failed to add device')
        }
        return
      }

      toast.success('Phone added successfully')
      router.push('/customer/devices')
      router.refresh()
    } catch (error) {
      console.error('[v0] Error adding phone:', error)
      toast.error('An error occurred while adding the phone')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="w-fit gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Add Phone
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your phone details to add it to your coverage
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Phone Information</CardTitle>
          <CardDescription>All fields are required</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="deviceName">Device Name *</Label>
                <Input
                  id="deviceName"
                  placeholder="e.g., My iPhone 15"
                  value={form.deviceName}
                  onChange={(e) => handleFieldChange('deviceName', e.target.value)}
                  onBlur={() => handleBlur('deviceName')}
                  aria-invalid={!!errors.deviceName}
                  aria-describedby={errors.deviceName ? 'deviceName-error' : undefined}
                  disabled={loading}
                />
                {errors.deviceName && (
                  <p id="deviceName-error" className="text-sm text-destructive">{errors.deviceName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="imei">IMEI (15 digits) *</Label>
                <Input
                  id="imei"
                  placeholder="e.g., 123456789012345"
                  value={form.imei}
                  onChange={(e) => handleFieldChange('imei', e.target.value.replace(/\D/g, '').slice(0, 15))}
                  onBlur={() => handleBlur('imei')}
                  maxLength={15}
                  aria-invalid={!!errors.imei}
                  aria-describedby={errors.imei ? 'imei-error' : undefined}
                  disabled={loading}
                />
                {errors.imei && (
                  <p id="imei-error" className="text-sm text-destructive">{errors.imei}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand *</Label>
                <Input
                  id="brand"
                  placeholder="e.g., Apple"
                  value={form.brand}
                  onChange={(e) => handleFieldChange('brand', e.target.value)}
                  onBlur={() => handleBlur('brand')}
                  aria-invalid={!!errors.brand}
                  aria-describedby={errors.brand ? 'brand-error' : undefined}
                  disabled={loading}
                />
                {errors.brand && (
                  <p id="brand-error" className="text-sm text-destructive">{errors.brand}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  placeholder="e.g., iPhone 15 Pro"
                  value={form.model}
                  onChange={(e) => handleFieldChange('model', e.target.value)}
                  onBlur={() => handleBlur('model')}
                  aria-invalid={!!errors.model}
                  aria-describedby={errors.model ? 'model-error' : undefined}
                  disabled={loading}
                />
                {errors.model && (
                  <p id="model-error" className="text-sm text-destructive">{errors.model}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color *</Label>
                <Input
                  id="color"
                  placeholder="e.g., Space Black"
                  value={form.color}
                  onChange={(e) => handleFieldChange('color', e.target.value)}
                  onBlur={() => handleBlur('color')}
                  aria-invalid={!!errors.color}
                  aria-describedby={errors.color ? 'color-error' : undefined}
                  disabled={loading}
                />
                {errors.color && (
                  <p id="color-error" className="text-sm text-destructive">{errors.color}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => handleFieldChange('purchaseDate', e.target.value)}
                  onBlur={() => handleBlur('purchaseDate')}
                  aria-invalid={!!errors.purchaseDate}
                  aria-describedby={errors.purchaseDate ? 'purchaseDate-error' : undefined}
                  disabled={loading}
                />
                {errors.purchaseDate && (
                  <p id="purchaseDate-error" className="text-sm text-destructive">{errors.purchaseDate}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Phone
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
