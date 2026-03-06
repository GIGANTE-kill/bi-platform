# Etapa 1: Instala dependências
FROM node:20-slim AS deps
WORKDIR /app

# Em Debian/Slim, precisamos de alguns pacotes básicos para o npm ci
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# Etapa 2: Build do projeto
FROM node:20-slim AS builder-stage
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variável dummy para o prisma não dar erro no build
RUN DATABASE_URL="postgresql://placeholder:5432" npx prisma generate
RUN npm run build

# Etapa 3: Imagem final de execução (MUITO MAIS LEVE)
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Criar usuário padrão
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

# Copiar apenas o necessário do estágio de build
COPY --from=builder-stage /app/public ./public
COPY --from=builder-stage --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder-stage --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder-stage --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000
CMD ["npm", "run", "start"]
