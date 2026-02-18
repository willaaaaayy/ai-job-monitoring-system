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

# Generate Prisma client (DATABASE_URL is not needed for generation, only for migrations)
# Set a dummy DATABASE_URL to satisfy Prisma schema validation during build
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nodejs:nodejs /app/package.json ./

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs logs

USER nodejs

EXPOSE 3000

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
