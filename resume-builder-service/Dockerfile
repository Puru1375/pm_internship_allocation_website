FROM node:22-alpine

WORKDIR /usr/src/app

# Install Puppeteer dependencies
RUN apk add --no-cache \
    chromium \
    ttf-liberation \
    fontconfig \
    ca-certificates

# Set production environment
ENV NODE_ENV=production

# Puppeteer doesn't need to download Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./

# Use npm ci for reproducible builds
RUN npm ci --only=production

COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "src/app.js"]
