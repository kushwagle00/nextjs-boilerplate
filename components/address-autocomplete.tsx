'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface AddressSuggestion {
  place_id: number
  display_name: string
  address: {
    house_number?: string
    road?: string
    // City-level fields — Nominatim uses different keys depending on locality type
    city?: string
    town?: string
    village?: string
    suburb?: string
    hamlet?: string
    municipality?: string
    county?: string
    state_district?: string
    state?: string
    postcode?: string
    country?: string
    country_code?: string
  }
}

interface AddressResult {
  addressLine1: string
  city: string
  state: string
  zipCode: string
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  error,
  id,
}: {
  value: string
  onChange: (val: string) => void
  onSelect: (address: AddressResult) => void
  error?: string
  id?: string
}) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=us&limit=8&q=${encodeURIComponent(query)}`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data: AddressSuggestion[] = await res.json()
      // Filter to results that have at least a road or recognisable address structure
      const filtered = data.filter((d) => d.address.road || d.address.house_number || d.address.postcode)
      setSuggestions(filtered.length > 0 ? filtered : data.slice(0, 5))
      setShowSuggestions(data.length > 0)
      setActiveIndex(-1)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInputChange(val: string) {
    onChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 400)
  }

  function resolveAddressLine1(suggestion: AddressSuggestion): string {
    const addr = suggestion.address
    const houseNumber = addr.house_number?.trim() || ''
    const road = addr.road?.trim() || ''

    if (houseNumber && road) return `${houseNumber} ${road}`
    if (road) return road

    // Fall back: parse the display_name which is comma-separated
    // First segment is usually the street address for US results
    const parts = suggestion.display_name.split(',').map((p) => p.trim())
    if (parts.length >= 2) {
      const first = parts[0]
      // Skip if first part looks like a city/state (no digits)
      if (/\d/.test(first)) return first
    }
    return road
  }

  function resolveCity(suggestion: AddressSuggestion): string {
    const addr = suggestion.address
    // Nominatim uses different keys for city-level depending on US locality type
    return (
      addr.city ||
      addr.town ||
      addr.village ||
      addr.hamlet ||
      addr.municipality ||
      addr.suburb ||
      addr.county ||
      addr.state_district ||
      ''
    )
  }

  function handleSelect(suggestion: AddressSuggestion) {
    const addr = suggestion.address
    const line1 = resolveAddressLine1(suggestion)
    const city = resolveCity(suggestion)
    const state = addr.state || ''
    const zip = addr.postcode?.split('-')[0] || ''   // drop ZIP+4 extension

    onSelect({ addressLine1: line1, city, state, zipCode: zip })
    onChange(line1)
    setShowSuggestions(false)
    setSuggestions([])
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
          onKeyDown={handleKeyDown}
          placeholder="Start typing an address..."
          className="pl-9"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          aria-controls={showSuggestions ? `${id}-listbox` : undefined}
          role="combobox"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg"
        >
          {suggestions.map((suggestion, index) => {
            const previewCity = resolveCity(suggestion)
            const previewState = suggestion.address.state || ''
            const previewZip = suggestion.address.postcode?.split('-')[0] || ''
            const previewLine1 = resolveAddressLine1(suggestion)
            return (
              <li
                key={suggestion.place_id}
                role="option"
                aria-selected={index === activeIndex}
                className={`flex cursor-pointer items-start gap-2 px-3 py-2.5 text-sm transition-colors ${
                  index === activeIndex ? 'bg-accent/10 text-foreground' : 'text-foreground hover:bg-muted'
                }`}
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate font-medium">
                    {previewLine1 || suggestion.display_name.split(',')[0]}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {[previewCity, previewState, previewZip].filter(Boolean).join(', ')}
                  </span>
                </div>
              </li>
            )
          })}
          <li className="border-t px-3 py-1.5 text-[10px] text-muted-foreground">
            {'Powered by OpenStreetMap Nominatim'}
          </li>
        </ul>
      )}
    </div>
  )
}
