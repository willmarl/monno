# FLOWS.md

Business logic decisions and non-obvious flows. Written when decisions are made, not retroactively.

AI agents should read this file before writing tests for any module.

---

## Auth & Registration

- Email is optional at registration — users can sign up with username + password only
- Unverified email gets silently stripped from the original holder when a different user verifies ownership of that same email
- Forgot password works even if the requesting user's email is unverified
- A user whose email was stripped can still use their account normally — they just have no email attached

## Sessions

- The access token cookie must always be accompanied by a valid `sessionId` cookie — the strategy validates both
- Revoking a session (`DELETE /sessions/:id`) sets `isValid=false` in DB; subsequent requests with that session's cookies return 401
- Users can only revoke their own sessions (403 if attempting another user's session)

## Content (Posts, Comments, Collections)

- Soft-delete sets `deleted=true` + `deletedAt` timestamp; the record stays in DB for potential admin recovery
- Soft-deleted resources return 404 to public requests (not 410) — 410 is reserved for actions on already-deleted resources (e.g. deleting a comment that is already deleted)
- Comments can be made on posts owned by the commenter (self-commenting is allowed)

---

_Add new entries here when you make a product decision that isn't obvious from reading the code._
