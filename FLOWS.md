# FLOWS.md

Business logic decisions and non-obvious flows. Written when decisions are made, not retroactively.

AI agents should read this file before writing tests for any module.

---

## Auth & Registration

- Email is optional at registration — users can sign up with username + password only
- Unverified email gets silently stripped from the original holder when a different user verifies ownership of that same email
- OAuth login proves email ownership the same way: auto-link a provider only if an existing account already has that email **verified**; if the holder is unverified, strip the email and create a new OAuth user (do not merge into the unverified account)
- Forgot password works even if the requesting user's email is unverified
- A user whose email was stripped can still use their account normally — they just have no email attached

## Sessions

- The access token cookie must always be accompanied by a valid `sessionId` cookie — the strategy validates both
- Access JWT `sub` must equal `session.userId`; `req.user.sub` / `req.user.role` come from the session’s user row (not stale JWT claims)
- Refresh-by-session also requires the refresh JWT `sub` to match `session.userId`
- Revoking a session (`DELETE /sessions/:id`) sets `isValid=false` in DB; subsequent requests with that session's cookies return 401
- Users can only revoke their own sessions (403 if attempting another user's session)
- "Active now" on the admin dashboard = distinct users with a valid session touched within the configured window (default 5 min); guests are not included. `lastUsedAt` is updated on token refresh and throttled (~30s) on authenticated API requests.

## Content (Posts, Comments, Collections)

- Soft-delete sets `deleted=true` + `deletedAt` timestamp; the record stays in DB for potential admin recovery
- Soft-deleted resources return 404 to public requests (not 410) — 410 is reserved for actions on already-deleted resources (e.g. deleting a comment that is already deleted)
- Comments can be made on posts owned by the commenter (self-commenting is allowed)

---

_Add new entries here when you make a product decision that isn't obvious from reading the code._
