FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY next.config.ts tsconfig.json ./
COPY db ./db
COPY scripts ./scripts
COPY lib ./lib
RUN mkdir -p /srv/data /srv/medya/scenes && chown -R node:node /srv /app
USER node
EXPOSE 2608
CMD ["sh", "-c", "npx tsx scripts/migrate.ts && npm run start"]
