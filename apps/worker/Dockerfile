# syntax=docker/dockerfile:1
# Build from the REPO ROOT (pnpm workspace needs the root lockfile):
#   docker build -f apps/worker/Dockerfile -t monno-worker .

FROM node:24-slim AS base
RUN npm install -g pnpm@10
WORKDIR /repo

# ---- deps: full install (dev deps needed for tsc + prisma generate) ----
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
RUN pnpm install --frozen-lockfile --filter worker

# ---- build ----
# Worker's schema.prisma is a synced copy of apps/api (see scripts/sync-prisma-schema.sh);
# migrations run from the api image only.
FROM deps AS build
COPY apps/worker apps/worker
WORKDIR /repo/apps/worker
RUN pnpm prisma generate && pnpm run build

# ---- prod-deps: production node_modules only ----
FROM base AS prod-deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
RUN pnpm install --frozen-lockfile --filter worker --prod

# ---- runtime ----
FROM node:24-slim AS runner
ENV NODE_ENV=production
# Keep the /repo layout so pnpm's node_modules symlinks stay valid
WORKDIR /repo/apps/worker
COPY --from=prod-deps /repo/node_modules /repo/node_modules
COPY --from=prod-deps /repo/apps/worker/node_modules /repo/apps/worker/node_modules
COPY --from=build /repo/apps/worker/dist ./dist
COPY apps/worker/package.json ./package.json

ENV LOCAL_UPLOAD_PATH=/app/uploads
RUN mkdir -p /app/uploads

CMD ["node", "dist/worker.js"]
