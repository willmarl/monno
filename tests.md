## how to run tests

- **Unit tests** :
  1. `cd apps/api`
  2. `pnpm run test`
- **Integration tests** (real DB required. Not mock DB):
  1. `pnpm run db:test:up` from repo root (starts test DB on port 5433)
  2. `cd apps/api`
  3. `pnpm run test:integration`
- **API tests** : start runner (recursive) on tests folder. (i use bruno)
- **E2E tests** :
  - **reminders**:
    - temporarily increase rate limiting in `api/.env`
    - change username in `apps/web/tests/constants.ts` periodically to avoid flakiness (particularly with `collections.spec.ts`)
    - i do have `fullyParallel: true,`. may want to switch that off `apps/web/playwright.configs.ts`
    - also have firefox commented out. **run only one browser at a time** running chrome and firefox (especially with parallel on) causes test flakiness due to shared test user
  1. make sure backend is running
  2. `cd apps/web`
  3. `pnpm run tests:e2e`
     alternatively directly using playwright
  4. `cd apps/web/test`
     2a. `pnpm playwright test auth.spec.ts`
     2b. `pnpm playwright test`

## coverage table

| Feature                | Unit Tests | API Tests | E2E Tests |
| ---------------------- | :--------: | :-------: | :-------: |
| **Auth**               |
| Register               |     -      |    ✅     |    ✅     |
| Login                  |     ✅     |    ✅     |    ✅     |
| Logout                 |     -      |    ✅     |    ✅     |
| Logout All Sessions    |     -      |    ✅     |     -     |
| Refresh Token          |     ✅     |    ✅     |     -     |
| Password Reset         |     ✅     |     -     |     -     |
| Get Sessions           |     -      |    ✅     |     -     |
| Email Verification     |     -      |     -     |     -     |
| OAuth (Google/GitHub)  |     -      |     -     |     -     |
| **Posts**              |
| Create Post            |     ✅     |    ✅     |    ✅     |
| Read Post              |     ✅     |    ✅     |    ✅     |
| Update Post            |     ✅     |    ✅     |    ✅     |
| Delete Post (Soft)     |     ✅     |    ✅     |    ✅     |
| Like Post              |     -      |    ✅     |    ✅     |
| View Post              |     -      |    ✅     |     -     |
| Search Posts           |     -      |    ✅     |     -     |
| **Users**              |
| Create Account         |     -      |    ✅     |    ✅     |
| View Profile (Me)      |     -      |    ✅     |    ✅     |
| View Public Profile    |     -      |     -     |    ✅     |
| Update Profile         |     ✅     |    ✅     |    ✅     |
| Change Password        |     ✅     |    ✅     |    ✅     |
| Delete Account (Soft)  |     ✅     |     -     |     -     |
| Search Users           |     -      |    ✅     |     -     |
| Avatar Upload          |     -      |     -     |     -     |
| **Collections**        |
| Create Collection      |     -      |    ✅     |    ✅     |
| Add Post to Collection |     -      |    ✅     |    ✅     |
| View Collection        |     -      |    ✅     |    ✅     |
| Update Collection      |     -      |    ✅     |     -     |
| Delete Collection      |     -      |    ✅     |     -     |
| **Comments**           |
| Create Comment         |     -      |    ✅     |     -     |
| Edit Comment           |     -      |    ✅     |     -     |
| Delete Comment (Soft)  |     -      |    ✅     |     -     |
| Like Comment           |     -      |    ✅     |     -     |
| **Error Handling**     |
| 400 Bad Request        |     -      |    ✅     |     -     |
| 401 Unauthorized       |     -      |    ✅     |    ✅     |
| 403 Forbidden          |     -      |    ✅     |     -     |
| 404 Not Found          |     -      |    ✅     |    ✅     |

## Still Need Testing

- Admin dashboard (users, posts, comments, logs, support, stats)
- Delete account
- Email verification
- Changing password
- Session management (logging out other sessions)
- Support ticket feature
