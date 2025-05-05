FROM oven/bun:latest AS base

#=========================================

FROM base AS builder

WORKDIR /app

RUN bun i -g turbo@^2.5.2

COPY . .

RUN turbo prune web --docker

#=========================================

FROM base AS installer

WORKDIR /app

RUN apt-get update -y && apt-get install openssl -y

# Build-time environment variables
ARG AUTH_SECRET
ARG DATABASE_URL
ARG NEXT_PUBLIC_BACKEND_URL

ENV AUTH_SECRET=$AUTH_SECRET
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

COPY --from=builder /app/out/json/ .
RUN bun install

COPY --from=builder /app/out/full/ .
RUN bun turbo run build

#=========================================

FROM base AS runner
WORKDIR /app
RUN apt-get update -y && apt-get install openssl -y

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

CMD bun apps/web/server.js
