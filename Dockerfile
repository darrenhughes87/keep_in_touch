# syntax=docker/dockerfile:1.6
# Multi-stage build for Keep In Touch. ARM64 (Pi 5) and AMD64 supported.
# Build:   docker buildx build --platform linux/arm64 -t keepintouch:latest .
# Run:     see docker-compose.yml

# ---------- deps ----------
FROM node:22-alpine AS deps
RUN apk add --no-cache python3 make g++ libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm config set store-dir /pnpm-store && pnpm install --frozen-lockfile

# ---------- build ----------
FROM node:22-alpine AS build
RUN apk add --no-cache python3 make g++ libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && pnpm build

# ---------- runtime ----------
FROM node:22-alpine AS runtime
RUN apk add --no-cache libc6-compat tini tzdata
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3100 \
    HOSTNAME=0.0.0.0 \
    TZ=Europe/London \
    DATA_DIR=/data

# Next standalone output bundles only what the server needs
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# better-sqlite3 native bindings need to be re-resolvable; standalone already includes them
RUN mkdir -p /data && chown -R node:node /data /app
USER node

EXPOSE 3100
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
