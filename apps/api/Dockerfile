# ---------- deps ----------
FROM node:24-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy api package.json (and any other dependent workspaces if needed)
COPY apps/api/package.json ./apps/api/

# Install dependencies (includes devDeps for build stage)
RUN pnpm install --frozen-lockfile


# ---------- build ----------
FROM node:24-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy deps
COPY --from=deps /app/node_modules ./node_modules

# Copy source code + prisma folder (for generate)
COPY . .

# Generate Prisma Client (doesn't need DB connection)
RUN pnpm prisma generate

# Build the NestJS api app
RUN pnpm -C apps/api build


# ---------- runtime ----------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Enable corepack for pnpm (optional but consistent)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config files needed for pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy api files
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json

# Copy prisma folder (required for migrations at runtime)
COPY --from=build /app/apps/api/prisma ./apps/api/prisma

# Install only production dependencies (smaller image)
RUN pnpm install --prod --frozen-lockfile

EXPOSE 3001

# Run migrations then start the app
CMD ["sh", "-c", "cd /app/apps/api && pnpm prisma migrate deploy && node dist/main.js"]