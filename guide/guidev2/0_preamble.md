# preamble

> **Entry point:** Start at [`ROUTER.md`](./ROUTER.md). Resolve your media letter (`a`/`b`/`c`) there. This preamble is schema-adapt context only — do not treat the planning checklists below as Session 2 work (those belong to Session 1).

note everything here assumes the human or AI has prisma schema model ready (resource is in schema.prisma and the migrations has been set), for example:

```prisma
enum ResourceType {
  POST
  COMMENT
  {{resource}}
}

model User {
  ...
  {{resource}} {{resource}}[]
}

enum {{resource}}Status {
  DRAFT
  PUBLISHED
  ARCHIVED
  SCHEDULED
}

model {{resource}} {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  status    {{resource}}Status @default(DRAFT)
  creatorId Int
  creator User @relation(fields: [creatorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deleted   Boolean   @default(false)
  deletedAt DateTime?
  likeCount Int       @default(0) // optional
  viewCount Int       @default(0) // optional
}
```

example :

```prisma
enum ResourceType {
  POST
  COMMENT
  ARTICLE
}

model User {
  articles Article[]
...
}

enum ArticleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  SCHEDULED
}

model Article {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  status    ArticleStatus @default(DRAFT)
  creatorId Int
  creator User @relation(fields: [creatorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deleted   Boolean   @default(false)
  deletedAt DateTime?
  likeCount Int       @default(0) // optional
  viewCount Int       @default(0) // optional
}
```

Note depending if human request simple single file upload, or complex multi file upload, schema will differ.
If its simple single file upload then resource will have this addition in model:

> replace 'Article' with correct {{resource}} name

```prisma
model Article {
  ...
  imagePath     String?
}
```

If its complex multi file upload then resource will have this addition in model:

> replace 'Article' with correct {{resource}} name

```prisma
model Article {
  ...
  media     Media[]
}

model Media {
  ...
  article   Article? @relation(fields: [articleId], references: [id], onDelete: Cascade)
  articleId Int?

  @@index([articleId])
  @@index([articleId, sortOrder])
}
```

This guide is meant for making new CRUD resource type/module using the current infrastructure that has auth, users, and guards already made. This guide is not meant for sophisticated measures such as cascading business logic, subscription/billing, microservices, and other super advance stuff.
If human has not provided you context of the schema model. stop, don't proceed to do any steps. ask for model context.

Note anytime im using example, im referencing Article. Adapt appropriately for example instead of `createdAt` it may be `purchasedAt` but concept is the same. there could be more or less properties to have. if unsure check with human to make sure you can accurately see their vision. for instance most schemas will not have image/imagePath. I am providing image to cover what to do if schema has some sort of media upload.

The example 'Article' I use is suppose to cover a good amount of scenarios. I don't expect most new resource to have media or enum of status so in examples if new source doesn't have need for enum or media upload can ignore that part of code.

## File Upload Path Reference

Upload variants are **separate files**, not inline forks. Resolve once in `ROUTER.md`, then only open your letter:

| Letter | `fileUpload` | Files you may open                                      |
| ------ | ------------ | ------------------------------------------------------- |
| **a**  | `none`       | `1a.md`, `2a.md`, `3a.md`, `5a.md`, `13a.md`, …         |
| **b**  | `simple`     | `1b.md`, `2b.md`, `3b.md`, `5b.md`, `13b.md`, …         |
| **c**  | `complex`    | `1c.md`, `2c.md`, `3c.md`, `5c.md`, `8c.md`, `13c.md`, … |

**Never** open a sibling letter file. Shared chapters (`4.md`, `6.md`, …) have no letter — still skip gated subsections (admin/search/actions) per ROUTER.

---

**Adapting from the human's schema**: When the human provides their actual schema, use it as the source of truth for field names, types, and structure. The Article example in this guide is just a template — replace fields accordingly:

- Regular scalar fields (`String`, `Int`, `Boolean`, `DateTime`) → include in DTOs with appropriate validators
- Array fields (`String[]`, `Int[]`) → use `@IsArray()` + `@IsString({ each: true })` / `@IsInt({ each: true })` in DTOs
- Optional fields (`String?`) → wrap with `@IsOptional()` in DTOs
- Enum fields → import the enum from `generated/prisma/client` and use `@IsEnum()`
- Relation fields (`inventory Inventory[]`, `creator User`) → **do NOT include in create/update DTOs**. Relations are managed separately through their own endpoints or handled automatically by the service logic (e.g. `creatorId` comes from the authenticated user, not the request body)
- Auto-managed fields (`id`, `createdAt`, `updatedAt`, `deletedAt`) → **do NOT include in DTOs**, these are set by Prisma/Postgres automatically

Similarly, if schema has `viewCount Int @default(0)`, that signals the resource has a view count feature. Do not automatically add view count logic unless human explicitly requested it — the field may just be there for future use or added by habit.

> **Default rule**: if the human did not explicitly mention a feature, **assume it is NOT wanted**. Do not include it speculatively. When in doubt, ask.

## checklist of features

> Before implementing anything, confirm this checklist with the human. Mark each item as included or excluded. Steps marked **optional** throughout this guide should **only be implemented if the human explicitly requested it**.

**backend**

- basic CRUD
  - offset pagination (optional — clarify if not mentioned)
  - cursor pagination (optional — only add if human explicitly requests it)
  - could be both offset and cursor but clarify since unusual request (optional)
- file/media upload (optional — only add if human explicitly requests it)
- search (optional — clarify if not mentioned)
- admin (optional — only add if human explicitly requests it)
- able to like (optional — only add if human explicitly requests it)
- has view count (optional — only add if human explicitly requests it)
- able to comment on (optional — only add if human explicitly requests it)
- able to add to collection (optional — only add if human explicitly requests it)

**frontend**

- offset or cursor pagination or both
  - if cursor whether to have load more button or infinite scroll or both
- resource actions (only include what was requested in backend)
  - likes
  - views
  - comments
  - collections
- admin dashboard

## example of what human should ask you

```
Here is my blog schema model in schema.prisma can you make CRUD for it?
I want it to have:

- offset pagination
- search
- file upload for picture
- admin
```

## pre-implementation clarification checklist

Go through this checklist with the human **before writing any code**. Do not proceed until all items are confirmed.

**schema**

- [ ] Is the Prisma schema model provided?

**backend**

- [ ] Should there be an **admin** variant? (admin service + controller)
- [ ] Is there **file/media upload**?
  - [ ] If yes: what kind? Generic image? Video? Something more complex? Any processing (resize, format conversion, file size limit)?
- [ ] **Pagination** for `findAll` and `findByUserId` — none (primitive), offset, cursor, or both? (same strategy for both)
- [ ] Should there be a **search** endpoint?
  - [ ] If yes: should there also be a **search suggest** (autocomplete) endpoint?
- [ ] **Resource actions** — which of the following?
  - [ ] Likes
  - [ ] Views
  - [ ] Comments
  - [ ] Collections

**frontend**

- [ ] Do you want frontend implemented at all, or just the backend?
- [ ] If cursor pagination: **load more button**, **infinite scroll**, or both?
- [ ] Should the resource list appear on the **user profile page**?
- [ ] **Frontend resource actions** — confirm same set as backend (likes UI, views UI, comments UI, collections UI)
- [ ] **Admin dashboard** page + data table?

Once confirmed, summarize back to the human what you will implement before starting.

## implementation plan file

After confirming everything with the human, create a `CRUD-plan.md` file at the root of the project (or wherever makes sense). This file tracks what was agreed on so you don't lose context across a long conversation.

```md
# CRUD Plan — {{resource}}

## Resource

- Model: {{resource}}
- Prisma table: {{resource}} (plural: {{resource}}s)
- Route prefix: /{{resource}}

## Backend

- [ ] Basic CRUD
- [ ] Offset pagination (findAll, findByUserId)
- [ ] Cursor pagination (findAll, findByUserId)
- [ ] File/media upload
- [ ] Search
- [ ] Admin (service + controller + module)
- [ ] Likes
- [ ] Views
- [ ] Comments
- [ ] Collections

## Frontend

- [ ] Offset pagination
- [ ] Cursor pagination (load more / infinite scroll)
- [ ] Likes UI
- [ ] Views UI
- [ ] Comments UI
- [ ] Collections UI
- [ ] Admin dashboard page + data table

## Notes

(anything human clarified that doesn't fit above — e.g. "image field is optional", "no status enum", "admin only needs read/delete")
```

Fill in the checkboxes based on what was confirmed. Check them off as you complete each part. Update the Notes section whenever the human clarifies something mid-implementation.


<!-- NEXT: 1.md then 1{L}.md -->
