## Monno V2

**Auth & User Management**

- Login with username or email (currently just username)
- Email notifications for account status changes (banned, restored, deleted, etc)
- Make roles (mod) and status (banned, suspended) functional instead of being a placeholder
- Email rate limiting / request tracking (prevent spam on forgot password, verify email, etc) to run up resend API cost
- Make inputting password required to delete account

**Admin Dashboard**

- Custom domain/company email sending from admin panel
- Mass delete operations (findMany, deleteMany)
- Special admin buttons on public pages to remove content (comments, posts, etc) without entering dashboard

**Main Resources/Modules**

- View history feature (view history of posts, articles, etc)
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

**Testing**

- Integration tests (e.g., "can't delete another person's post") with vitest + supertest

**Refactor**

- Remove `Create/EditFoo` as `InlineCreate/EditFoo` can basically already do non-inline functionality. Need to go through out guide and repo and make all form use Inline and drop the name "Inline".

**Guides**

- Instructions for AI on how to make new email job
