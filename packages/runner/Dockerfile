FROM oven/bun:latest

WORKDIR /app

# Instalar g++, rustc e openjdk
RUN apt-get update && \
    apt-get install -y g++ rustc openjdk-17-jdk && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Instalar dependências do Node/Bun
COPY package.json ./
RUN bun install

# Copiar o restante da aplicação
COPY . .

# Comando para iniciar
CMD ["bun", "dev"]
