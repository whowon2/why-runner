FROM rust:1.91.1-bookworm AS builder
WORKDIR /app
COPY . .

# Commit the image is built from, baked into the binary and printed at
# startup (`.git` is not in the build context). CI passes it.
ARG GIT_SHA=unknown
ENV GIT_SHA=$GIT_SHA
RUN cargo build --release

# Portugol console jar + its lib/ dependencies, built from upstream pinned to
# the commit the jar was originally built from (upstream HEAD since 2022;
# the v2.7.5 tag is older). Built here because the jar and lib/ are
# gitignored, so CI's checkout doesn't have them.
FROM eclipse-temurin:21-jdk AS portugol-builder
ARG PORTUGOL_COMMIT=5640a2e95de1c5d63c11f453c324812b4d6a8f6c
RUN apt-get update && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /build
RUN git init -q . \
    && git remote add origin https://github.com/UNIVALI-LITE/Portugol-Studio.git \
    && git fetch -q --depth 1 origin "$PORTUGOL_COMMIT" \
    && git checkout -q FETCH_HEAD
RUN ./gradlew --no-daemon -q :portugol-console:jar

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

# Portugol runtime: the console jar + its ANTLR/audio lib dependencies.
COPY --from=portugol-builder /build/console/build/libs/portugol-console-2.7.5.jar /portugol/portugol-console.jar
COPY --from=portugol-builder /build/console/build/libs/lib /portugol/lib

COPY --from=builder /app/target/release/judge /app/judge
COPY --chmod=755 entrypoint.sh /app/entrypoint.sh

CMD ["./entrypoint.sh"]
