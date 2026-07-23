import { getSiteUrl } from "@/lib/site-url";

/**
 * Build /llms.txt and /llms-full.txt bodies (llmstxt.org Markdown format).
 * Absolute URLs use the configured site origin.
 */

export function buildLlmsTxt(): string {
  const site = getSiteUrl();
  const name = process.env.NEXT_PUBLIC_APP_NAME || "Monno";

  return `# ${name}

> Full-stack NestJS + Next.js boilerplate with auth, social content, admin, optional Stripe, and email workers — clone it to ship a real product faster.

Monno is a monorepo starter (not a hosted SaaS). Public pages are for demos and reference content; private account, admin, and checkout surfaces are not meant for LLM indexing beyond this file.

## Docs

- [Features overview](${site}/llms-full.txt): Longer stack summary for agents that want more context
- [Sitemap](${site}/sitemap.xml): Machine list of public URLs
- [Robots](${site}/robots.txt): Crawl allow/disallow rules

## Public pages

- [Home](${site}/): Main feed and entry point
- [Posts](${site}/post): Browse public posts
- [Articles](${site}/article): Browse public articles (CRUD reference resource)
- [Collections](${site}/collections): Browse public collections
- [Users](${site}/users): Public user directory
- [Pricing](${site}/pricing): Plans, products, and credits (when Stripe is enabled)

## Optional

- [Login](${site}/login): Username/password or OAuth sign-in
- [Register](${site}/register): Create an account
- [Purchases](${site}/purchases): Signed-in purchase history (not for anonymous crawl)
`;
}

export function buildLlmsFullTxt(): string {
  const site = getSiteUrl();
  const name = process.env.NEXT_PUBLIC_APP_NAME || "Monno";

  return `# ${name} — full context

> Expanded description of the Monno boilerplate for coding agents and LLMs. Prefer /llms.txt when context is limited.

## What this project is

Monno is a fullstack monorepo (pnpm) used as a base for new websites:

- **API:** NestJS + Prisma + PostgreSQL
- **Web:** Next.js App Router
- **Worker:** BullMQ jobs (email via Resend, session cleanup, media tasks)

Auth supports username/password (email optional), email verification, password reset, Google/GitHub OAuth, refresh+access cookies, sessions with risk signals, and account statuses (ACTIVE / SUSPENDED / BANNED / DELETED).

Content includes posts, comments (nested), likes, reactions, views, collections, visibility (PUBLIC/PRIVATE), reports, view history, and user preferences/notifications.

Admin covers users, content moderation, support tickets, settings (including email branding/compose), presence (“active now”), and optional Stripe admin (refunds, cancel subscription, invoices).

Stripe (feature-flagged) covers subscriptions, one-time products, credits, checkout, customer portal, webhooks, and branded purchase/refund emails. Entitlement/feature unlocks are intentionally left to each clone.

## Key public URLs

- [Home](${site}/)
- [Posts index](${site}/post)
- [Articles index](${site}/article)
- [Collections index](${site}/collections)
- [Users directory](${site}/users)
- [Pricing](${site}/pricing)
- [Sitemap](${site}/sitemap.xml)
- [Robots](${site}/robots.txt)
- [Short llms.txt](${site}/llms.txt)

## Do not treat as public product docs

These paths exist in the app but are private, transactional, or boilerplate-only — skip unless the user is authenticated and working on that area:

- ${site}/admin and nested admin routes
- ${site}/settings, ${site}/notifications, ${site}/history, ${site}/purchases
- ${site}/checkout, auth flows (${site}/login, ${site}/register, verify/reset password)
- Create/edit surfaces under /post and /article

## Repo docs (for developers cloning Monno)

When working in the git repository (not the deployed site), useful docs include \`docs/features.md\`, \`docs/setup.md\`, \`docs/progress.md\`, \`docs/email-job.md\`, and \`guide/guidev2/\` for path-based CRUD generation.
`;
}
