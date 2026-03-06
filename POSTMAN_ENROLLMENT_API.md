# Enrollment API - Postman Documentation

## Setup

1. **Set the API Key in Environment Variables**
   - Go to Settings > Vars in Vercel project
   - Add environment variable: `ENROLLMENT_API_KEY=your-secret-key`
   - Use a strong random key (e.g., `32+ character alphanumeric string`)

2. **Configure Postman Environment**
   - Set `base_url` variable to your deployment URL (e.g., `https://your-app.vercel.app`)
   - Set `api_key` variable to the `ENROLLMENT_API_KEY` value

## Endpoint

**POST** `/api/customers/enroll`

## Authentication

Include the API key in the request header:

```
Authorization: Bearer {{api_key}}
```

Or use Postman's Auth tab:
- Type: `Bearer Token`
- Token: `{{api_key}}`

## Request Body

All fields are required unless marked optional.

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "addressLine1": "123 Main St",
  "addressLine2": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "subscriptionPlan": "phone_plan",
  "cardholderName": "John Doe",
  "cardNumber": "4242 4242 4242 4242",
  "cardExpiry": "12/25",
  "cardCvv": "101"
}
```

## Field Specifications

| Field | Type | Rules | Example |
|-------|------|-------|---------|
| `firstName` | string | 1-100 chars, letters/spaces/hyphens/apostrophes | `John` |
| `lastName` | string | 1-100 chars, letters/spaces/hyphens/apostrophes | `Doe` |
| `email` | string | Valid email format | `john@example.com` |
| `phone` | string | 10 digits (formatted or unformatted) | `(555) 123-4567` or `5551234567` |
| `addressLine1` | string | 1-255 chars | `123 Main St` |
| `addressLine2` | string | Optional, 0-255 chars | `Apt 4B` |
| `city` | string | 1-100 chars | `New York` |
| `state` | string | 1-100 chars | `NY` or `New York` |
| `zipCode` | string | 5 or 9 digits (XXXXX or XXXXX-XXXX) | `10001` or `10001-1234` |
| `subscriptionPlan` | enum | Must be one of: | `phone_plan` or `gadget_phone_plan` |
| | | - `phone_plan` (DPPhoneProtect, $9.99/mo) | |
| | | - `gadget_phone_plan` (DPTotalProtect, $19.99/mo) | |
| `cardholderName` | string | 1-255 chars | `John Doe` |
| `cardNumber` | string | 16 digits (spaces optional) | `4242 4242 4242 4242` |
| `cardExpiry` | string | MM/YY format, must be future date | `12/25` |
| `cardCvv` | string | 3-4 digits | `101` (test: approve), `010` (test: decline) |

## Plans

- **phone_plan**: DPPhoneProtect - Phone protection only ($9.99/month)
- **gadget_phone_plan**: DPTotalProtect - Phone + Gadget protection ($19.99/month)

## Test Card Numbers

For mock payment testing (no real charges):

| Card | CVV | Result |
|------|-----|--------|
| 4242 4242 4242 4242 | 101 | ✓ Approved |
| 4242 4242 4242 4242 | 010 | ✗ Declined |

Any other CVV will be approved. Only CVV `010` triggers a decline.

## Response - Success (201)

```json
{
  "success": true,
  "customerId": 42,
  "message": "Customer enrolled successfully"
}
```

## Response - Validation Error (400)

```json
{
  "errors": {
    "email": "Please enter a valid email address",
    "phone": "Phone number must be exactly 10 digits"
  }
}
```

## Response - Payment Declined (402)

```json
{
  "errors": {
    "cardNumber": "Card was declined. Please try a different payment method."
  }
}
```

## Response - Unauthorized (401)

```json
{
  "error": "Unauthorized. Provide agent session cookie or Authorization: Bearer <ENROLLMENT_API_KEY> header"
}
```

## Response - Server Error (500)

```json
{
  "errors": {
    "general": "An unexpected error occurred. Please try again."
  }
}
```

## Postman Collection Template

Save this as a `.json` file and import into Postman:

```json
{
  "info": {
    "name": "Device Protection Enrollment API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Enroll Customer",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{api_key}}",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"firstName\": \"John\",\n  \"lastName\": \"Doe\",\n  \"email\": \"john.doe@example.com\",\n  \"phone\": \"(555) 123-4567\",\n  \"addressLine1\": \"123 Main St\",\n  \"addressLine2\": \"\",\n  \"city\": \"New York\",\n  \"state\": \"NY\",\n  \"zipCode\": \"10001\",\n  \"subscriptionPlan\": \"phone_plan\",\n  \"cardholderName\": \"John Doe\",\n  \"cardNumber\": \"4242 4242 4242 4242\",\n  \"cardExpiry\": \"12/25\",\n  \"cardCvv\": \"101\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/customers/enroll",
          "protocol": "https",
          "host": ["{{base_url}}"],
          "path": ["api", "customers", "enroll"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "https://your-app.vercel.app"
    },
    {
      "key": "api_key",
      "value": "your-enrollment-api-key"
    }
  ]
}
```

## cURL Example

```bash
curl -X POST https://your-app.vercel.app/api/customers/enroll \
  -H "Authorization: Bearer your-enrollment-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "addressLine1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "subscriptionPlan": "phone_plan",
    "cardholderName": "John Doe",
    "cardNumber": "4242 4242 4242 4242",
    "cardExpiry": "12/25",
    "cardCvv": "101"
  }'
```

## Security Notes

- The API stores only the **last 4 digits** of card numbers and **never stores CVV**
- Payment processing is mocked (no real charges)
- Always use HTTPS in production
- Rotate `ENROLLMENT_API_KEY` regularly
- Never commit the API key to version control
