# Base Node image
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Builder
FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm db:generate
RUN pnpm build

# Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app /app

EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]
