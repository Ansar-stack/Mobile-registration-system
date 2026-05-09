# Fix Unauthorized Issue - Step by Step

## Current Issue
After login, when accessing protected routes, you get "unauthorized" error.

## Root Cause
Cookies are not being sent/received properly between frontend and backend in production.

## Steps to Fix

### Step 1: Test Database First
```bash
cd backend
node test-db.js
```

This will verify:
- Database connection works
- Admin user exists
- Password is correct

### Step 2: Deploy Backend Changes
```bash
git add .
git commit -m "Fix CORS and cookie settings"
git push
```

Wait for Render to redeploy (check dashboard).

### Step 3: Test Login in Browser Console

1. Open your frontend: https://register-mobile.vercel.app
2. Open Browser DevTools (F12)
3. Go to "Application" tab → "Cookies"
4. Try to login
5. Check if `accessToken` and `refreshToken` cookies appear

**If cookies DON'T appear:**
- Problem: Cookies not being set
- Check Render logs for "Setting cookies for user"

**If cookies DO appear but still get unauthorized:**
- Problem: Cookies not being sent with requests
- Check Network tab → Click on any API request → Check "Cookies" section

### Step 4: Check Render Logs

Go to Render Dashboard → Your Service → Logs

Look for these messages after login:
```
Login attempt for: admin@gmail.com
User found: Yes
Setting cookies for user: admin@gmail.com
```

Then when accessing protected route:
```
Auth middleware - Cookies received: { hasAccessToken: true, hasRefreshToken: true }
Auth success: User admin@gmail.com
```

### Step 5: Verify Environment Variables on Render

Make sure these are set:
```
NODE_ENV=production
FRONTEND_URL=https://register-mobile.vercel.app
```

## Common Issues

### Issue 1: Cookies not set
**Symptom**: No cookies in browser after login
**Fix**: Check if `secure: true` and `sameSite: "none"` are set in production

### Issue 2: Cookies not sent
**Symptom**: Cookies exist but not sent with requests
**Fix**: Verify `withCredentials: true` in frontend axios config

### Issue 3: CORS error
**Symptom**: "Not allowed by CORS" in console
**Fix**: Add your Vercel URL to `allowedOrigins` in backend

### Issue 4: Wrong domain
**Symptom**: Cookies set for wrong domain
**Fix**: Make sure you're not setting `domain` option in cookie config

## Testing Checklist

- [ ] Run `node test-db.js` - Admin user exists
- [ ] Backend deployed to Render
- [ ] Login works (returns 200)
- [ ] Cookies appear in browser DevTools
- [ ] Protected routes work (no 401 error)
- [ ] Check Render logs show successful auth

## Debug Commands

**Test login locally:**
```bash
cd backend
DB_MODE=remote npm run dev
```

Then test in Postman:
```
POST http://localhost:4000/api/v1/auth/login
{
  "email": "admin@gmail.com",
  "password": "admin123"
}
```

Check response headers for `Set-Cookie`.
