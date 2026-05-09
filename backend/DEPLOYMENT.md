# Deployment Guide

## Production Issues Checklist

### 1. Environment Variables on Render

Make sure these environment variables are set in your Render dashboard:

```
NODE_ENV=production
PORT=4000

# Database (Turso)
DATABASE_URL=libsql://mobile-regsitration-ansar-stack.aws-ap-south-1.turso.io
TURSO_AUTH_TOKEN=your_turso_token_here
DB_MODE=remote

# JWT Secrets
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=davztqmx7
CLOUDINARY_API_KEY=916911514177524
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Frontend URL
FRONTEND_URL=https://register-mobile.vercel.app
```

### 2. Database Migration

Run migrations on Render:
```bash
npm run db:push
```

### 3. Seed Admin User

Run seed script on Render:
```bash
npm run db:seed
```

### 4. Common Issues

#### Issue: "Something went wrong" on login
**Cause**: Database not migrated or seeded
**Solution**: Run migrations and seed script

#### Issue: CORS errors
**Cause**: Frontend URL not in allowed origins
**Solution**: Check FRONTEND_URL environment variable

#### Issue: 500 errors on all endpoints
**Cause**: Database connection failed
**Solution**: Verify DATABASE_URL and TURSO_AUTH_TOKEN

### 5. Testing Production

Test these endpoints:
- GET `/health` - Should return 200 with database status
- POST `/api/v1/auth/login` - Test with admin@gmail.com / admin123

### 6. Logs

Check Render logs for:
- "🗄️ Using remote Turso database" - Database connected
- "Server runs at port 4000" - Server started
- Any error messages with stack traces
