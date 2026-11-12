# TrustNotary — Lume-Native RON & Mobile Notary Platform
# DarkWave Studios LLC — Coolify Container (No PM2)
FROM node:22-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
COPY vendor ./vendor
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build && mkdir -p /app/data/uploads

ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/app/data \
    APP_TZ=America/Chicago

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "dist/server.mjs"]

