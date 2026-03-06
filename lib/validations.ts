import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Full name must be at least 2 characters')
      .max(255, 'Full name must be less than 255 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters')
      .max(128, 'Password must be less than 128 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const enrollmentSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine(
      (val) => val.replace(/\D/g, '').length === 10,
      'Phone number must be exactly 10 digits'
    ),
  addressLine1: z
    .string()
    .min(1, 'Street address is required')
    .max(255, 'Address must be less than 255 characters'),
  addressLine2: z
    .string()
    .max(255, 'Address line 2 must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be less than 100 characters'),
  state: z
    .string()
    .min(1, 'State is required')
    .max(100, 'State must be less than 100 characters'),
  zipCode: z
    .string()
    .min(1, 'ZIP code is required')
    .regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)'),
  subscriptionPlan: z.enum(['phone_plan', 'gadget_phone_plan'], {
    required_error: 'Please select a plan',
  }),
  cardNumber: z
    .string()
    .min(1, 'Card number is required')
    .regex(/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/, 'Please enter a valid 16-digit card number'),
  cardExpiry: z
    .string()
    .min(1, 'Expiration date is required')
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Please enter a valid expiration date (MM/YY)')
    .refine((val) => {
      const [month, year] = val.split('/')
      const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1)
      return expiry > new Date()
    }, 'Card has expired'),
  cardCvv: z
    .string()
    .min(1, 'CVV is required')
    .regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
  cardholderName: z
    .string()
    .min(1, 'Cardholder name is required')
    .max(255, 'Cardholder name must be less than 255 characters'),
})

export const customerLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine(
      (val) => val.replace(/\D/g, '').length === 10,
      'Phone number must be exactly 10 digits'
    ),
})

export const planSchema = z.object({
  planId: z.enum(['phone_plan', 'gadget_phone_plan'], {
    required_error: 'Please select a plan',
  }),
})

export const devicePhoneSchema = z.object({
  deviceName: z
    .string()
    .min(1, 'Device name is required')
    .max(100, 'Device name must be less than 100 characters'),
  imei: z
    .string()
    .min(1, 'IMEI is required')
    .regex(/^\d{15}$/, 'IMEI must be exactly 15 digits'),
  brand: z
    .string()
    .min(1, 'Brand is required')
    .max(100, 'Brand must be less than 100 characters'),
  model: z
    .string()
    .min(1, 'Model is required')
    .max(100, 'Model must be less than 100 characters'),
  color: z
    .string()
    .min(1, 'Color is required')
    .max(50, 'Color must be less than 50 characters'),
  purchaseDate: z
    .string()
    .min(1, 'Purchase date is required')
    .refine((val) => {
      const date = new Date(val)
      return date <= new Date()
    }, 'Purchase date cannot be in the future'),
})

export const deviceGadgetSchema = z.object({
  deviceType: z.enum(['laptop', 'tablet', 'watch', 'headphones', 'camera', 'speaker'], {
    errorMap: () => ({ message: 'Please select a gadget type' }),
  }),
  deviceName: z
    .string()
    .min(1, 'Device name is required')
    .max(100, 'Device name must be less than 100 characters'),
  brand: z
    .string()
    .min(1, 'Brand is required')
    .max(100, 'Brand must be less than 100 characters'),
  model: z
    .string()
    .min(1, 'Model is required')
    .max(100, 'Model must be less than 100 characters'),
  serialNumber: z
    .string()
    .min(1, 'Serial number is required')
    .max(100, 'Serial number must be less than 100 characters'),
  color: z
    .string()
    .min(1, 'Color is required')
    .max(50, 'Color must be less than 50 characters'),
  purchaseDate: z
    .string()
    .min(1, 'Purchase date is required')
    .refine((val) => {
      const date = new Date(val)
      return date <= new Date()
    }, 'Purchase date cannot be in the future'),
})

export const deviceSchema = z.object({
  type: z.enum(['phone', 'laptop', 'tablet', 'watch', 'headphones', 'camera', 'speaker'], {
    required_error: 'Please select a device type',
  }),
  deviceName: z
    .string()
    .min(1, 'Device name is required')
    .max(100, 'Device name must be less than 100 characters'),
  imei: z
    .string()
    .min(1, 'IMEI is required')
    .regex(/^\d{15}$/, 'IMEI must be exactly 15 digits')
    .optional()
    .or(z.literal('')),
  serialNumber: z
    .string()
    .max(100, 'Serial number must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  brand: z
    .string()
    .min(1, 'Brand is required')
    .max(100, 'Brand must be less than 100 characters'),
  model: z
    .string()
    .min(1, 'Model is required')
    .max(100, 'Model must be less than 100 characters'),
  color: z
    .string()
    .max(50, 'Color must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  purchaseDate: z
    .string()
    .min(1, 'Purchase date is required')
    .refine((val) => {
      const date = new Date(val)
      return date <= new Date()
    }, 'Purchase date cannot be in the future'),
})

export type CustomerLoginFormData = z.infer<typeof customerLoginSchema>
export type PlanFormData = z.infer<typeof planSchema>
export type DevicePhoneFormData = z.infer<typeof devicePhoneSchema>
export type DeviceGadgetFormData = z.infer<typeof deviceGadgetSchema>
export type DeviceFormData = z.infer<typeof deviceSchema>

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type EnrollmentFormData = z.infer<typeof enrollmentSchema>
