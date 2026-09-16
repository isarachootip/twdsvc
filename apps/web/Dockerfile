# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN pnpm install --frozen-lockfile
RUN pnpm db:generate
RUN pnpm --filter @svcm/web build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["pnpm", "--filter", "@svcm/web", "start"]
