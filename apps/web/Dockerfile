# syntax=docker/dockerfile:1
# Build from the REPO ROOT (pnpm workspace needs the root lockfile):
#   docker build -f apps/web/Dockerfile -t monno-web \
#     --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 .
#
# NEXT_PUBLIC_* vars are BAKED IN at build time (they end up in the JS bundle),
# so they must be passed as build args — runtime env has no effect on them.

FROM node:24-slim AS base
RUN npm install -g pnpm@10
WORKDIR /repo

# ---- deps ----
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
RUN pnpm install --frozen-lockfile --filter web

# ---- build ----
FROM deps AS build
COPY apps/web apps/web
WORKDIR /repo/apps/web

ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_APP_NAME=Monno
ARG NEXT_PUBLIC_STRIPE_ENABLED=true
ARG NEXT_PUBLIC_POSTHOG_KEY=
ARG NEXT_PUBLIC_POSTHOG_HOST=
ARG NEXT_PUBLIC_SENTRY_DSN=
ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
# Optional: enables Sentry sourcemap upload during build
ARG SENTRY_AUTH_TOKEN=

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_STRIPE_ENABLED=$NEXT_PUBLIC_STRIPE_ENABLED \
    NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY \
    NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_PUBLIC_SENTRY_ENVIRONMENT=$NEXT_PUBLIC_SENTRY_ENVIRONMENT \
    SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN \
    NEXT_TELEMETRY_DISABLED=1

RUN pnpm run build

# ---- runtime ----
FROM node:24-slim AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

# Standalone output keeps the monorepo layout: server entry is apps/web/server.js
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
