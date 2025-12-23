# Multi-stage Dockerfile for Next.js (Node 20)
FROM node:20-alpine AS base
ARG DATABASE_URL
# Provide a default build-time DATABASE_URL to avoid Prisma errors while building.
# You should pass a real value with `--build-arg DATABASE_URL=...` when building.
ENV DATABASE_URL=${DATABASE_URL:-file:./dev.db}
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install || npm install
COPY prisma ./prisma
RUN npx prisma generate --silent || true

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/ .
EXPOSE 3000
CMD ["npm", "start"]
