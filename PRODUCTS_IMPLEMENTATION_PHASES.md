# Paywalled Products Implementation - Phases & Checklist

## Overview

Build a SaaS product store with flexible payment methods (subscriptions, one-time money, credits) using markdown-based content management.

**Architecture**:

- Single creator (you) controls all products
- Content stored as markdown files with frontmatter
- Products seeded from markdown via script or web UI
- Users enrich with ownership status (like posts)
- Multiple payment methods: subscription tier, money, or credits

---

## Phase 1: Database Schema & Models ✅ COMPLETE

### Tasks

- [x] Create `Product` model
  - id (String @id)
  - slug (String @unique)
  - title, description, type
  - priceInCents (Int?)
  - priceInCredits (Int?)
  - requiresSubscription (Boolean)
  - requiredTier (SubscriptionTier?)
  - contentMarkdown (String) - raw markdown
  - published (Boolean)
  - createdAt, updatedAt

- [x] Update `ProductPurchase` model
  - Keep `@@unique([userId, productId])` - one purchase per user per product
  - Add `paymentMethod` enum (MONEY, CREDITS)
  - Make `productId`, `stripeId`, `paymentMethod` required
  - Ensure indexes on (userId, productId)

- [x] Create enums in schema
  - PaymentMethod (MONEY, CREDITS)
  - PurchaseStatus (ACTIVE, REFUNDED)

- [x] Run migration
  - `pnpm run migrate:dev -- --name "add_products_model"`

### Files to Edit

- `/apps/api/prisma/schema.prisma`

---

## Phase 2: Markdown Content System ✅ COMPLETE

### Tasks

- [x] Create products folder structure
  - `/apps/api/products/` (new folder)
  - Add sample markdown files with frontmatter

- [x] Create markdown example files
  - `typescript-course.md` (subscription: PRO)
  - `system-design-ebook.md` (money: $29.99)
  - `api-cheatsheet.md` (credits: 500)
  - `database-masterclass.md` (flexible: $49.99 or 2000 credits)

- [x] Install dependencies (backend only)
  - `gray-matter` - parse frontmatter and markdown from .md files

- [x] Add seedProducts() method to SeedService
  - Parse .md files from `/products` folder
  - Extract frontmatter → database fields
  - Store raw markdown in `contentMarkdown`
  - Handle upsert (update if exists)
  - Check PRODUCTS_SEEDED flag to prevent re-seeding

- [x] Integrate with existing seeding infrastructure
  - Added seedProducts() call to main.ts
  - Follows admin seeding pattern

- [x] Test seeding
  - Runs on application startup
  - Verify products in DB via studio

### Files to Create

- `/apps/api/products/*.md` (markdown files)
- `/apps/api/scripts/seed-products.ts`

### Files to Edit

- `/apps/api/package.json` (add scripts)

---

## Phase 3: Backend APIs - Products ✅ COMPLETE

### Tasks

- [x] Create `ProductsService`
  - [x] `findAll(userId?)` - list all published products (basic, no pagination)
  - [x] `findById(id, userId?)` - get single product by ID
  - [x] `findBySlug(slug, userId?)` - get product by slug
  - [x] `enrichProductsWithOwnership(products, userId?)` - add `ownedByMe` flag
  - [x] `getProductContent(productId, userId?)` - return markdown content with access validation

- [x] Create `ProductsController`
  - [x] `GET /api/products` - list all published products
  - [x] `GET /api/products/:idOrSlug` - get single by ID or slug (tries ID first, falls back to slug)
  - [x] `GET /api/products/:productId/content` - get markdown content (access controlled)

- [x] Key implementation details
  - [x] Enrich results with `ownedByMe` flag (checks ProductPurchase with status=ACTIVE)
  - [x] Filter by `published: true` for public endpoints
  - [x] Access validation: checks product purchase ownership OR subscription tier requirement
  - [x] No pagination yet (user will implement custom pagination)
  - [x] Uses CurrentUser decorator for optional auth

### Files Created

- [x] `/apps/api/src/modules/products/products.service.ts`
- [x] `/apps/api/src/modules/products/products.controller.ts`
- [x] `/apps/api/src/modules/products/products.module.ts` (auto-generated)

### Files Modified

- [x] `/apps/api/src/modules/products/products.service.ts` (implement service methods)
- [x] `/apps/api/src/modules/products/products.controller.ts` (implement endpoints)
- ProductsModule already imported in `/apps/api/src/app.module.ts`

---

## Phase 4: Backend APIs - Purchases & Payments

### Tasks

- [ ] Create purchase endpoints in `StripeService`
  - `buyProductWithMoney(userId, productId)` - create Stripe checkout
  - `buyProductWithCredits(userId, productId)` - deduct credits, create purchase
  - Validate ownership (prevent re-purchase if unique)
  - Validate pricing (product has that payment method)

- [ ] Create content delivery endpoint
  - `GET /api/products/:id/content` (or `:slug/content`)
  - Check: Is user authenticated?
  - Check: Does user own this product?
  - If yes: Return `{ markdown: "...", title: "..." }`
  - If no: Return 403 Forbidden

- [ ] Webhook integration
  - Update `handleWebhook` for `checkout.session.completed`
  - Create ProductPurchase with paymentMethod: MONEY
  - Store stripeId

- [ ] Validation layer
  - `canBuyWith(product, ...methods)` utility function
  - Prevent buying same product twice (if intended)
  - Check subscription tier requirement

### Files to Edit

- `/apps/api/src/modules/stripe/stripe.service.ts`
- `/apps/api/src/modules/stripe/stripe.controller.ts`

### Files to Create

- `/apps/api/src/common/payment/payment.utils.ts` (canBuyWith, validation)

---

## Phase 5: Frontend - Public Pages

### Tasks

- [ ] Update `/products` page
  - Fetch `/api/products` with pagination
  - Enrich with `ownedByMe` from API
  - Display product cards with:
    - Title, description, image
    - Price (money and/or credits)
    - Type badge (course, ebook, cheatsheet)
    - Subscription tier requirement (if any)
  - Link to product detail page

- [ ] Update `/products/[id]` page
  - Fetch product by ID or slug
  - Check `ownedByMe` from API
  - Determine which paywall to show:
    - Use `canBuyWith(product, ...)` utility
    - subscription-only → SubscriptionPaywall
    - money + credits → FlexiblePaywall
    - money-only → ProductPaywall
    - credits-only → CreditsPaywall
  - If owns: Fetch `/api/products/:id/content` → render markdown

- [ ] Create markdown parsing utilities
  - Manual parser: split markdown by patterns (headings, lists, paragraphs, code blocks)
  - Map parsed blocks to shadcn components (e.g., `<Card>` for code, `<p>` for paragraphs)
  - Extract and process video links (YouTube/Vimeo) → embedded iframes
  - Utilities in `/apps/web/src/lib/markdown.ts`

- [ ] Implement paywalls with purchase logic
  - SubscriptionPaywall - show tier requirement, link to /pricing
  - ProductPaywall - "Buy with Money" button
  - CreditsPaywall - "Spend Credits" button (check balance)
  - FlexiblePaywall - both options side-by-side

- [ ] Payment button integration
  - Money purchase → POST `/api/stripe/checkout`
  - Credits purchase → POST `/api/products/:id/buy-with-credits`
  - Show loading state
  - On success: refetch ownership, show success toast

### Files to Edit

- `/apps/web/src/app/(default)/products/page.tsx`
- `/apps/web/src/app/(default)/products/[id]/page.tsx`
- `/apps/web/src/components/paywalls/*.tsx` (all 4 paywalls)

### Files to Create

- `/apps/web/src/lib/markdown.ts` (rendering utilities)
- `/apps/web/src/lib/payment-methods.ts` (canBuyWith utility)
- `/apps/web/src/hooks/useProductPurchase.ts` (payment logic hook)

---

## Phase 6: Frontend - Admin Pages

### Tasks

- [ ] Create `/admin/(stripe)/products` page
  - Fetch all products from `/api/admin/products`
  - Display table: Title, Price, Tier, Published, Actions
  - Edit button → `/admin/(stripe)/products/[id]/edit`
  - Delete button with confirmation
  - Create button → `/admin/(stripe)/products/create`
  - Bulk actions (publish/unpublish)

- [ ] Create `/admin/(stripe)/products/create` page
  - Two options:
    - **Upload Markdown**: Parse .md file, extract frontmatter
    - **Web Form**: Fill fields manually
  - Form fields:
    - Title (required)
    - Description
    - Type (dropdown: course, ebook, cheatsheet)
    - Price in cents (optional)
    - Price in credits (optional)
    - Image upload
    - Content (markdown editor or raw text)
    - Requires subscription? (toggle)
    - Required tier (dropdown)
    - Published? (toggle)
  - Submit → `POST /api/admin/products`

- [ ] Create `/admin/(stripe)/products/[id]/edit` page
  - Same form as create
  - Pre-fill with product data
  - Submit → `PATCH /api/admin/products/:id`

- [ ] Enhance `/admin/(stripe)/products-purchased` page
  - Show purchase history
  - Filter by product
  - Show payment method (money/credits)
  - Refund button (if applicable)

### Files to Create

- `/apps/web/src/app/(admin)/admin/(stripe)/products/page.tsx`
- `/apps/web/src/app/(admin)/admin/(stripe)/products/create/page.tsx`
- `/apps/web/src/app/(admin)/admin/(stripe)/products/[id]/edit/page.tsx`
- `/apps/web/src/components/admin/ProductForm.tsx`
- `/apps/web/src/components/admin/MarkdownUpload.tsx`

### Files to Edit

- `/apps/web/src/app/(admin)/admin/(stripe)/products-purchased/page.tsx`

---

## Phase 7: Backend APIs - Admin CRUD

### Tasks

- [ ] Create admin endpoints in `StripeService` or new `AdminProductsService`
  - `POST /api/admin/products` - create
    - Validate auth (admin/creator only)
    - Validate pricing (at least one)
    - Create product in DB
    - Generate slug from title
  - `PATCH /api/admin/products/:id` - update
    - Verify product exists
    - Update fields
    - Regenerate slug if title changed
  - `DELETE /api/admin/products/:id` - delete
    - Soft delete or hard delete (your choice)
    - Mark as unpublished

  - `GET /api/admin/products` - list all (no pagination filtering)
    - Return all products (for dropdown/selects)
    - Include unpublished

- [ ] Auth/permission validation
  - Use middleware/guards to check admin role
  - Or simple check: only allow if user.id === CREATOR_ID

### Files to Create

- `/apps/api/src/modules/products/admin-products.controller.ts`
- `/apps/api/src/modules/products/admin-products.service.ts`

### Files to Edit

- `/apps/api/src/modules/products/products.controller.ts` (add admin routes)

---

## Phase 8: Content Delivery & Security

### Tasks

- [ ] Implement signed S3 URLs for downloads
  - Extract download links from markdown
  - Generate temporary signed URLs (15 min expiry)
  - Return via `/api/products/:id/download-link`

- [ ] Implement markdown content serving
  - `/api/products/:id/content` returns raw markdown
  - Frontend renders with `marked`
  - Process video embeds on client

- [ ] Security checks
  - All endpoints validate ownership
  - Verify product is published (if public endpoint)
  - Rate limit purchase endpoints
  - Prevent double-purchase (or allow if intentional)

### Files to Edit

- `/apps/api/src/modules/stripe/stripe.service.ts` (content methods)
- `/apps/api/src/common/s3/s3.service.ts` (signed URLs)

---

## Phase 9: Testing & Polish

### Tasks

- [ ] Test user flows
  - Browse `/products` → see owned flag enriched
  - Click product without owning → see correct paywall
  - Buy with money → verify purchase created, can access
  - Buy with credits → verify credits deducted, can access
  - Subscription-only product → verify tier check

- [ ] Test admin flows
  - Create product (markdown upload)
  - Create product (web form)
  - Edit product
  - Delete product
  - Verify slug generation

- [ ] Error handling
  - 403 on unauthorized purchase attempts
  - 404 on invalid product
  - User-friendly error messages
  - Handle markdown render errors gracefully

- [ ] Performance
  - Cache product renders (markdown → HTML)
  - Efficient ownership queries (use indexes)
  - Pagination for large product lists

- [ ] UX polish
  - Loading states on buttons
  - Success/error toasts
  - Refetch after purchase
  - Clear paywall messaging

### Files to Review

- All paywalls components
- Product listing/detail pages
- Admin forms
- Ownership enrichment logic

---

## Phase 10: Optional Enhancements (Post-MVP)

### Future Features

- [ ] Multi-page products (slug-suffix like `typescript-course_2`)
- [ ] Product categories/collections
- [ ] Creator statistics (sales, views, etc)
- [ ] Refund management UI
- [ ] Product analytics dashboard
- [ ] Gift product to user
- [ ] Product ratings/reviews
- [ ] Coupon codes for products
- [ ] Bundle products (buy multiple at discount)

---

## Quick Reference: Key Files

```
Backend:
├─ prisma/schema.prisma (Product, ProductPurchase)
├─ products/
│  ├─ typescript-course.md
│  ├─ system-design-ebook.md
│  ├─ api-cheatsheet.md
│  └─ database-masterclass.md
├─ scripts/seed-products.ts
├─ src/modules/products/
│  ├─ products.service.ts
│  ├─ products.controller.ts
│  └─ dto/
├─ src/modules/stripe/
│  ├─ stripe.service.ts (add purchase methods)
│  └─ stripe.controller.ts
└─ src/common/payment/payment.utils.ts

Frontend:
├─ src/app/(default)/products/page.tsx
├─ src/app/(default)/products/[id]/page.tsx
├─ src/app/(admin)/admin/(stripe)/products/
│  ├─ page.tsx
│  ├─ create/page.tsx
│  └─ [id]/edit/page.tsx
├─ src/components/paywalls/
│  ├─ SubscriptionPaywall.tsx
│  ├─ ProductPaywall.tsx
│  ├─ CreditsPaywall.tsx
│  └─ FlexiblePaywall.tsx
├─ src/components/admin/
│  ├─ ProductForm.tsx
│  └─ MarkdownUpload.tsx
├─ src/lib/markdown.ts
├─ src/lib/payment-methods.ts
└─ src/hooks/useProductPurchase.ts
```

---

## Estimated Timeline

| Phase                 | Time | Dependencies        |
| --------------------- | ---- | ------------------- |
| 1: Schema             | 1h   | None                |
| 2: Markdown           | 1-2h | gray-matter, marked |
| 3: APIs (Products)    | 2-3h | Phase 1             |
| 4: APIs (Purchases)   | 2-3h | Phase 1-3           |
| 5: Frontend (Public)  | 3-4h | Phase 3-4           |
| 6: Frontend (Admin)   | 2-3h | Phase 3-4           |
| 7: APIs (Admin)       | 1-2h | Phase 1             |
| 8: Content & Security | 1-2h | Phase 4             |
| 9: Testing & Polish   | 2-3h | All phases          |

**Total: ~16-24 hours**

---

## Start Checklist

Before starting Phase 1:

- [ ] Review this entire plan
- [ ] Understand markdown-based content approach
- [ ] Understand enrichment pattern (like posts)
- [ ] Understand payment method flexibility
- [ ] Understand admin + public routing
- [ ] Have sample markdown files ready (optional)

Ready to begin Phase 1?
