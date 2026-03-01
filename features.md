# Overview

**Admin dashboard**

- Dashboard widget of app info
- Edit/manage all resources (users, posts, comments, support tickets, etc.)
- View audit logs of admin actions
- Stripe admin panel (minimal - subscriptions/products/credits syncing only)

**Auth**

- Username and password login (email optional)
- Email verification
- Forgot password (requires email if set)
- OAuth (Google and GitHub)
- Session manager with geolocation & risk scoring
- 2 Token auth (refresh + access)
- Roles (Admin, Mod, User)
- User account status system (ACTIVE, SUSPENDED, BANNED, DELETED) with expiration

**Main resources/modules**

- Users (search engine, avatar upload/editing, username history tracking)
- Posts (search engine, soft delete)
- Collections (user-created collections to organize content)

**Sub resources/modules**

- Likes (posts & comments)
- Views (posts, with rate limiting to prevent abuse)
- Comments (on posts, with soft delete & edit tracking)

**Worker (BullMQ)**

- Send emails via Resend
- Delete expired sessions periodically (every hour)

**Support System**

- Support tickets (user can create, admin can manage & respond)

**3rd party**

- Posthog (analytics)
- Sentry (error tracking, optional)
- Stripe (minimal - basic syncing for subscriptions, products, credits with no feature unlocks)

**misc**

- Dark/light mode
- Unified API responses
- Settings key-value store for app configuration

# More details

## docker

- redis (cache and job queue)
- bullMQ (worker)

## backend

Uses NestJS and contains

- Unified API response wrapper
- Prisma as ORM
- Pino logging (redacts sensitive data in prod, pretty prints in dev)
- Rate limiter with configurable tiers (strict, normal, lenient, very_lenient) via env
- Swagger docs
- File upload (toggle between local storage or S3 via env)
- Guards: roles, ownership, only logged in users, Stripe configured
- Soft delete for users, posts, comments, collections
- Admin seeding (creates default admin on startup)
- PostHog analytics tracking
- Sentry error tracking
- Geolocation tracking on sessions (IP, country, lat/lng)
- Risk scoring system (detects new location & device logins)
- Audit logging (admin action tracking with before/after changes)
- Email templates with centralized styling (Resend)
- Bull Board for job queue monitoring
- Stripe API integration (minimal - syncs subscriptions/products/credits only, no feature unlocks)
- Support ticket system (basic CRUD)

## frontend

- Ky for API calls
- React Tanstack Query for data fetching & caching
- React Tanstack Table for advanced table features
- PostHog analytics
- Sentry error tracking
- Recharts for data visualization
- React Hook Form + Zod for form validation
- Avatar editor for profile pictures
- File upload with dropzone
- React Icons for UI

## front + backend

- Shadcn/UI components
  - Skeletons
  - Modals
  - Tabs
  - Forms
  - Tables
  - Tooltips
  - Dropdowns
  - etc.
- Toast notifications (Sonner)
- Sentry
- Pagination (reusable)
- Search with filters & sorting (reusable)
- Settings page with tabs (Account, Security, Payment - Stripe minimal)
- CRUD features:
  - Comments (create, edit, delete, like)
  - Likes (toggle like/unlike)
  - Views (with deduplication to prevent spam)
  - Collections (create, organize, manage items)

## Stripe (Minimal)

Currently just infrastructure for learning Stripe API - syncs data between Stripe & DB but no actual features unlocked:

- Subscriptions (FREE, BASIC, PRO tiers with status tracking)
- One-time product purchases
- Credit/gem system (buy credits, spend credits, track balance)
- Credit transaction audit trail
- Basic protected pages that check if user owns product/subscription/credits
- **NO benefit unlocks** - subscription tier doesn't unlock features, products don't grant access, credits don't do anything yet

## Database Models

- **User** (username, email optional, password, avatar, roles, status, OAuth IDs, stripe customer ID, credits balance)
- **Session** (with geolocation, risk scoring, device detection, expiration)
- **Post** (title, content, soft delete, view/like counts)
- **Comment** (on posts/comments, soft delete, edit tracking)
- **Like** (on posts/comments, unique constraint)
- **View** (on posts, prevents duplicates)
- **Collection** (user-created, holds collection items)
- **CollectionItem** (links posts/comments to collections)
- **Subscription** (ties to Stripe subscription, tracks tier & status)
- **ProductPurchase** (ties to Stripe product)
- **CreditPurchase** & **CreditTransaction** (audit trail for credits)
- **AuditLog** (admin actions with changes tracked)
- **PasswordResetToken** & **EmailVerificationToken** (expiring tokens)
- **SupportTicket** (user support requests)
- **Setting** (key-value config store)
- **UsernameHistory** (tracks freed usernames)

## Misc

**Auth Philosophy:** I like old school way where username and password, no need to go to email to verify but gamble if u forget password then ur out of luck unless u optionally add email. i'd like to make websites with bare auth then add email option then add oauth option as i do think sign in with google is most convenient but i wouldnt sign up with my email for weird/sketchy site and i hate going to 10min email just to do 1 thing on website that requires login. its about skipping the liminal space but giving QoL options if u really like site.

**Postman JSON available** - For API testing

**Infrastructure:**

- PostgreSQL database
- Redis (caching & job queue)
- Docker setup with Redis + BullMQ worker
- Environment-based configuration for all major features
