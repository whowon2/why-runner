FROM debian:bullseye-slim

# Install deps (no recommended packages, to reduce size)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl ca-certificates g++ rustc openjdk-17-jdk-headless && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Bun manually
RUN curl -fsSL https://bun.sh/install | bash && \
    ln -s /root/.bun/bin/bun /usr/local/bin/bun

WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .

CMD ["bun", "dev"]
