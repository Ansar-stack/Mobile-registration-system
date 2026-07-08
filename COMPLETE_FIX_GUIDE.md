# Complete Fix Guide - Dashboard Zero & Network Errors

## Issues Identified:

1. **Dashboard shows zero** - Database queries returning no data
2. **Network errors on mobile registration** - Frontend pointing to Render.com but using local backend
3. **Mixed environment configuration** - Frontend .env points to production, but you're developing locally

## Root Cause:

Your frontend is trying to connect to `https://mobile-registration-system.onrender.com` (production) but you're running the backend locally at `http://localhost:4000`.

## SOLUTION: Fix Frontend to Use Local Backend

### Step 1: Update Frontend .env

Edit `Frontend\.env`:

```bash
# BEFORE (wrong - points to Render.com):
VITE_APP_API_URL=https://mobile-registration-system.onrender.com/

# AFTER (correct - points to local backend):
VITE_APP_API_URL=http://localhost:4000
```

### Step 2: Restart Frontend

After changing `.env`, you **MUST restart** the frontend:

```bash
# Stop the frontend (Ctrl+C)
# Then start again
cd Frontend
npm run dev
```

###Step 3: Make Sure Backend is Running Locally

```bash
cd backend
npm run dev
```

You should see:
```
🗄️  Using local SQLite database
Server runs at port 4000
```

### Step 4: Verify Connection

Open browser and test:
1. Backend health: http://localhost:4000/health
2. Frontend should now connect to local backend

---

## Dashboard Zero Issue - Database is Empty

The dashboard shows zero because your **local database has no data**. Let me check and seed it:

### Fix 1: Check if Database Exists

```powershell
# Check if local database file exists
Test-Path "d:\Projects\Mobile Registeration\backend\drizzle\local.db"
```

If it says `False`, the database doesn't exist. Run:

```bash
cd backend
npm run db:push
```

### Fix 2: Seed the Database with Test Data

The database exists but is empty. Let's add test data:

```bash
cd backend
npm run db:seed
```

This will create:
- Admin user (email: admin@gmail.com, password: admin123)
- Test users
- Test customers  
- Test mobiles
- Test transactions

### Fix 3: Verify Data Was Added

After seeding, check dashboard should show numbers like:
- Total Mobiles: 10+
- Total Customers: 5+
- Total Users: 3+
- etc.

---

## Common Network Error Scenarios

### Scenario 1: "Network Error" when registering mobile

**Cause:** Frontend can't reach backend
**Check:**
1. Is backend running? (`npm run dev` in backend folder)
2. Is frontend .env pointing to `http://localhost:4000`?
3. Did you restart frontend after changing .env?

### Scenario 2: "401 Unauthorized" 

**Cause:** Invalid or expired token
**Fix:** Log out and log in again

### Scenario 3: "404 Not Found"

**Cause:** Backend not running or wrong URL
**Fix:** 
1. Start backend: `npm run dev`
2. Check backend URL in frontend .env

### Scenario 4: "CORS Error"

**Cause:** Unlikely with localhost, but if it happens:
**Fix:** Backend already allows localhost origins (check `backend/app.js`)

---

## Complete Fresh Start (if nothing works)

If you're still having issues, do a complete reset:

### 1. Stop Everything

```bash
# Stop frontend and backend (Ctrl+C in both terminals)
```

### 2. Delete Local Database

```powershell
Remove-Item "d:\Projects\Mobile Registeration\backend\drizzle\local.db" -Force
```

### 3. Update Frontend .env

```bash
# Frontend\.env
VITE_APP_API_URL=http://localhost:4000
```

### 4. Recreate Database

```bash
cd backend
npm run db:push
npm run db:seed
```

### 5. Start Backend

```bash
cd backend
npm run dev
```

Wait for:
```
🗄️  Using local SQLite database
Server runs at port 4000
```

### 6. Start Frontend

```bash
cd Frontend
npm run dev
```

### 7. Login

- URL: http://localhost:5173 (or whatever port Vite shows)
- Email: admin@gmail.com
- Password: admin123

### 8. Check Dashboard

Dashboard should now show real numbers!

---

## Production vs Development

### For Local Development (what you want now):

**Backend .env:**
```
PORT=4000
NODE_ENV=development
DB_MODE=local
LOCAL_DATABASE_URL=file:./drizzle/local.db
```

**Frontend .env:**
```
VITE_APP_API_URL=http://localhost:4000
```

### For Production Deployment:

**Backend .env (on Render.com):**
```
PORT=4000
NODE_ENV=production
DB_MODE=remote
DATABASE_URL=libsql://your-turso-url
TURSO_AUTH_TOKEN=your-token
FRONTEND_URL=https://register-mobile.vercel.app
```

**Frontend .env.production:**
```
VITE_APP_API_URL=https://mobile-registration-system.onrender.com
```

---

## Quick Checklist

- [ ] Frontend .env points to `http://localhost:4000`
- [ ] Backend .env has `DB_MODE=local`
- [ ] Backend is running (`npm run dev`)
- [ ] Frontend is restarted after .env change
- [ ] Database is seeded (`npm run db:seed`)
- [ ] Can access health endpoint: http://localhost:4000/health
- [ ] Can login to frontend

---

## Still Getting Network Errors?

Check these:

1. **Open browser console (F12)** and look at Network tab
2. **Check the request URL** - is it going to localhost:4000 or render.com?
3. **If it's still going to render.com**, you forgot to restart the frontend
4. **Check backend logs** - any errors shown?
5. **Check error logs:**
   ```bash
   Get-Content backend\logs\error.log | Select-Object -Last 20
   ```

The error logs now show **actual error messages** so you'll see exactly what's wrong!

---

## Need More Help?

Share:
1. Screenshot of browser console Network tab
2. Last 20 lines from `backend\logs\error.log`
3. What URL the frontend is trying to connect to (visible in browser console)
