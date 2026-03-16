# ---- Stage 1: Build ----
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL และ dependencies ที่ Prisma ต้องใช้
RUN apt-get update -y && apt-get install -y \
    openssl \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

# Copy source code and compile TypeScript
COPY tsconfig.json ./
COPY src ./src
COPY app.ts server.ts ./
RUN npx tsc

# ---- Stage 2: Production ----
FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y \
    openssl \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

COPY prisma ./prisma
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
