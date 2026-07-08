# Mobile Registration Network Error - Debugging Guide

## Changes Made

I've enhanced error logging to show the **actual error details** instead of generic "Something went wrong" messages.

### What was fixed:

1. **Enhanced AsyncHandler Logging** - Now logs full error details including:
   - Request body, query, params
   - Full error stack trace
   - All error properties

2. **Improved Error Middleware** - Now:
   - Logs complete request context
   - Shows actual error messages in development mode
   - Includes stack trace in development responses

## How to Debug the Mobile Registration Error

### Step 1: Start the server in development mode
```bash
cd backend
npm run dev
```

### Step 2: Try to register a mobile from your app

### Step 3: Check the error logs
```bash
# View last 20 lines of error log
Get-Content logs\error.log | Select-Object -Last 20

# Or view the full combined log
Get-Content logs\combined.log | Select-Object -Last 50
```

### Step 4: Look for these common issues:

#### Issue 1: Database Connection
**Error:** "SQLITE_ERROR" or "database is locked"
**Solution:** 
- Check if `drizzle/local.db` exists
- Make sure `DB_MODE=local` in `.env`
- Try: `npm run db:push` to sync the schema

#### Issue 2: Missing Customer
**Error:** "Customer not found" or "Customer is required"
**Solution:**
- For BUY/UNLOCK transactions, customer ID is required
- Create customer first, then use that ID when registering mobile
- For SELL transactions, customer is optional

#### Issue 3: Validation Error
**Error:** "validation.imei1Required" or similar
**Solution:**
- IMEI must be exactly 15 digits
- Phone numbers must match Afghan format: `07xxxxxxxx` or `+937xxxxxxxx`
- Check all required fields are being sent

#### Issue 4: Unique Constraint
**Error:** "UNIQUE constraint failed"
**Solution:**
- IMEI1 must be unique (can't register same phone twice)
- Customer phone number must be unique
- Customer ID card number must be unique

## API Endpoint for Mobile Registration

**POST** `/api/v1/mobiles`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your_access_token>
```

**Request Body:**
```json
{
  "imei1": "123456789012345",
  "imei2": "123456789012346",
  "brand": "Samsung",
  "model": "Galaxy S21",
  "color": "Black",
  "ram": "8GB",
  "storage": "128GB",
  "type": "BUY",
  "customerId": 1,
  "price": 50000,
  "notes": "Optional notes"
}
```

**Field Requirements:**
- `imei1` (required): 15 digits
- `imei2` (optional): 15 digits
- `brand` (required): string
- `model` (required): string
- `color` (required): string
- `ram` (optional): string
- `storage` (optional): string
- `type` (required): "BUY", "SELL", or "UNLOCK"
- `customerId` (required for BUY/UNLOCK): integer
- `price` (optional): number
- `notes` (optional): string (max 500 chars)

## Testing with cURL

```bash
# First login to get token
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"yourpassword\"}"

# Then register mobile (replace TOKEN with actual token)
curl -X POST http://localhost:4000/api/v1/mobiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d "{\"imei1\":\"123456789012345\",\"brand\":\"Samsung\",\"model\":\"S21\",\"color\":\"Black\",\"type\":\"SELL\"}"
```

## Common Solutions

### Network Error in Mobile App

1. **Check Backend URL**
   - Make sure your mobile app is pointing to the correct backend URL
   - For local testing: `http://YOUR_IP:4000` (not `localhost`)
   - For production: `https://your-backend-domain.com`

2. **Check CORS**
   - Mobile apps send requests without origin header
   - Backend already allows requests with no origin
   - If still blocked, check `allowedOrigins` in `backend/app.js`

3. **Check Network Connection**
   - Make sure mobile device can reach the backend
   - Test with browser first: visit `http://YOUR_IP:4000/health`

4. **Check Request Format**
   - Make sure Content-Type is `application/json`
   - Make sure Authorization header includes "Bearer " prefix
   - Make sure all required fields are included

5. **Enable Detailed Errors**
   - Set `NODE_ENV=development` in `.env`
   - Restart server
   - Error response will include full error message

## Next Steps

1. **Try to register a mobile** and see what specific error appears in the logs
2. **Share the exact error message** from `logs/error.log`
3. **Check the request being sent** from your mobile app

The error logs will now show the **exact issue** so we can fix it properly!
