FROM debian:bullseye-slim

# Install required packages (only essentials)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    unzip \
    g++ \
    rustc \
    openjdk-17-jdk-headless \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash && \
    ln -s /root/.bun/bin/bun /usr/local/bin/bun

WORKDIR /app

# Copy only needed files
COPY package.json ./

RUN bun install

COPY . .

CMD ["bun", "dev"]
