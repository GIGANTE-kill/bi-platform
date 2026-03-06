# Etapa 1: Instala dependências (USANDO IMAGEM COMPLETA PARA TER TODOS OS HEADERS C++)
FROM node:20 AS deps
WORKDIR /app

# Em imagens completas já temos build-essential, mas garantimos o necessário
COPY package.json package-lock.json ./

# Instalação resiliente para ambientes mistos
RUN npm install --no-audit --no-fund

# Etapa 2: Build do projeto
FROM node:20 AS builder-stage
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variável dummy para o prisma não dar erro no build
RUN DATABASE_URL="postgresql://placeholder:5432" npx prisma generate
RUN npm run build

# Etapa 3: Imagem final de execução (VOLTAMOS PARA SLIM PARA SER LEVE)
FROM node:20-slim AS runner
WORKDIR /app

# Instalar libaio1 que é necessário para o oracledb em alguns modos
RUN apt-get update && apt-get install -y libaio1 && rm -rf /var/lib/apt/lists/*

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
