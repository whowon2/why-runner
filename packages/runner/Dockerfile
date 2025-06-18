FROM oven/bun:latest

WORKDIR /app

# Instalar apenas g++ e rustc (sem cargo, via apt)
RUN apt-get update && \
    apt-get install -y g++ rustc && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Instalar dependências do Node/Bun
COPY package.json ./
RUN bun install

# Copiar o restante da aplicação
COPY . .

# Comando para iniciar
CMD ["bun", "dev"]
