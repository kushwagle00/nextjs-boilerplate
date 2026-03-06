/**
 * Form Validation Tests
 * 
 * Tests for form field validation logic used across the application.
 */

describe('Form Validation Utilities', () => {
  describe('Phone Formatting', () => {
    const formatPhone = (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, 10)
      if (digits.length <= 3) return digits
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    }

    it('should format partial phone numbers correctly', () => {
      expect(formatPhone('5')).toBe('5')
      expect(formatPhone('55')).toBe('55')
      expect(formatPhone('555')).toBe('555')
    })

    it('should format phone with area code', () => {
      expect(formatPhone('5551')).toBe('(555) 1')
      expect(formatPhone('55512')).toBe('(555) 12')
      expect(formatPhone('555123')).toBe('(555) 123')
    })

    it('should format complete phone number', () => {
      expect(formatPhone('5551234567')).toBe('(555) 123-4567')
    })

    it('should handle non-digit input', () => {
      expect(formatPhone('(555) 123-4567')).toBe('(555) 123-4567')
      expect(formatPhone('555-123-4567')).toBe('(555) 123-4567')
      expect(formatPhone('555 123 4567')).toBe('(555) 123-4567')
    })

    it('should limit to 10 digits', () => {
      expect(formatPhone('55512345678')).toBe('(555) 123-4567')
      expect(formatPhone('555123456789')).toBe('(555) 123-4567')
    })
  })

  describe('Card Number Formatting', () => {
    const formatCardNumber = (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, 16)
      return digits.replace(/(.{4})/g, '$1 ').trim()
    }

    it('should format card number with spaces', () => {
      expect(formatCardNumber('1234567890123456')).toBe('1234 5678 9012 3456')
    })

    it('should handle input with existing spaces', () => {
      expect(formatCardNumber('1234 5678 9012 3456')).toBe('1234 5678 9012 3456')
    })

    it('should limit to 16 digits', () => {
      expect(formatCardNumber('12345678901234567')).toBe('1234 5678 9012 3456')
    })

    it('should remove non-digit characters', () => {
      expect(formatCardNumber('1234-5678-9012-3456')).toBe('1234 5678 9012 3456')
    })
  })

  describe('Expiry Date Formatting', () => {
    const formatExpiry = (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, 4)
      if (digits.length <= 2) return digits
      return `${digits.slice(0, 2)}/${digits.slice(2)}`
    }

    it('should format expiry month only', () => {
      expect(formatExpiry('1')).toBe('1')
      expect(formatExpiry('12')).toBe('12')
    })

    it('should format complete expiry date', () => {
      expect(formatExpiry('1225')).toBe('12/25')
    })

    it('should handle input with slash', () => {
      expect(formatExpiry('12/25')).toBe('12/25')
    })

    it('should limit to 4 digits', () => {
      expect(formatExpiry('122599')).toBe('12/25')
    })
  })

  describe('Email Validation', () => {
    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    it('should accept valid emails', () => {
      const validEmails = [
        'user@example.com',
        'first.last@company.co.uk',
        'user+tag@domain.org',
        'test@yopmail.com',
        'agent@test-domain.com',
      ]

      validEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(true)
      })
    })

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        '',
      ]

      invalidEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(false)
      })
    })
  })

  describe('Name Validation', () => {
    const validateName = (name: string) => /^[a-zA-Z\s'-]+$/.test(name)

    it('should accept valid names', () => {
      const validNames = [
        'John',
        'Mary',
        "O'Brien",
        'Jean-Pierre',
        'Mary-Jane',
        "O'Connor",
      ]

      validNames.forEach((name) => {
        expect(validateName(name)).toBe(true)
      })
    })

    it('should reject invalid names', () => {
      const invalidNames = [
        'John123',
        'Mary@',
        'John#Doe',
        '123John',
        '',
      ]

      invalidNames.forEach((name) => {
        expect(validateName(name)).toBe(false)
      })
    })
  })

  describe('ZIP Code Validation', () => {
    const validateZipCode = (zip: string) => /^\d{5}(-\d{4})?$/.test(zip)

    it('should accept valid ZIP codes', () => {
      const validZips = [
        '12345',
        '90210',
        '10001',
        '12345-6789',
        '90210-1234',
      ]

      validZips.forEach((zip) => {
        expect(validateZipCode(zip)).toBe(true)
      })
    })

    it('should reject invalid ZIP codes', () => {
      const invalidZips = [
        '1234',
        '123456',
        '1234-567',
        '12345-67890',
        'ABCDE',
      ]

      invalidZips.forEach((zip) => {
        expect(validateZipCode(zip)).toBe(false)
      })
    })
  })

  describe('CVV Validation', () => {
    const validateCVV = (cvv: string) => /^\d{3,4}$/.test(cvv)

    it('should accept valid CVV codes', () => {
      expect(validateCVV('123')).toBe(true)
      expect(validateCVV('1234')).toBe(true)
      expect(validateCVV('000')).toBe(true)
      expect(validateCVV('9999')).toBe(true)
    })

    it('should reject invalid CVV codes', () => {
      expect(validateCVV('12')).toBe(false)
      expect(validateCVV('12345')).toBe(false)
      expect(validateCVV('12a')).toBe(false)
      expect(validateCVV('')).toBe(false)
    })
  })

  describe('IMEI Validation', () => {
    const validateIMEI = (imei: string) => /^\d{15}$/.test(imei)

    it('should accept valid IMEI', () => {
      expect(validateIMEI('123456789012345')).toBe(true)
      expect(validateIMEI('999999999999999')).toBe(true)
      expect(validateIMEI('000000000000000')).toBe(true)
    })

    it('should reject invalid IMEI', () => {
      expect(validateIMEI('12345678901234')).toBe(false)
      expect(validateIMEI('1234567890123456')).toBe(false)
      expect(validateIMEI('12345678901234a')).toBe(false)
      expect(validateIMEI('')).toBe(false)
    })
  })
})
