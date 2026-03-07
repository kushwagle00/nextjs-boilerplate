'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, MapPin, CreditCard, CheckCircle2, ArrowRight, ArrowLeft, Lock,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AddressAutocomplete } from '@/components/address-autocomplete'
import { enrollmentSchema } from '@/lib/validations'

const STEPS = [
  { label: 'Personal Info', icon: User },
  { label: 'Address', icon: MapPin },
  { label: 'Subscription & Payment', icon: CreditCard },
  { label: 'Review & Submit', icon: CheckCircle2 },
]

const PLANS = [
  {
    id: 'phone_plan',
    name: 'Phone Plan',
    price: '$9.99/mo',
    features: ['Protect your phone', 'Device coverage', 'Add 1 phone device'],
  },
  {
    id: 'gadget_phone_plan',
    name: 'Gadget + Phone Plan',
    price: '$19.99/mo',
    features: ['Phone + gadgets', 'Multi-device coverage', 'Add multiple devices'],
  },
]

type FormData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
  subscriptionPlan: string
  cardNumber: string
  cardExpiry: string
  cardCvv: string
  cardholderName: string
}

export default function EnrollPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    subscriptionPlan: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardholderName: '',
  })

  function updateField(field: keyof FormData, value: string) {
    // ensure phone always stays formatted
    if (field === 'phone') {
      value = formatPhone(value)
    }

    setForm((prev) => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  function formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    if (digits.length <= 2) return digits
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  function validateStep(): boolean {
    const newErrors: Record<string, string> = {}

    if (step === 0) {
      if (!form.firstName.trim()) newErrors.firstName = 'First name is required'
      else if (!/^[a-zA-Z\s'-]+$/.test(form.firstName)) newErrors.firstName = 'First name contains invalid characters'
      if (!form.lastName.trim()) newErrors.lastName = 'Last name is required'
      else if (!/^[a-zA-Z\s'-]+$/.test(form.lastName)) newErrors.lastName = 'Last name contains invalid characters'
      if (!form.email.trim()) newErrors.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Please enter a valid email address'
      if (!form.phone.trim()) newErrors.phone = 'Phone number is required'
      else if (form.phone.replace(/\D/g, '').length !== 10)
        newErrors.phone = 'Phone number must be exactly 10 digits'
    }

    if (step === 1) {
      if (!form.addressLine1.trim()) newErrors.addressLine1 = 'Street address is required'
      if (!form.city.trim()) newErrors.city = 'City is required'
      if (!form.state.trim()) newErrors.state = 'State is required'
      if (!form.zipCode.trim()) newErrors.zipCode = 'ZIP code is required'
      else if (!/^\d{5}(-\d{4})?$/.test(form.zipCode)) newErrors.zipCode = 'Please enter a valid ZIP code (e.g., 12345)'
    }

    if (step === 2) {
      if (!form.subscriptionPlan) newErrors.subscriptionPlan = 'Please select a subscription plan'
      if (!form.cardholderName.trim()) newErrors.cardholderName = 'Cardholder name is required'
      if (!form.cardNumber.trim()) newErrors.cardNumber = 'Card number is required'
      else if (!/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(form.cardNumber))
        newErrors.cardNumber = 'Please enter a valid 16-digit card number'
      if (!form.cardExpiry.trim()) newErrors.cardExpiry = 'Expiration date is required'
      else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.cardExpiry))
        newErrors.cardExpiry = 'Please enter a valid expiration date (MM/YY)'
      else {
        const [month, year] = form.cardExpiry.split('/')
        const expiry = new Date(2000 + parseInt(year), parseInt(month))
        if (expiry <= new Date()) newErrors.cardExpiry = 'Card has expired'
      }
      if (!form.cardCvv.trim()) newErrors.cardCvv = 'CVV is required'
      else if (!/^\d{3,4}$/.test(form.cardCvv)) newErrors.cardCvv = 'CVV must be 3 or 4 digits'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleNext() {
    if (validateStep()) {
      setStep((prev) => Math.min(prev + 1, STEPS.length - 1))
    }
  }

  function handleBack() {
    setStep((prev) => Math.max(prev - 1, 0))
  }

  async function handleSubmit() {
    setLoading(true)
    setErrors({})

    const parsed = enrollmentSchema.safeParse(form)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        if (!fieldErrors[field]) fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      setLoading(false)
      const errorFields = Object.keys(fieldErrors)
      if (errorFields.some((f) => ['firstName', 'lastName', 'email', 'phone'].includes(f))) setStep(0)
      else if (errorFields.some((f) => ['addressLine1', 'city', 'state', 'zipCode'].includes(f))) setStep(1)
      else setStep(2)
      return
    }

    try {
      const res = await fetch('/api/customers/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const result = await res.json()

      if (!res.ok) {
        if (result.errors) {
          setErrors(result.errors)
          if (result.errors.cardNumber || result.errors.cardCvv || result.errors.cardExpiry) {
            setStep(2)
          }
        }
        if (res.status === 402) {
          toast.error('Payment declined. Please check your card details.')
        }
        setLoading(false)
        return
      }

      router.push(`/dashboard/customer/${result.customerId}?enrolled=1`)
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push('/dashboard')}
          aria-label="Back to search"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
            Enroll New Customer
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete all steps to enroll a new customer
          </p>
        </div>
      </div>

      {/* Stepper */}
      <nav aria-label="Enrollment steps" className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const isComplete = i < step
          const isActive = i === step
          return (
            <div key={s.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full items-center">
                {i > 0 && (
                  <div
                    className={`h-0.5 flex-1 ${isComplete ? 'bg-primary' : 'bg-border'}`}
                  />
                )}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors ${isComplete
                      ? 'bg-primary text-primary-foreground'
                      : isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <s.icon className="h-4 w-4" />
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${isComplete ? 'bg-primary' : 'bg-border'}`}
                  />
                )}
              </div>
              <span
                className={`hidden text-[10px] font-medium sm:block ${isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </nav>

      {/* Step 0: Personal Info */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Enter the customer{"'"}s personal details</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  placeholder="John"
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                />
                {errors.firstName && (
                  <p id="firstName-error" className="text-sm text-destructive">{errors.firstName}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  placeholder="Doe"
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                />
                {errors.lastName && (
                  <p id="lastName-error" className="text-sm text-destructive">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="customer@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', formatPhone(e.target.value))}
                placeholder="(555) 123-4567"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
              />
              {errors.phone && (
                <p id="phone-error" className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Address */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Address Information</CardTitle>
            <CardDescription>
              Start typing to auto-populate the address using OpenStreetMap
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="addressLine1">Street Address</Label>
              <AddressAutocomplete
                id="addressLine1"
                value={form.addressLine1}
                onChange={(val) => updateField('addressLine1', val)}
                onSelect={(addr) => {
                  updateField('addressLine1', addr.addressLine1)
                  updateField('city', addr.city)
                  updateField('state', addr.state)
                  updateField('zipCode', addr.zipCode)
                }}
                error={errors.addressLine1}
              />
              {errors.addressLine1 && (
                <p id="addressLine1-error" className="text-sm text-destructive">{errors.addressLine1}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
              <Input
                id="addressLine2"
                value={form.addressLine2}
                onChange={(e) => updateField('addressLine2', e.target.value)}
                placeholder="Apt, Suite, Unit, etc."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="New York"
                  aria-invalid={!!errors.city}
                  aria-describedby={errors.city ? 'city-error' : undefined}
                />
                {errors.city && (
                  <p id="city-error" className="text-sm text-destructive">{errors.city}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={form.state}
                  onChange={(e) => updateField('state', e.target.value)}
                  placeholder="NY"
                  aria-invalid={!!errors.state}
                  aria-describedby={errors.state ? 'state-error' : undefined}
                />
                {errors.state && (
                  <p id="state-error" className="text-sm text-destructive">{errors.state}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={form.zipCode}
                  onChange={(e) => updateField('zipCode', e.target.value)}
                  placeholder="10001"
                  aria-invalid={!!errors.zipCode}
                  aria-describedby={errors.zipCode ? 'zipCode-error' : undefined}
                />
                {errors.zipCode && (
                  <p id="zipCode-error" className="text-sm text-destructive">{errors.zipCode}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Subscription & Payment */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>Select a plan for the customer</CardDescription>
            </CardHeader>
            <CardContent>
              {errors.subscriptionPlan && (
                <p className="mb-3 text-sm text-destructive">{errors.subscriptionPlan}</p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => updateField('subscriptionPlan', plan.id)}
                    className={`flex flex-col gap-2 rounded-lg border-2 p-4 text-left transition-colors ${form.subscriptionPlan === plan.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/30'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                      <div
                        className={`h-4 w-4 rounded-full border-2 ${form.subscriptionPlan === plan.id
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/30'
                          }`}
                      >
                        {form.subscriptionPlan === plan.id && (
                          <div className="flex h-full w-full items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-lg font-bold text-foreground">{plan.price}</span>
                    <ul className="flex flex-col gap-1">
                      {plan.features.map((f) => (
                        <li key={f} className="text-xs text-muted-foreground">
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Payment Details</CardTitle>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>
                Demo payments only. Use test card 4242 4242 4242 4242 with a future expiry. Never enter real payment details.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {errors.general && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                  {errors.general}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  value={form.cardholderName}
                  onChange={(e) => updateField('cardholderName', e.target.value)}
                  placeholder="John Doe"
                  aria-invalid={!!errors.cardholderName}
                  aria-describedby={errors.cardholderName ? 'cardholderName-error' : undefined}
                />
                {errors.cardholderName && (
                  <p id="cardholderName-error" className="text-sm text-destructive">{errors.cardholderName}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="cardNumber"
                    value={form.cardNumber}
                    onChange={(e) => updateField('cardNumber', formatCardNumber(e.target.value))}
                    placeholder="•••• •••• •••• ••••"
                    className="pl-9"
                    maxLength={19}
                    autoComplete="off"
                    aria-invalid={!!errors.cardNumber}
                    aria-describedby={errors.cardNumber ? 'cardNumber-error' : undefined}
                  />
                </div>
                {errors.cardNumber && (
                  <p id="cardNumber-error" className="text-sm text-destructive">{errors.cardNumber}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cardExpiry">Expiration Date</Label>
                  <Input
                    id="cardExpiry"
                    value={form.cardExpiry}
                    onChange={(e) => updateField('cardExpiry', formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    autoComplete="off"
                    aria-invalid={!!errors.cardExpiry}
                    aria-describedby={errors.cardExpiry ? 'cardExpiry-error' : undefined}
                  />
                  {errors.cardExpiry && (
                    <p id="cardExpiry-error" className="text-sm text-destructive">{errors.cardExpiry}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cardCvv">CVV</Label>
                  <Input
                    id="cardCvv"
                    type="password"
                    value={form.cardCvv}
                    onChange={(e) => updateField('cardCvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    maxLength={4}
                    autoComplete="off"
                    aria-invalid={!!errors.cardCvv}
                    aria-describedby={errors.cardCvv ? 'cardCvv-error' : undefined}
                  />
                  {errors.cardCvv && (
                    <p id="cardCvv-error" className="text-sm text-destructive">{errors.cardCvv}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  No payment is charged. CVV 101 approves the demo; CVV 010 declines it.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Enrollment</CardTitle>
            <CardDescription>Please verify all details before submitting</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <ReviewField label="First Name" value={form.firstName} />
                <ReviewField label="Last Name" value={form.lastName} />
                <ReviewField label="Email" value={form.email} />
                <ReviewField label="Phone" value={form.phone} />
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground">Address</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <ReviewField label="Street Address" value={form.addressLine1} />
                {form.addressLine2 && (
                  <ReviewField label="Address Line 2" value={form.addressLine2} />
                )}
                <ReviewField label="City" value={form.city} />
                <ReviewField label="State" value={form.state} />
                <ReviewField label="ZIP Code" value={form.zipCode} />
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground">Subscription & Payment</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <ReviewField
                  label="Plan"
                  value={PLANS.find((p) => p.id === form.subscriptionPlan)?.name || ''}
                />
                <ReviewField
                  label="Price"
                  value={PLANS.find((p) => p.id === form.subscriptionPlan)?.price || ''}
                />
                <ReviewField label="Cardholder" value={form.cardholderName} />
                <ReviewField
                  label="Card Number"
                  value={`**** **** **** ${form.cardNumber.replace(/\s/g, '').slice(-4)}`}
                />
                <ReviewField label="Expiration" value={form.cardExpiry} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 0}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={handleNext} className="gap-2">
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⟳</span>
                Processing...
              </>
            ) : (
              <>
                Submit Enrollment
                <CheckCircle2 className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  )
}
