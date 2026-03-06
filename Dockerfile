# Stage 1: Install dependencies
FROM node:20 AS deps
WORKDIR /app

# Install git for specific dependencies
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Stage 2: Build the application
FROM node:20 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables
ARG NEXT_TELEMETRY_DISABLED=1
ENV NEXT_TELEMETRY_DISABLED=$NEXT_TELEMETRY_DISABLED
ENV DATABASE_URL="postgresql://placeholder:5432/db"
ENV NEXTAUTH_SECRET="placeholder"
ENV NEXTAUTH_URL="http://localhost:3000"

RUN npx prisma generate
RUN npm run build

# Stage 3: Production runner
FROM node:20-slim AS runner
WORKDIR /app

# Install production-only system dependencies
RUN apt-get update && apt-get install -y libaio1 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

# Copy only the necessary files for standalone mode
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Expose Port
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

USER nextjs

CMD ["node", "server.js"]
