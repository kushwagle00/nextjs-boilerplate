import { enrollmentSchema, customerLoginSchema, devicePhoneSchema } from '@/lib/validations'

describe('Validations', () => {
  describe('enrollmentSchema', () => {
    it('should accept valid enrollment data', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        addressLine1: '123 Main St',
        addressLine2: '',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        subscriptionPlan: 'phone_plan',
        cardNumber: '1234 5678 9012 3456',
        cardExpiry: '12/25',
        cardCvv: '101',
        cardholderName: 'John Doe',
      }

      const result = enrollmentSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept phone with 10 digits and formatting', () => {
      const data = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '5551234567',
        addressLine1: '456 Oak Ave',
        addressLine2: '',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001',
        subscriptionPlan: 'gadget_phone_plan',
        cardNumber: '9876 5432 1098 7654',
        cardExpiry: '06/26',
        cardCvv: '456',
        cardholderName: 'Jane Smith',
      }

      const result = enrollmentSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject phone with less than 10 digits', () => {
      const data = {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob@example.com',
        phone: '555123456',
        addressLine1: '789 Pine Rd',
        addressLine2: '',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        subscriptionPlan: 'phone_plan',
        cardNumber: '1111 2222 3333 4444',
        cardExpiry: '03/25',
        cardCvv: '123',
        cardholderName: 'Bob Johnson',
      }

      const result = enrollmentSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const phoneError = result.error.issues.find((issue) => issue.path.includes('phone'))
        expect(phoneError?.message).toContain('10 digits')
      }
    })

    it('should reject phone with more than 10 digits', () => {
      const data = {
        firstName: 'Alice',
        lastName: 'Brown',
        email: 'alice@example.com',
        phone: '55512345678',
        addressLine1: '321 Elm St',
        addressLine2: '',
        city: 'Houston',
        state: 'TX',
        zipCode: '77001',
        subscriptionPlan: 'phone_plan',
        cardNumber: '5555 6666 7777 8888',
        cardExpiry: '09/25',
        cardCvv: '789',
        cardholderName: 'Alice Brown',
      }

      const result = enrollmentSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const phoneError = result.error.issues.find((issue) => issue.path.includes('phone'))
        expect(phoneError?.message).toContain('10 digits')
      }
    })

    it('should reject empty phone', () => {
      const data = {
        firstName: 'Charlie',
        lastName: 'Wilson',
        email: 'charlie@example.com',
        phone: '',
        addressLine1: '654 Birch Ln',
        addressLine2: '',
        city: 'Phoenix',
        state: 'AZ',
        zipCode: '85001',
        subscriptionPlan: 'phone_plan',
        cardNumber: '4444 5555 6666 7777',
        cardExpiry: '11/24',
        cardCvv: '234',
        cardholderName: 'Charlie Wilson',
      }

      const result = enrollmentSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject invalid email', () => {
      const data = {
        firstName: 'Diana',
        lastName: 'Davis',
        email: 'invalid-email',
        phone: '5551234567',
        addressLine1: '987 Cedar Dr',
        addressLine2: '',
        city: 'Philadelphia',
        state: 'PA',
        zipCode: '19101',
        subscriptionPlan: 'phone_plan',
        cardNumber: '3333 4444 5555 6666',
        cardExpiry: '07/25',
        cardCvv: '567',
        cardholderName: 'Diana Davis',
      }

      const result = enrollmentSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject invalid card number', () => {
      const data = {
        firstName: 'Edward',
        lastName: 'Miller',
        email: 'edward@example.com',
        phone: '5551234567',
        addressLine1: '147 Maple Ave',
        addressLine2: '',
        city: 'San Antonio',
        state: 'TX',
        zipCode: '78201',
        subscriptionPlan: 'phone_plan',
        cardNumber: '1234 5678 9012',
        cardExpiry: '05/25',
        cardCvv: '890',
        cardholderName: 'Edward Miller',
      }

      const result = enrollmentSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject expired card', () => {
      const data = {
        firstName: 'Fiona',
        lastName: 'Taylor',
        email: 'fiona@example.com',
        phone: '5551234567',
        addressLine1: '258 Spruce Ct',
        addressLine2: '',
        city: 'San Diego',
        state: 'CA',
        zipCode: '92101',
        subscriptionPlan: 'phone_plan',
        cardNumber: '2222 3333 4444 5555',
        cardExpiry: '01/23',
        cardCvv: '123',
        cardholderName: 'Fiona Taylor',
      }

      const result = enrollmentSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject invalid subscription plan', () => {
      const data = {
        firstName: 'George',
        lastName: 'Anderson',
        email: 'george@example.com',
        phone: '5551234567',
        addressLine1: '369 Willow Way',
        addressLine2: '',
        city: 'San Jose',
        state: 'CA',
        zipCode: '95101',
        subscriptionPlan: 'invalid_plan',
        cardNumber: '6666 7777 8888 9999',
        cardExpiry: '08/26',
        cardCvv: '456',
        cardholderName: 'George Anderson',
      }

      const result = enrollmentSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('customerLoginSchema', () => {
    it('should accept valid customer login with formatted phone', () => {
      const data = {
        email: 'customer@example.com',
        phone: '(555) 123-4567',
      }

      const result = customerLoginSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept valid customer login with unformatted phone', () => {
      const data = {
        email: 'user@test.com',
        phone: '5559876543',
      }

      const result = customerLoginSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject phone with incorrect digit count', () => {
      const data = {
        email: 'customer@example.com',
        phone: '555123456',
      }

      const result = customerLoginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject invalid email', () => {
      const data = {
        email: 'not-an-email',
        phone: '5551234567',
      }

      const result = customerLoginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('devicePhoneSchema', () => {
    it('should accept valid phone device data', () => {
      const data = {
        deviceName: 'My iPhone',
        imei: '123456789012345',
        brand: 'Apple',
        model: 'iPhone 14',
        color: 'Black',
        purchaseDate: '2023-01-15',
      }

      const result = devicePhoneSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid IMEI', () => {
      const data = {
        deviceName: 'My Android',
        imei: '12345678901234',
        brand: 'Samsung',
        model: 'Galaxy S23',
        color: 'White',
        purchaseDate: '2023-06-20',
      }

      const result = devicePhoneSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject future purchase date', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)
      const data = {
        deviceName: 'Future Phone',
        imei: '999999999999999',
        brand: 'OnePlus',
        model: 'OnePlus 11',
        color: 'Green',
        purchaseDate: futureDate.toISOString().split('T')[0],
      }

      const result = devicePhoneSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })
})
