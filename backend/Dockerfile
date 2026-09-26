FROM node:20-alpine AS builder

WORKDIR /app

# Prisma 7 reads datasource configuration from prisma.config.ts.
# The build does not connect to this database; the value only lets Prisma load the config.
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm ci
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/

RUN npm run build

FROM node:20-alpine

WORKDIR /app

# Keep the Prisma CLI in this local/homolog image because startup runs migrate deploy.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY package*.json ./

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -q -O - http://127.0.0.1:3000/health/ready >/dev/null 2>&1 || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
