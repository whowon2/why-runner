FROM rust:1.91.1 AS builder
WORKDIR /app
COPY . .

RUN cargo build --release

FROM debian

WORKDIR /app

# 1. Install necessary system tools
# We need 'ca-certificates' for HTTPS (AWS SQS)
# We need 'docker.io' (the CLI client) so this container can spawn sibling containers
RUN apt-get update && apt-get install -y \
    ca-certificates \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/judge /app/judge

CMD ["./judge"]
