# ---------- deps ----------
FROM node:24-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy web package.json
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile


# ---------- build ----------
FROM node:24-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files and deps
COPY . .
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/web/node_modules /app/apps/web/node_modules

# Build the Next.js app
RUN pnpm -C apps/web build


# ---------- runtime ----------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only necessary files from build
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/apps/web/next.config.ts ./apps/web/next.config.ts

# Copy workspace config files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy web package.json
COPY apps/web/package.json ./apps/web/

RUN corepack enable && pnpm install --frozen-lockfile

EXPOSE 3000

WORKDIR /app/apps/web

CMD ["pnpm", "start"]