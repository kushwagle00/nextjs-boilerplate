'use client'

import { Input } from '@/components/ui/input'

// Manual entry works offline and avoids sending customer addresses to a third-party geocoder.
export function AddressAutocomplete({ value, onChange, error, id }: {
  value: string
  onChange: (value: string) => void
  onSelect: (address: { addressLine1: string; city: string; state: string; zipCode: string }) => void
  error?: string
  id?: string
}) {
  return <Input id={id} value={value} onChange={e => onChange(e.target.value)}
    placeholder="Street address" autoComplete="address-line1"
    aria-invalid={!!error} aria-describedby={error ? id + '-error' : undefined} />
}
