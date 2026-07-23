# How to add a new email job

**Audience:** humans and AI agents adding transactional mail in Monno.

You almost never add a new BullMQ job name. Emails use one shared job: `send-email`. The API builds HTML, enqueues it; the worker sends via Resend. **Do not touch the worker** unless you are changing how all email is delivered.

---

## Architecture (read once)

```
API service
  → build HTML from apps/api/src/common/email-templates/*
  → QueueService.enqueueEmail(to, subject, html, templateName)
       job name: always "send-email"
       payload: { to, subject, htmlContent, templateName, fromEmail?, fromName? }
  → Redis / BullMQ
  → worker handlers/email.handler.ts → Resend
```

| Piece | Path | Role |
|-------|------|------|
| Templates | `apps/api/src/common/email-templates/` | Pure HTML string functions + shared chrome (`emailConfig.ts`) |
| Enqueue | `apps/api/src/modules/queue/queue.service.ts` → `enqueueEmail` | Adds `send-email` job; stamps branding from `getEmailBranding()` |
| Optional helper services | `apps/api/src/common/email/*-email.service.ts` | Skip-if-no-email, subjects, logo, try/catch |
| Module | `apps/api/src/common/email/email.module.ts` | Register/export Nest providers |
| Worker | `apps/worker/src/handlers/email.handler.ts` | Already registered as `"send-email"` — leave alone |

Branding (`from` name/address/support) comes from admin Setting overrides → env (`RESEND_*`). Templates read `getEmailBranding()` via `emailConfig`. Job payload carries `fromEmail` / `fromName` so the worker uses the values at enqueue time.

---

## Checklist (copy this)

1. [ ] Add `apps/api/src/common/email-templates/YourThing.ts`
2. [ ] Re-export from `email-templates/index.ts`
3. [ ] Call `queueService.enqueueEmail(...)` from a service (inline or dedicated `*EmailService`)
4. [ ] If new Nest provider: register + export in `EmailModule`, import `EmailModule` / inject where needed
5. [ ] Skip when recipient has no email; escape user-controlled strings; don’t fail the main action if enqueue fails
6. [ ] **No worker changes.** No new job type. Use a unique kebab-case `templateName` for logs/Bull Board
7. [ ] Local check: API + worker + Redis up; trigger the action; confirm job in Bull Board and inbox (or Resend dashboard)

---

## Step 1 — Template

Create a file next to the others. Use shared chrome; keep it a **pure function** (no Nest DI).

```ts
// apps/api/src/common/email-templates/WidgetShipped.ts
import { getEmailHead, getEmailHeader, getEmailFooter } from './emailConfig';

export interface WidgetShippedEmailProps {
  userName: string;
  trackingUrl: string;
  logoUrl?: string;
}

export const widgetShippedEmailTemplate = (
  props: WidgetShippedEmailProps,
): string => `
<!DOCTYPE html>
<html>
  ${getEmailHead()}
  <body>
    <div class="container">
      <div class="box">
        ${getEmailHeader(props.logoUrl)}
        <p class="heading">Your widget is on the way</p>
        <p class="paragraph">Hi ${props.userName}, your order has shipped.</p>
        <a href="${props.trackingUrl}" class="button button-primary">Track shipment</a>
        ${getEmailFooter()}
      </div>
    </div>
  </body>
</html>
`;
```

Reuse CSS classes from `emailConfig` (`.heading`, `.paragraph`, `.button`, `.button-primary`, `.alert-box`, etc.). Prefer editing `emailConfig.ts` for global look, not one-off inline styles.

Export from `index.ts`:

```ts
export {
  widgetShippedEmailTemplate,
  type WidgetShippedEmailProps,
} from './WidgetShipped.js';
```

(Use the `.js` suffix in exports — Nest/TS ESM convention in this repo.)

---

## Step 2 — Enqueue (two patterns)

### A. Inline (simple, one call site)

Same pattern as verify-email / password-reset:

```ts
const html = widgetShippedEmailTemplate({
  userName: escapeHtml(user.username),
  trackingUrl,
  logoUrl: this.logoService.getLogoUrl(),
});

await this.queueService.enqueueEmail(
  user.email,
  'Your widget shipped',
  html,
  'widget-shipped', // templateName — logging only, not a new job type
);
```

Inject `QueueService` + usually `LogoService`.

### B. Dedicated email service (reuse / status / Stripe style)

When several call sites share skip/subject logic, add e.g. `apps/api/src/common/email/widget-shipped-email.service.ts` modeled on:

- `account-status-email.service.ts`
- `stripe-purchase-email.service.ts`

Then register in `email.module.ts` providers + exports.

---

## Step 3 — Rules that prevent bugs

| Rule | Why |
|------|-----|
| Skip if `!email` | Auth allows username-only accounts |
| Escape user/content strings put into HTML | XSS in mail clients / stored values |
| `try/catch` around enqueue; log warn; don’t throw | Token creation / purchase / status change must not roll back because Redis/Resend failed |
| Never log reset/verify tokens or full magic URLs | Security — see Phase 0 |
| Unique kebab-case `templateName` | Bull Board + worker logs (`verify`, `account-status-changed`, `stripe-purchase-receipt`, …) |
| Absolute URLs with `FRONTEND_URL` | Relative links break in inboxes |
| Do not add `"widget-shipped"` to worker `handlers/index.ts` | That map is **job names**, not template names. Job stays `"send-email"` |

---

## Step 4 — What you do **not** do

- Do not create a new Bull queue.
- Do not add a worker handler per email type.
- Do not send from the API with Resend directly for product mail (queue keeps sends off the request path and retries).
- Do not put secrets in the HTML body beyond what’s required for the user action (prefer opaque tokens in query strings already issued by your domain service).

Admin “compose / test email” already uses `enqueueEmail` — copy that only if you’re building another admin blast tool.

---

## Existing templates (reference)

| `templateName` | Template file | Typical trigger |
|----------------|---------------|-----------------|
| `welcome` / similar | `Welcome.ts` | Registration (if used) |
| `verify` | `VerifyEmail.ts` | Email verification |
| `reset-password` (check call site) | `ResetPassword.ts` | Password reset |
| `suspicious-login` | `SuspiciousLogin.ts` | Risky session |
| engagement names | `EngagementNotification.ts` | Like/comment prefs |
| `account-status-changed` | `AccountStatusChanged.ts` | Ban/suspend/restore |
| `stripe-purchase-receipt` | `PurchaseReceipt.ts` | Checkout webhook |
| `stripe-purchase-refund` | `PurchaseRefund.ts` | Admin/user refund |

---

## Local verify

1. `RESEND_API_KEY` (and from-address) set on API **and** worker as needed.
2. Worker running and consuming the jobs queue.
3. Trigger the feature once; open Bull Board (`/admin/queues` when enabled) — job name `send-email`, data shows your `templateName`.
4. Confirm delivery in Resend (or the test inbox).

---

## Minimal “done” definition for agents

- New template file + `index.ts` export
- At least one enqueue call with a distinct `templateName`
- No worker/handler changes
- No secrets in logs
- Skip-no-email + best-effort enqueue if the trigger is non-email-critical
