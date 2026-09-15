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

# Debian bookworm's own repos only carry openjdk-17 (Debian 13/trixie is the
# first to ship openjdk-21) — Portugol's jar is built against JDK 21
# bytecode (class file version 65) and fails with UnsupportedClassVersionError
# on 17, so JDK 21 comes from Eclipse Temurin's apt repo instead.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg \
    && curl -sSL https://packages.adoptium.net/artifactory/api/gpg/key/public -o /tmp/adoptium.asc \
    && gpg --dearmor -o /usr/share/keyrings/adoptium.gpg < /tmp/adoptium.asc \
    && echo "deb [signed-by=/usr/share/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb bookworm main" > /etc/apt/sources.list.d/adoptium.list \
    && rm /tmp/adoptium.asc \
    && apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    gcc g++ \
    rustc \
    temurin-21-jdk \
    && rm -rf /var/lib/apt/lists/*

COPY --from=isolate-builder /isolate/isolate /usr/local/bin/isolate
COPY isolate.cfg /usr/local/etc/isolate

# Portugol runtime: the console jar + its ANTLR/audio lib dependencies,
# previously baked into the separate `portugol:latest` image built from
# judge/portugol/Dockerfile — that image and its build step go away (Task 6),
# the jar now lives directly in this image instead.
COPY portugol/portugol-console-2.7.5.jar /portugol/portugol-console.jar
COPY portugol/lib /portugol/lib

COPY --from=builder /app/target/release/judge /app/judge

CMD ["./judge"]
