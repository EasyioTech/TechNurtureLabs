FROM node:20-slim AS base

# ----------------------------
# Stage 1: Install dependencies
# ----------------------------
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# Use CI for deterministic builds
RUN npm ci --legacy-peer-deps

# Stage 1b: Production dependencies only
FROM base AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Dummy env vars to prevent crashes during static analysis / build
# These are NOT real credentials — real values are injected at runtime via docker-compose
ENV DATABASE_URL="postgresql://placeholder:5432/db"
ENV REDIS_URL="redis://placeholder:6379"
ENV JWT_SECRET="build-time-placeholder-min-32-chars-long-security-key"
ENV CLOUDFLARE_ACCOUNT_ID="build-placeholder"
ENV CLOUDFLARE_ACCESS_KEY_ID="build-placeholder"
ENV CLOUDFLARE_SECRET_ACCESS_KEY="build-placeholder"
ENV CLOUDFLARE_BUCKET_NAME="build-placeholder"
ENV CLOUDFLARE_PUBLIC_DOMAIN=""
ARG NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID=""
ENV NEXT_PUBLIC_RAZORPAY_KEY_ID=$NEXT_PUBLIC_RAZORPAY_KEY_ID
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_SKIP_TYPECHECK=1
ENV NODE_OPTIONS="--max-old-space-size=2560"

RUN npm run build

# ----------------------------
# Stage 3: Production runner
# ----------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install minimal OS dependencies if necessary (wget is used in healthcheck)
RUN apt-get update && apt-get install -y \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g tsx

# Add nextjs group and user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/database ./database
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts

# Create local_storage directory for fallback uploads
RUN mkdir -p /app/local_storage && chown nextjs:nodejs /app/local_storage

# Create tmp workspace directory for worker tasks
RUN mkdir -p /app/tmp && chown nextjs:nodejs /app/tmp

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
