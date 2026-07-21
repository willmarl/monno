# syntax=docker/dockerfile:1
# Build from the REPO ROOT (pnpm workspace needs the root lockfile):
#   docker build -f apps/api/Dockerfile -t monno-api .

FROM node:24-slim AS base
RUN npm install -g pnpm@10
WORKDIR /repo

# ---- deps: full install (dev deps needed for nest build + prisma generate) ----
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
RUN pnpm install --frozen-lockfile --filter api

# ---- build: generate prisma client, compile nest ----
FROM deps AS build
COPY apps/api apps/api
WORKDIR /repo/apps/api
RUN pnpm prisma generate && pnpm run build

# ---- migrate: one-shot `prisma migrate deploy` (has prisma CLI + schema) ----
# Used by compose as a separate service; not part of the runtime image.
FROM build AS migrate
WORKDIR /repo/apps/api
CMD ["pnpm", "prisma", "migrate", "deploy"]

# ---- prod-deps: production node_modules only ----
FROM base AS prod-deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
RUN pnpm install --frozen-lockfile --filter api --prod

# ---- runtime ----
FROM node:24-slim AS runner
ENV NODE_ENV=production
# Keep the /repo layout so pnpm's node_modules symlinks stay valid
WORKDIR /repo/apps/api
COPY --from=prod-deps /repo/node_modules /repo/node_modules
COPY --from=prod-deps /repo/apps/api/node_modules /repo/apps/api/node_modules
COPY --from=build /repo/apps/api/dist ./dist
COPY apps/api/logos ./logos
COPY apps/api/package.json ./package.json

ENV LOCAL_UPLOAD_PATH=/app/uploads
RUN mkdir -p /app/uploads

EXPOSE 3001
CMD ["node", "dist/src/main.js"]
