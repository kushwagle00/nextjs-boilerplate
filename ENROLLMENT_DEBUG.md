# Enrollment Form Debugging Guide

## What I Fixed

### 1. **Enhanced Debug Logging**
The enrollment form now logs detailed information to the browser console when you click "Submit Enrollment". This helps identify exactly where validation is failing.

### 2. **Improved Button Feedback**
- The submit button now shows a spinner during processing
- Button is disabled while processing to prevent duplicate submissions
- Loading state is clearly visible

### 3. **Better Error Handling**
- Validation errors are logged with field names
- API errors are properly caught and displayed
- Step navigation on errors helps locate the problem

## How to Debug the Enrollment Process

### Step 1: Open Browser Developer Tools
- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- **Firefox**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- **Safari**: Enable in Preferences → Advanced, then press `Cmd+Option+I`

### Step 2: Go to Console Tab
Click on the "Console" tab to see all logged messages starting with `[v0]`

### Step 3: Fill the Form and Click Submit
When you click the "Submit Enrollment" button, look for these logs in order:

```
[v0] handleSubmit called
[v0] Form data: { ... all form fields ... }
[v0] Validation success: true/false
```

### Step 4: Interpret the Logs

#### **If validation fails:**
```
[v0] Validation error on field [fieldName]: [error message]
```

Common issues:
- **phone validation error**: Phone must be exactly 10 digits (but formatting is allowed, so (555) 123-4567 is valid)
- **email validation error**: Must be a valid email format
- **zipCode validation error**: Must be 5 digits or 5+4 format

#### **If validation passes but API fails:**
```
[v0] Response status: 400/401/402/500
[v0] Response data: { ... error details ... }
```

Common status codes:
- **401**: Not authenticated - your agent session may have expired, try logging in again
- **400**: Validation failed on server side - check the error field in response
- **402**: Payment declined - use CVV `101` for approval or `010` for decline
- **500**: Server error - check server logs

#### **If everything succeeds:**
```
[v0] Enrollment successful, redirecting
```

## Form Data Format

The form sends data in this exact format:
```javascript
{
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "(555) 123-4567",  // Can be formatted or raw
  addressLine1: "123 Main St",
  addressLine2: "",
  city: "Springfield",
  state: "IL",
  zipCode: "62701",
  subscriptionPlan: "phone_plan" or "gadget_phone_plan",
  cardNumber: "4532 1234 5678 9010",  // Formatted with spaces
  cardExpiry: "12/25",
  cardCvv: "123",
  cardholderName: "John Doe"
}
```

## Testing Checklist

- [ ] All personal info fields are filled (no empty fields)
- [ ] Phone is 10 digits (spaces/formatting are ok)
- [ ] Email is valid format
- [ ] Address fields are filled
- [ ] Subscription plan is selected
- [ ] Card number is 16 digits
- [ ] Expiry date is MM/YY format and not expired
- [ ] CVV is 3-4 digits
  - Use `101` to test approval
  - Use `010` to test decline
- [ ] You're logged in as an agent (check if redirected to /auth/agent)

## Common Issues and Solutions

### Issue: Button doesn't respond when clicked
**Causes:**
1. Form has validation errors (check console logs)
2. Not authenticated as agent (session expired)
3. Network connectivity issue

**Solutions:**
1. Check browser console for `[v0]` logs
2. Try logging out and back in
3. Check your internet connection

### Issue: "Payment declined" message appears
**This is expected behavior!**
- Use CVV `101` to test approval
- Use CVV `010` to test decline

### Issue: Redirected back to enrollment after submission
**Causes:**
1. API validation error (check logs for field errors)
2. Database error (check server logs)
3. Session cookie issue

**Solutions:**
1. Read the error message carefully
2. Check that all required fields are filled
3. Try logging in again to refresh session

## Test Credentials

You can use any email/phone combination for testing:
```
Email: test@example.com (or agent@company.com, or any valid email)
Phone: (555) 123-4567 or 5551234567 (any 10-digit number)
Card: 4532 1234 5678 9010 (fake card for testing)
Expiry: 12/25 (any future date in MM/YY)
CVV: 101 (to approve) or 010 (to decline)
```

## If You're Still Having Issues

1. **Check the browser console** - The `[v0]` logs will tell you exactly what's failing
2. **Verify all fields are filled** - Empty fields cause validation to fail
3. **Check your internet connection** - Network issues prevent the API call
4. **Clear browser cache** - Sometimes old cached data causes issues
5. **Try in a different browser** - Rule out browser-specific issues
6. **Check server logs** - If the API returns an error, the server logs will have details

## Quick Commands for Testing

Run these in the browser console to test specific validations:

```javascript
// Test if phone validation works
'5551234567'.replace(/\D/g, '').length === 10  // Should return true

// Test if email validation works
/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test('test@example.com')  // Should return true

// Test if zipcode validation works
/^\d{5}(-\d{4})?$/.test('62701')  // Should return true
```

