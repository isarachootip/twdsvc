# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

RUN pnpm install --frozen-lockfile
RUN pnpm db:generate
RUN pnpm --filter @svcm/api build

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]
