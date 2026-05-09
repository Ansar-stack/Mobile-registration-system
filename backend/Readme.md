Real Estate Management System — Backend

Table of Contents
Project Overview
Key Features
Tech Stack
Architecture
Setup & Installation
Database & Migrations
Authentication & Authorization
API Endpoints
File Storage & Security
Testing
Deployment & Environment Variables
Future Enhancements
Contributing
License
Project Overview

The Real Estate Management System (REMS) backend provides a REST API for managing property listings in Afghanistan.

Owners can register with verification documents (Jawaz), add properties, and upload images.
Admins can verify owners and moderate property listings.
Guests and verified users can search and filter approved listings.

This system is built with security, maintainability, and scalability in mind, aligned with industry practices and the SRS v1.3
.

Key Features
Owner Registration & Verification
Property CRUD with Image Upload
Admin Dashboard APIs for owner verification & listing moderation
Search & Filter by city, province, property type, transaction type, price range
Secure File Storage for sensitive documents (Jawaz)
JWT / httpOnly Authentication
Audit Logging for admin actions
Mobile-first API support for responsive frontend

MVP Exclusions:

Online payments / escrow
In-app messaging
Full localization (Dari/Pashto)
Map-based features or automated valuation
Tech Stack
Runtime: Node.js 18+
Language: TypeScript
Framework: NestJS (or Express with modular structure)
Database: PostgreSQL
ORM: Prisma or TypeORM
Validation: class-validator / Zod
Authentication: JWT (Bearer) or httpOnly cookies
File Storage: Local folder (for MVP) / S3-compatible object storage (production-ready)
CI/CD: Lint, unit tests, migration tests
Architecture
[Client (Next.js / Frontend)] 
          ↓ HTTPS
     [Backend API (Node.js + TS)]
          ↓
 [PostgreSQL Database] 
          ↓
 [File Storage: local / S3]

Modules Overview:

Module	Responsibility
Auth	Owner registration, login, password change, session management
Users	Profile management, verification status
Properties	CRUD for verified owners, image uploads, public listing read
Admin	Owner verification, property moderation, user management
Common	Guards, filters, pagination DTOs, storage adapter
Setup & Installation
# Clone the repo
git clone https://github.com/your-org/real-estate-backend.git
cd real-estate-backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run migrations
npx prisma migrate dev  # or typeorm migration:run

# Start development server
npm run dev

Folder Structure (Recommended)

backend/
│
├─ src/
│   ├─ modules/
│   │   ├─ auth/
│   │   ├─ users/
│   │   ├─ properties/
│   │   ├─ admin/
│   │   └─ common/
│   ├─ main.ts
│   └─ app.module.ts
├─ prisma/  # Prisma schema / migrations
├─ uploads/  # Temporary storage for MVP images (protected)
├─ tests/
└─ package.json
Database & Migrations
Tables: users, properties, property_images
Seed: One admin account (ADMIN_SEED in .env)
User Roles: owner | admin
Account Lifecycle: pending_verification → verified/rejected
Listing Lifecycle: pending → approved/rejected

Indexes & Constraints:

properties(status) for filtering
Foreign keys and composite indexes for query optimization
Unique constraints for email/phone
Authentication & Authorization
JWT or httpOnly cookies
Guards: VerifiedOwnerGuard for property write APIs, AdminGuard for admin routes
Secure password storage (bcrypt / argon2)
Rate limiting on /auth/login and /auth/register
API Endpoints

Auth:

POST /auth/register → Owner registration (multipart: Jawaz, profile, cover)
POST /auth/login → Returns token & verification status
POST /auth/logout → Clear token/session
PATCH /auth/change-password

Users:

GET /users/me → Owner profile + verification comment
PATCH /users/me → Update profile & optional re-verification

Properties:

POST /properties → Create listing (verified owners only)
PATCH /properties/:id → Edit listing (owner only)
DELETE /properties/:id → Delete listing (owner only)
GET /properties → Public approved listings, supports filters
GET /properties/:id → Public approved listing detail
POST /properties/:id/images → Upload images
DELETE /properties/:id/images/:imageId

Admin:

GET /admin/owners?verification_status=pending_verification → Owner verification queue
PATCH /admin/owners/:id → Verify/reject owner with comment
GET /admin/properties?status=pending → Pending listings
PATCH /admin/properties/:id → Approve/reject listing with comment
GET /admin/users → List users, deactivate/reactivate
File Storage & Security
Sensitive files: Jawaz images must never be public
Options:
Local folder (MVP): Protected routes to serve signed URLs
S3 / Cloud Storage (production): Signed URLs with expiration
Folder structure suggestion:
uploads/
├─ jawaz/        # Admin-only access
├─ profile/      # Owner profile pictures
└─ cover/        # Cover images
Use server-side checks for owner/admin roles before serving images
Never expose direct filesystem path in URLs
Testing
Unit tests for services, guards, and controllers
Integration tests for critical flows: registration, login, listing creation, moderation
Postman / OpenAPI test collection recommended
CI pipeline: lint, run migrations on test DB, execute tests
Deployment & Environment Variables

Required .env variables:

DATABASE_URL=postgres://user:pass@host:port/db
JWT_SECRET=your_secret_key
ADMIN_SEED=email:password
UPLOAD_DIR=./uploads
PORT=3000
CORS_ORIGINS=http://localhost:3000

Production Hardening:

HTTPS termination
Secrets in environment variables or vault
Rate limiting
Structured logging, no secrets in logs
Indexes for performance on filters
Future Enhancements
Dari / Pashto localization
Map picker integration (OpenStreetMap / provider)
In-app messaging / OTP verification
Featured listings / payment for promotion
Favorites and saved searches
Contributing
Fork the repository
Create a branch: feature/xyz
Write tests & ensure CI passes
Submit a pull request referencing SRS requirements
License

MIT License — see LICENSE