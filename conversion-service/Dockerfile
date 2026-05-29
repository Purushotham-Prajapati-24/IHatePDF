FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    PORT=8787 \
    JOB_TIMEOUT_MS=120000

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libreoffice \
    chromium \
    poppler-utils \
    zip \
    python3 \
    python3-pip \
    ca-certificates \
  && pip3 install --break-system-packages --no-cache-dir docling \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /srv/conversion-service
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi
COPY src ./src

USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "start"]
