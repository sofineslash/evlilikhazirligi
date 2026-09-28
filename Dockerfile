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
RUN npm install -g tsx@4.23.15 && npm cache clean --force
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --chown=node:node next.config.ts tsconfig.json ./
COPY --chown=node:node db ./db
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node lib ./lib
RUN mkdir -p /srv/data /srv/medya/scenes /srv/medya/muzik \
    && chown -R node:node /srv && chown node:node /app
USER node
EXPOSE 2608
CMD ["sh", "-c", "tsx scripts/migrate.ts && npm run start"]
