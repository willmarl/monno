FROM node:24

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY ./apps/api .

RUN pnpm install

RUN pnpm run build

EXPOSE 3001

CMD ["pnpm", "run", "start"]