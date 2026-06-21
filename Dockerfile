# ================================
# Stage 1: Install dependencies
# ================================
FROM node:20-alpine AS deps

# Prisma v5 butuh openssl & libc compatibility di alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install semua deps termasuk devDependencies (dibutuhkan saat build)
RUN npm ci

# Generate Prisma client (v5 generate harus ada schema.prisma-nya)
RUN npx prisma generate

# ================================
# Stage 2: Build Next.js
# ================================
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Pastikan Prisma client ter-generate di stage ini juga
RUN npx prisma generate

RUN npm run build

# ================================
# Stage 3: Production runner
# ================================
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Buat user non-root untuk keamanan
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy hasil standalone build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema & generated client ke runner
# (dibutuhkan kalau ada migration atau query di runtime)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]