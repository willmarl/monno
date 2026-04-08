# write-tests

Generate integration tests for a NestJS module using real-DB testing patterns, with BV/EP/pairwise coverage.

**Usage:** `/write-tests <module-name>`
**Example:** `/write-tests articles`

---

## Step 1 — Read context before writing anything

Read ALL of these before touching a test file:

1. `FLOWS.md` at the repo root — business logic decisions that aren't obvious from code
2. The module's controller: `apps/api/src/modules/$ARGUMENTS/$ARGUMENTS.controller.ts`
3. The module's service: `apps/api/src/modules/$ARGUMENTS/$ARGUMENTS.service.ts`
4. All DTOs in `apps/api/src/modules/$ARGUMENTS/dto/`
5. The Prisma schema for any models this module touches: `apps/api/prisma/schema.prisma`
6. One or two existing integration tests for reference pattern — e.g. `apps/api/src/modules/posts/posts.controller.integration.spec.ts`

Do not start writing until you have read all of the above.

---

## Step 2 — Ask before writing (business logic probe)

After reading the code, identify any flows that depend on product decisions rather than pure technical logic. These are flows where the "right answer" is a judgment call, not derivable from code alone.

Output a short list in plain English:

```
Before I write tests, I need to confirm my understanding of a few flows:

1. [your guess about a non-obvious behavior] — is this correct?
2. [another guess] — is this correct?
3. [anything you're unsure about] — what should happen here?
```

Wait for the user to confirm or correct before proceeding.

Examples of things to probe:
- What happens when a user tries to act on a soft-deleted resource they own?
- Can a user interact with their own resource in the same way as others? (e.g. comment on own post)
- Is there any admin-override behavior on this resource?
- Are there any state transitions I should know about (e.g. draft → published)?

If all flows are obvious from the code and FLOWS.md, skip this step and say so.

---

## Step 3 — Plan the test cases before writing code

List every test case you plan to write, grouped by route. Use plain English — no code yet. The user should be able to read this list and catch missing or wrong scenarios without reading any assertions.

Format:
```
POST /articles
  ✓ 201 authenticated user, valid body
  ✓ 401 no auth cookie
  ✓ 400 missing required field: title
  ✓ 400 title at min boundary (0 chars) — @MinLength(1)
  ✓ 400 title above max boundary (151 chars) — @MaxLength(150)
  ✓ 400 invalid enum value for `status` field

GET /articles/:id
  ✓ 200 returns article data
  ✓ 404 non-existent id (999999)
  ✓ 404 soft-deleted article

... etc
```

Wait for the user to review and approve the plan before writing code.

---

## Step 4 — Write the test file

File location: `apps/api/src/modules/$ARGUMENTS/$ARGUMENTS.controller.integration.spec.ts`

### Required imports (always use these exact imports)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp, TestApp } from 'src/test-utils/create-test-app';
import { cleanupUser } from 'src/test-utils/cleanup';
import { createAndLogin, TestUser } from 'src/test-utils/auth-helper';
```

### Required structure

```typescript
describe('XxxController (integration)', () => {
  let testApp: TestApp;
  let ownerUser: TestUser;
  let ownerCookies: string;
  // Add otherUser/otherCookies if ownership enforcement exists

  beforeAll(async () => {
    testApp = await createTestApp();

    const owner = await createAndLogin(testApp.app, testApp.prisma, {
      username: `xxx_owner_${Date.now()}`, // MUST be ≤ 32 chars total
    });
    ownerUser = owner.user;
    ownerCookies = owner.cookieHeader;
  });

  afterAll(async () => {
    await cleanupUser(testApp.prisma, ownerUser.id);
    await testApp.app.close();
  });
```

### Username length rule — critical

Usernames have `@MaxLength(32)` in LoginDto. Count: `prefix_` + 13 digits (Date.now()) must be ≤ 32 chars. That gives you **19 chars max for the prefix including the trailing underscore**.

Examples:
- `xxx_owner_` = 10 chars + 13 = 23 ✓
- `xxx_other_` = 10 chars + 13 = 23 ✓
- `sessions_intruder_` = 18 chars + 13 = 31 ✓ (tight)
- `sessions_revoke_test_` = 21 chars + 13 = 34 ✗ FAILS

### Response format

All responses are wrapped by `TransformInterceptor`:
```json
{ "success": true, "message": "OK", "data": <actual payload> }
```
Always assert `res.body.data`, not `res.body` directly.

### Ownership pattern

For every route that is ownership-protected, test all three actors:
```typescript
// 1. Owner — should succeed
.set('Cookie', ownerCookies) → expect 200/201/204

// 2. Authenticated non-owner — should be forbidden
.set('Cookie', otherCookies) → expect 403

// 3. Unauthenticated — should be unauthorized
// (no .set('Cookie', ...)) → expect 401
```

### Soft-delete pattern

If the resource has a `deleted` field, test:
- GET after soft-delete → 404
- Action on soft-deleted resource → appropriate error (404 or 410)
- If idempotency matters: delete an already-deleted resource → 410

### Cleanup discipline

- Resources created via HTTP in a test: delete in the same `it` block after asserting
- Resources created in `beforeAll`: delete in `afterAll`
- Use `prisma.xxx.delete({ where: { id } })` not `deleteMany` unless you need it
- Users: always use `cleanupUser(testApp.prisma, userId)` — this cascades sessions, likes, comments

---

## Step 5 — Coverage checklist (apply to every route)

For each route, run through this before declaring done:

### Validation (from DTO `@` decorators)
- [ ] Missing each required field → 400
- [ ] Invalid enum value → 400
- [ ] String below `@MinLength` → 400
- [ ] String at `@MinLength` (boundary, valid) → 201/200
- [ ] String at `@MaxLength` (boundary, valid) → 201/200
- [ ] String above `@MaxLength` → 400

### Auth
- [ ] No cookie → 401
- [ ] Owner → success
- [ ] Authenticated non-owner → 403 (if ownership-protected)

### State
- [ ] Resource does not exist → 404
- [ ] Resource is soft-deleted → 404 or 410 depending on context
- [ ] Duplicate creation (if unique constraint exists) → 409

### Pairwise (for logic with 3+ independent boolean factors)
- [ ] List all factors, write the full pairwise table, then pick the combinations not already covered by the above cases

---

## What NOT to do

- Do not mock Prisma. These are integration tests — real DB only.
- Do not use `import * as request from 'supertest'` — use `import request from 'supertest'`
- Do not write unit tests for service methods here. That's a separate file.
- Do not add tests for scenarios the code explicitly doesn't handle (e.g. no rate limit tests unless rate limiting is configured for the module)
- Do not assert on fields you haven't verified exist in the response — read the service's select/return shape first
