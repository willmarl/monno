## Media/File Uploads

**Refactor article `imagePath` → `Media` table relationship**

Currently articles store a single `imagePath: String?`. This should be migrated to a dedicated `Media` model.

**Decision history:**

| Option   | Description                                                        | Rejected because                                                                                  |
| -------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| A        | Flat columns on model (`imagePath`, `thumbnailPath`, `blurHash`)   | Every new variant = migration + code change everywhere. Doesn't generalize to Posts, Videos, etc. |
| C        | Polymorphic `Media` with `resourceType`/`resourceId` string fields | Polymorphic relations in Prisma are awkward, join logic becomes messy, no referential integrity   |
| **B** ✅ | Dedicated `Media` model with FK on each resource model             | Chosen — see below                                                                                |

**Chosen approach — `Media` table:**

```prisma
model Media {
  id        Int      @id @default(autoincrement())
  original  String   // full res URL
  thumbnail String?  // small preview
  blurHash  String?  // low quality image placeholder
  mimeType  String   // "image/webp", "video/mp4"
  width     Int?
  height    Int?
  sizeBytes Int?
  createdAt DateTime @default(now())

  article   Article? @relation(fields: [articleId], references: [id])
  articleId Int?     @unique // @unique = one-to-one, remove for gallery (one-to-many)
}
```

**Why:**

- New variants (`censored`, `hd`, `compressed`) = new column on `Media` only, zero touch on `Article`
- Reusable — `Post`, `Comment`, `User` can all grow a `mediaId` FK
- `mimeType` naturally extends to video without a new model
- `blurHash` enables instant skeleton previews before image loads (eliminates layout shift)
- `width`/`height` lets frontend reserve layout space before image loads

---

## Monno V2

**Auth & User Management**

- Login with username or email (currently just username)
- Email notifications for account status changes (banned, restored, deleted, etc)
- Make roles (mod) and status (banned, suspended) functional instead of being a placeholder

**Admin Dashboard**

- Custom domain/company email sending from admin panel
- Mass delete operations (findMany, deleteMany)
- Special admin buttons on public pages to remove content (comments, posts, etc) without entering dashboard

**Main Resources/Modules**

- Search and likes for collections
- Private/public visibility toggle for posts, collections, likes
  - Ensure private content isn't included in collections
  - Render as "private/deleted" if changed from public to private
- Report feature (post, user, comment, etc)

**Sub Resources/Modules**

- Comments on comments
- Reactions system (like, dislike, react emoji) instead of just binary likes
  - Update posts and comments to support reactions

**Worker (BullMQ)**

- Notification system (email/push and UI component)
  - Trigger on likes, views, comments, etc
  - Expand settings to toggle which notifications to receive

**3rd Party**

- Stripe admin dashboard for admin actions (refund, view invoice, cancel payment, etc)

**Documentation & Testing**

- Make good docs/tutorials
- Integration tests (e.g., "can't delete another person's post") with vitest + supertest
