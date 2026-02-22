# Purchased Products Implementation Plan

## Overview

Planning the implementation of paywalled content with multiple payment methods (subscriptions, one-time purchases, credits) to practice Stripe API and database design.

---

## Part 1: Initial Questions & Solutions

### Q1: Pagination for Owned Products

**Problem**: Initially thought pagination was needed to check if user owns a product (to validate against the entire list before checkout).

**Solution**:

- **Pagination is ONLY for displaying product listings**, not for ownership checks
- When checking if user owns a specific product: Query that ONE product
- Ownership check is a simple `findFirst` query on `ProductPurchase` table

```typescript
// ✅ Correct approach
async checkOwnership(userId: number, productId: string) {
  return await prisma.productPurchase.findFirst({
    where: { userId, productId },
  });
}

// ✅ Product listing with pagination
async listProducts(page: number) {
  return await prisma.product.findMany({
    skip: page * 10,
    take: 10,
  });
}
```

---

### Q2: Server-Side Paywall Protection

**Problem**: Frontend is compiled HTML/JS, so protecting content at component level is insufficient (data is still in the bundle).

**Solution**:
All content access must be **server-side validated**:

#### For Files (PDFs, Videos, Ebooks):

1. Store actual files in secure cloud storage (S3, Cloudinary, etc)
2. Backend endpoint validates ownership → returns signed/temporary URL
3. Frontend uses the signed URL to access file
4. Actual file never directly exposed to frontend

```typescript
// Backend endpoint
GET /api/products/:productId/content
- Check: Is user authenticated?
- Check: Does user own this product?
- If yes: Return signed S3 URL that expires in 15 mins
- If no: Return 403 Forbidden
```

#### For Text Content (Articles, Courses):

1. Store in database
2. Backend endpoint returns content only to owners
3. Content never baked into HTML at build time

```typescript
// Backend endpoint
GET /api/products/:productId/content
- Check: Does user own this?
- If yes: Return { content: "..." }
- If no: Return 403 Forbidden
```

---

### Q3: Payment Method Flexibility

**Vision**: Products can be purchased with:

- Money (Stripe checkout)
- Credits (deduct from user account)
- Either (user chooses)

**Pattern**: Like Amazon gift cards / store credit system

---

## Part 2: Schema Design

### Current Database Model

**Before**: `ProductPurchase` with unique constraint preventing multiple purchases

**Issues**:

- Can't buy same product twice (breaks commissioning, multiple enrollments)
- No way to track payment method (money vs credits)

### Updated Schema

```prisma
enum PaymentMethod {
  MONEY      // Paid with Stripe/card
  CREDITS    // Paid with user credits
}

enum PurchaseStatus {
  ACTIVE
  REFUNDED
}

model Product {
  id                    String   @id @default(cuid())
  creatorId            Int       // Who created this product
  creator              User     @relation("CreatedProducts", fields: [creatorId], references: [id])

  // Content & Info
  title                String
  description          String?
  imageUrl             String?
  contentUrl           String?   // S3 URL or similar

  // Pricing - can have both, one, or neither
  priceInCents         Int?      // null = can't buy with money
  priceInCredits       Int?      // null = can't buy with credits

  // Subscription requirement
  requiresSubscription  Boolean  @default(false)
  requiredTier         SubscriptionTier?  // PRO, BASIC, etc

  // Metadata
  published            Boolean  @default(false)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  purchases            ProductPurchase[]

  @@index([creatorId])
}

model ProductPurchase {
  id              Int     @id @default(autoincrement())
  userId          Int
  productId       String

  user            User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product         Product @relation(fields: [productId], references: [id])

  // Payment info
  paymentMethod   PaymentMethod    // MONEY or CREDITS
  amountPaid      Int              // In cents (if MONEY) or credits (if CREDITS)

  // Status
  status          PurchaseStatus @default(ACTIVE)
  refundedAt      DateTime?

  // Stripe tracking (if paid with money)
  stripeId        String? @unique

  purchasedAt     DateTime @default(now())

  // REMOVED: @@unique([userId, productId])
  // Now they CAN buy same product multiple times

  @@index([userId])
  @@index([productId])
  @@index([userId, productId])  // For quick ownership checks
}

// Add to User model:
createdProducts  Product[] @relation("CreatedProducts")
```

### Key Changes

✅ Removed unique constraint - allows multiple purchases  
✅ Added `paymentMethod` field - tracks HOW they paid  
✅ Added `creatorId` - tracks who created the product  
✅ Flexible pricing - can be money-only, credits-only, or both  
✅ Optional subscription requirement

---

## Part 3: Product Types & Display Logic

### Product Type Matrix

| Type                 | Money | Credits | Subscription | Display             |
| -------------------- | ----- | ------- | ------------ | ------------------- |
| Subscription-only    | ❌    | ❌      | ✅           | SubscriptionPaywall |
| One-time Purchase    | ✅    | ❌      | ❌           | ProductPaywall      |
| Credits-only         | ❌    | ✅      | ❌           | CreditsPaywall      |
| Flexible (Choose)    | ✅    | ✅      | ❌           | FlexiblePaywall     |
| Money + Subscription | ✅    | ❌      | ✅           | Special handling    |

### Frontend Paywall Components

- ✅ `SubscriptionPaywall.tsx` - Requires PRO/BASIC tier
- ✅ `ProductPaywall.tsx` - One-time money purchase
- ✅ `CreditsPaywall.tsx` - Credits-only purchase
- ✅ `FlexiblePaywall.tsx` - Money OR Credits (user chooses)

---

## Part 4: Pagination & Ownership Resolution

### Solution Architecture

```
User visits /products/prod_123
    ↓
    ├─ [Fast] Query ProductPurchase by (userId, productId)
    │   └─ Results in 1 row or 0 rows - no pagination needed
    │
    └─ [Can be slow] List /products with pagination
        └─ Paginate through product catalog (10 per page)
```

**Key Insight**: Ownership check is NOT a list operation - it's a single lookup

---

## Part 5: Data Seeding

### Approach 1: Script-based Seeding (Recommended for Learning)

```typescript
// scripts/seed.ts
async function seed() {
  const products = [
    {
      title: "Advanced TypeScript",
      description: "Master advanced patterns",
      requiresSubscription: true,
      requiredTier: "PRO",
      imageUrl: "...",
      contentUrl: "...",
      creatorId: 1, // Your admin user
    },
    {
      title: "System Design Ebook",
      description: "Complete guide",
      priceInCents: 2999,
      priceInCredits: null,
      contentUrl: "s3://bucket/ebook.pdf",
      creatorId: 1,
    },
    // ... more products
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }
}
```

Run: `pnpm run seed`

### Approach 2: Admin Creator Portal (More Scalable)

Build `/admin/products` CRUD interface for creators to manage their own products

---

## Part 6: Multiple Purchases Problem

### Use Case

- Commissions (buy artwork multiple times)
- Courses (can re-enroll)
- Services (can purchase multiple times)

### Solution

Removing `@@unique([userId, productId])` allows multiple rows for same product

```typescript
// Same user, same product, different times
const purchases = await prisma.productPurchase.findMany({
  where: { userId: 123, productId: "prod_abc" },
});
// Returns: [Purchase1, Purchase2, Purchase3, ...]
```

---

## Part 7: Admin/Creator Portal (Future)

### Minimal Setup for Now

Just use the seed script

### Full Creator Portal (When Ready)

```
/admin/dashboard
  /products
    /create              POST /api/admin/products
    /list               GET /api/admin/products?creatorId=X
    /[id]/edit          PATCH /api/admin/products/[id]
    /[id]/delete        DELETE /api/admin/products/[id]
```

**Requirements**:

- Verify user is creator (check `creatorId`)
- Only show own products
- Validate pricing
- Update content URLs

---

## Implementation Checklist

### Phase 1: Schema & Data

- [ ] Update Prisma schema with new Product model
- [ ] Add `creatorId`, `paymentMethod`, `requiredTier` fields
- [ ] Remove unique constraint on ProductPurchase
- [ ] Run migration: `pnpm run migrate:dev`
- [ ] Create seed script with test products
- [ ] Run seed: `pnpm run seed`

### Phase 2: Backend APIs

- [ ] `GET /api/products` - List with pagination
- [ ] `GET /api/products/:id` - Get single product
- [ ] `GET /api/products/:id/check-ownership` - Check if user owns it
- [ ] `POST /api/products/:id/purchase-with-money` - Stripe checkout
- [ ] `POST /api/products/:id/purchase-with-credits` - Deduct credits
- [ ] `GET /api/products/:id/content` - Serve protected content

### Phase 3: Frontend Paywalls

- [ ] Implement SubscriptionPaywall logic
- [ ] Implement ProductPaywall logic
- [ ] Implement CreditsPaywall logic
- [ ] Implement FlexiblePaywall logic
- [ ] Ownership check on product page
- [ ] Hook up purchase endpoints

### Phase 4: Stretch (Creator Portal)

- [ ] `/admin/products/create` page
- [ ] `/admin/products/[id]/edit` page
- [ ] Backend CRUD endpoints with creator validation
- [ ] Upload/manage product content

---

## Key Design Decisions

| Decision                    | Rationale                                                        |
| --------------------------- | ---------------------------------------------------------------- |
| Pagination for listing only | Ownership checks are single lookups, not list operations         |
| `PaymentMethod` enum        | Track how purchase was paid (affects refund logic, analytics)    |
| Remove unique constraint    | Support use cases like commissions, re-enrollment                |
| Optional pricing fields     | Flexibility for different product types (subscription-only, etc) |
| `creatorId` on Product      | Support multiple creators, creator dashboards in future          |
| Seed script for now         | Simple, works for learning; admin portal is future enhancement   |

---

## Next Steps

1. **Update Prisma schema** (add Product model, update ProductPurchase)
2. **Create migration**
3. **Create seed script** with test products
4. **Implement backend APIs** for checking ownership and returning content
5. **Hook up frontend** paywalls to backend endpoints
6. **Test each paywall type**
