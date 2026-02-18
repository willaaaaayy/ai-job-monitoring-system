# Multi-stage build for production

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Build
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* tsconfig.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY src ./src

# Generate Prisma client (use dummy DATABASE_URL for build-time generation)
# The actual DATABASE_URL will be provided at runtime
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

# Install OpenSSL for Prisma (fixes OpenSSL detection issues)
RUN apk add --no-cache openssl1.1-compat

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nodejs:nodejs /app/package.json ./

# Copy Prisma Client from build stage (critical!)
COPY --from=build --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=nodejs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy entrypoint script
COPY --chown=nodejs:nodejs docker-entrypoint.sh ./

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs logs

USER nodejs

EXPOSE 3000

# Use entrypoint script to handle migrations and start server
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
