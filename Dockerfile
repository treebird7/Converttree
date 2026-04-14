FROM node:20-bookworm-slim

# System packages: Python, pandoc, and WeasyPrint rendering deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    pandoc \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
    libffi8 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python dependencies
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Node dependencies (cached layer)
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@9.12.0 && pnpm install --frozen-lockfile

# Build server bundle
COPY . .
RUN pnpm build

# Copy Python conversion script next to the built bundle
# (esbuild sets __dirname to dist/, so the script must live there)
RUN cp server/conversion_utils.py dist/

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
