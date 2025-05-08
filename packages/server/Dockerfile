FROM oven/bun:latest AS base

#=========================================

FROM base AS builder

WORKDIR /app

RUN bun i -g turbo@^2.5.2
COPY . .
RUN turbo prune api --docker

#=========================================

FROM base AS installer

WORKDIR /app

RUN apt-get update -y && apt-get install openssl -y

COPY --from=builder /app/out/json/ .
RUN bun install

COPY --from=builder /app/out/full/ .
RUN bun turbo run build

CMD bun dev
