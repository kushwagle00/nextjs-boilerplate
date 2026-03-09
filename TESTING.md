> Historical notes: the current setup, authentication, and demo payment behavior are documented in [README.md](README.md). These older instructions are superseded.

# Testing Guide

This document describes how to run tests for the Agent Portal & Customer Device Management System.

## Test Setup

### Prerequisites

- Node.js 18+ installed
- Dependencies installed: `npm install` or `yarn install`

### Installation

Tests are configured to run with Jest and React Testing Library. Test dependencies are already included in `package.json`.

## Running Tests

### Development Mode
```bash
npm run test
# or
yarn test
```

This starts Jest in watch mode, re-running tests as files change.

### CI/CD Mode (For Build Verification)
```bash
npm run test:ci
# or
yarn test:ci
```

This runs all tests once and generates a coverage report. Use this command before committing or in CI/CD pipelines.

## Test Structure

Tests are organized in `__tests__/` directory:

```
__tests__/
├── lib/
│   └── validations.test.ts       # Validation schema tests
├── api/
│   └── auth.test.ts              # API authentication tests
├── components/
│   └── form-validation.test.ts    # Form field validation tests
└── build.test.ts                 # Build verification tests
```

## What's Tested

### 1. **Validation Tests** (`lib/validations.test.ts`)
- Enrollment schema with all field types
- Phone number validation with various formats: `(555) 123-4567`, `555-123-4567`, `5551234567`
- Email validation (supports yopmail)
- Card number, expiry, and CVV validation
- Customer login schema
- Device schema (phone and gadget)

**Key Fixes:**
- ✅ Phone validation now accepts formatted numbers: `(555) 123-4567`, `555-123-4567`, etc.
- ✅ Validates that phone has exactly 10 digits regardless of formatting
- ✅ Rejects phones with less or more than 10 digits

### 2. **API Tests** (`api/auth.test.ts`)
- Email format validation for agent login
- Yopmail support verification
- Phone format extraction for customer login
- Various email format acceptance

### 3. **Form Validation Tests** (`components/form-validation.test.ts`)
- Phone number formatting: `5551234567` → `(555) 123-4567`
- Card number formatting: `1234567890123456` → `1234 5678 9012 3456`
- Expiry date formatting: `1225` → `12/25`
- Email validation
- Name validation (supports letters, spaces, hyphens, apostrophes)
- ZIP code validation
- CVV validation (3-4 digits)
- IMEI validation (15 digits)

### 4. **Build Verification** (`build.test.ts`)
- All schemas can be imported without errors
- Type exports are available
- Zod schemas parse correctly
- Error handling for invalid data
- Dependencies are available
- File structure integrity

## Test Coverage Goals

- **Validations**: 100% - All schema validations tested
- **Utilities**: 100% - All formatting and validation utilities tested
- **API Routes**: Integration level - Contract tests for API endpoints
- **Components**: Build time - Verify components can be imported and compiled

## Common Test Scenarios

### Testing Phone Validation

```typescript
// ✅ These should pass
'5551234567'           // 10 digits only
'(555) 123-4567'       // Formatted with parentheses and dash
'555-123-4567'         // Formatted with dashes
'555 123 4567'         // Formatted with spaces

// ❌ These should fail
'555123456'            // Only 9 digits
'55512345678'          // 11 digits
''                     // Empty
```

### Testing Email Validation

```typescript
// ✅ These should pass
'user@example.com'
'agent@company.co.uk'
'test@yopmail.com'
'first+last@domain.org'

// ❌ These should fail
'not-an-email'
'user@'
'@example.com'
'user @example.com'
```

### Testing Card Validation

```typescript
// ✅ Card number must be 16 digits
'1234 5678 9012 3456'
'1234567890123456'

// ✅ Expiry must be MM/YY format and not expired
'12/25'  // December 2025

// ❌ These should fail
'1234 5678 9012 345'    // Only 15 digits
'01/23'                 // Expired (before current month/year)
```

## Continuous Integration

The `npm run test:ci` command should be run:

1. **Before every commit** - Ensures all tests pass locally
2. **In CI/CD pipelines** - Verifies the build is valid before deployment
3. **After dependency updates** - Catches compatibility issues

### Example CI Configuration

```yaml
# In your CI/CD pipeline (GitHub Actions, GitLab CI, etc.)
test:
  script:
    - npm install
    - npm run test:ci
  artifacts:
    paths:
      - coverage/
```

## Debugging Tests

### Run a Single Test File

```bash
npm run test -- validations.test.ts
```

### Run Tests Matching a Pattern

```bash
npm run test -- --testNamePattern="phone"
```

### Enable Verbose Output

```bash
npm run test -- --verbose
```

### Generate Coverage Report

```bash
npm run test:ci
# Coverage report available in coverage/index.html
```

## Troubleshooting

### Tests Not Running

1. Check that dependencies are installed: `npm install`
2. Verify Jest config: `jest.config.js` exists
3. Verify Jest setup: `jest.setup.js` exists

### Import Errors in Tests

1. Check that `@/` path alias is configured in Jest: `jest.config.js`
2. Verify files exist at the path being imported
3. Check for circular dependencies

### Phone Validation Failures

The schema now uses `.refine()` to strip non-digit characters before validation:

```typescript
.refine(
  (val) => val.replace(/\D/g, '').length === 10,
  'Phone number must be exactly 10 digits'
)
```

This means:
- ✅ `(555) 123-4567` is valid → strips to `5551234567` → 10 digits ✓
- ✅ `555-123-4567` is valid → strips to `5551234567` → 10 digits ✓
- ❌ `555-1234` is invalid → strips to `5551234` → 7 digits ✗

## API Endpoint Testing

While unit tests cover validation, you should manually test API endpoints:

```bash
# Agent Login
curl -X POST http://localhost:3000/api/auth/agent-login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@example.com"}'

# Customer Login
curl -X POST http://localhost:3000/api/auth/customer-login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","phone":"5551234567"}'

# Enroll Customer
curl -X POST http://localhost:3000/api/customers/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"John",
    "lastName":"Doe",
    "email":"john@example.com",
    "phone":"(555) 123-4567",
    "addressLine1":"123 Main St",
    "city":"New York",
    "state":"NY",
    "zipCode":"10001",
    "subscriptionPlan":"phone_plan",
    "cardNumber":"1234 5678 9012 3456",
    "cardExpiry":"12/25",
    "cardCvv":"101",
    "cardholderName":"John Doe"
  }'
```

## Next Steps

1. Run `npm run test:ci` before merging code
2. Maintain >80% coverage on critical paths
3. Add tests for new features before implementation
4. Update tests when validation rules change

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Zod Documentation](https://zod.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://testing-library.com/docs/queries/about)
