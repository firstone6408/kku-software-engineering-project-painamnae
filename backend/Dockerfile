# ---- Stage 1: Build (prisma generate) ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

# ---- Stage 2: Production ----
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy generated prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy prisma schema (for migrate deploy)
COPY prisma ./prisma

# Copy source code
COPY . .

EXPOSE 3000

# Run pending migrations on Neon → start server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
