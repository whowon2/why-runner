FROM rust:1.91.1 AS builder
WORKDIR /app
COPY . .

RUN cargo build --release

FROM debian:bookworm AS isolate-builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libcap-dev libsystemd-dev libseccomp-dev git ca-certificates pkg-config \
    && rm -rf /var/lib/apt/lists/*
# Pin to a specific release tag instead of a moving branch, for reproducibility.
RUN git clone --depth 1 --branch v2.7 https://github.com/ioi/isolate.git /isolate
WORKDIR /isolate
RUN make isolate

FROM debian:bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=isolate-builder /isolate/isolate /usr/local/bin/isolate
COPY isolate.cfg /usr/local/etc/isolate

COPY --from=builder /app/target/release/judge /app/judge

CMD ["./judge"]
