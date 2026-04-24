# Cloud Run-ready image for @le-relief/renderer-server.
# Includes Chromium + sharp + the workspace renderer.

FROM node:22-bookworm-slim

# Install Chromium dependencies + the browser itself (used by playwright-core).
RUN apt-get update && apt-get install -y --no-install-recommends \
  chromium \
  fonts-liberation \
  fonts-noto-color-emoji \
  fonts-noto-cjk \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium
ENV PORT=8080

WORKDIR /app

# pnpm
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Copy workspace manifests first for better caching.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* tsconfig.base.json ./
COPY packages/types/package.json packages/types/tsconfig.json ./packages/types/
COPY packages/renderer/package.json packages/renderer/tsconfig.json ./packages/renderer/
COPY packages/renderer-server/package.json packages/renderer-server/tsconfig.json ./packages/renderer-server/

RUN pnpm install --frozen-lockfile=false --filter "@le-relief/renderer-server..."

# Copy sources and build.
COPY packages/types/src ./packages/types/src
COPY packages/renderer/src ./packages/renderer/src
COPY packages/renderer/README.md ./packages/renderer/
COPY packages/renderer-server/src ./packages/renderer-server/src

RUN pnpm --filter @le-relief/types build \
 && pnpm --filter @le-relief/renderer build \
 && pnpm --filter @le-relief/renderer-server build

# Strip dev dependencies after build to keep image lean.
ENV NODE_ENV=production
RUN pnpm install --prod --frozen-lockfile=false --filter "@le-relief/renderer-server..." || true

EXPOSE 8080
WORKDIR /app/packages/renderer-server
CMD ["node", "dist/index.js"]
