# Deployment Guide

This guide covers deployment of the AI Job Monitoring System to production environments.

## Table of Contents

1. [Railway Deployment (Backend)](#railway-deployment-backend)
2. [Vercel Deployment (Frontend)](#vercel-deployment-frontend)
3. [Environment Variables](#environment-variables)
4. [Database Migrations](#database-migrations)
5. [Post-Deployment Checklist](#post-deployment-checklist)

## Railway Deployment (Backend)

### Prerequisites

- Railway account (https://railway.app)
- GitHub repository connected to Railway
- Stripe account (for billing features)

### Step 1: Create New Project

1. Log in to Railway dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### Step 2: Add PostgreSQL Service

1. Click "New" → "Database" → "Add PostgreSQL"
2. Railway will automatically create a PostgreSQL instance
3. Note the `DATABASE_URL` from the service variables

### Step 3: Add Redis Service

1. Click "New" → "Database" → "Add Redis"
2. Railway will automatically create a Redis instance
3. Note the `REDIS_URL` from the service variables

### Step 4: Configure Environment Variables

Add the following environment variables in Railway:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=<from-postgres-service>
REDIS_URL=<from-redis-service>
N8N_WEBHOOK_URL=<your-n8n-webhook-url>
JWT_SECRET=<generate-strong-secret-min-32-chars>
JWT_EXPIRES_IN=24h
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
QUEUE_CONCURRENCY=5
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
STRIPE_PRICE_ID_PRO=<stripe-price-id-for-pro-plan>
STRIPE_PRICE_ID_ENTERPRISE=<stripe-price-id-for-enterprise-plan>
CORS_ORIGIN=<your-frontend-url>
```

### Step 5: Configure Build Settings

1. Go to project settings
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Set root directory: `/` (root)

### Step 6: Deploy

1. Railway will automatically deploy on push to main branch
2. Monitor deployment logs in Railway dashboard
3. Once deployed, note the generated URL (e.g., `https://your-app.up.railway.app`)

### Step 7: Run Database Migrations

1. Open Railway CLI or use Railway dashboard shell
2. Run migrations:
   ```bash
   npm run prisma:migrate deploy
   ```

### Step 8: Configure Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-app.up.railway.app/billing/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Vercel Deployment (Frontend)

### Prerequisites

- Vercel account (https://vercel.com)
- GitHub repository connected to Vercel

### Step 1: Import Project

1. Log in to Vercel dashboard
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Select the `frontend` directory as root

### Step 2: Configure Build Settings

Vercel will auto-detect Next.js. Verify:
- Framework Preset: Next.js
- Build Command: `npm run build` (or leave default)
- Output Directory: `.next` (or leave default)
- Install Command: `npm install` (or leave default)

### Step 3: Configure Environment Variables

Add the following environment variables:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
NODE_ENV=production
```

### Step 4: Deploy

1. Click "Deploy"
2. Vercel will build and deploy your frontend
3. Once deployed, note the generated URL (e.g., `https://your-app.vercel.app`)

### Step 5: Update CORS Origin

1. Go back to Railway backend environment variables
2. Update `CORS_ORIGIN` to your Vercel frontend URL:
   ```bash
   CORS_ORIGIN=https://your-app.vercel.app
   ```
3. Redeploy backend if needed

## Environment Variables

### Backend (Railway)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment | Yes | `production` |
| `PORT` | Server port | Yes | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string | Yes | - |
| `N8N_WEBHOOK_URL` | n8n webhook URL | Yes | - |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Yes | - |
| `JWT_EXPIRES_IN` | JWT expiration | No | `24h` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | No | `900000` |
| `RATE_LIMIT_MAX` | Max requests per window | No | `100` |
| `QUEUE_CONCURRENCY` | Queue worker concurrency | No | `5` |
| `STRIPE_SECRET_KEY` | Stripe secret key | No | - |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | No | - |
| `STRIPE_PRICE_ID_PRO` | Stripe Pro plan price ID | No | - |
| `STRIPE_PRICE_ID_ENTERPRISE` | Stripe Enterprise plan price ID | No | - |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | No | `*` |

### Frontend (Vercel)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes | - |
| `NODE_ENV` | Environment | Yes | `production` |

## Database Migrations

### Running Migrations Locally

```bash
# Generate Prisma client
npm run prisma:generate

# Create migration
npm run prisma:migrate dev --name migration_name

# Apply migrations (production)
npm run prisma:migrate deploy
```

### Running Migrations on Railway

1. Use Railway CLI:
   ```bash
   railway run npm run prisma:migrate deploy
   ```

2. Or use Railway dashboard shell:
   - Go to your service
   - Click "Shell"
   - Run: `npm run prisma:migrate deploy`

## Post-Deployment Checklist

### Backend

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Health check endpoint working: `GET /health`
- [ ] Metrics endpoint accessible: `GET /metrics`
- [ ] Swagger docs accessible: `GET /docs`
- [ ] Stripe webhook configured and tested
- [ ] Redis connection working
- [ ] Queue worker running
- [ ] CORS configured correctly

### Frontend

- [ ] Environment variables set
- [ ] API URL configured correctly
- [ ] Build successful
- [ ] Authentication flow working
- [ ] WebSocket connection working (if enabled)
- [ ] All routes accessible

### Integration

- [ ] Frontend can communicate with backend
- [ ] Authentication tokens working
- [ ] WebSocket real-time updates working
- [ ] Stripe checkout flow working
- [ ] Webhook receiving scoring results

## Troubleshooting

### Backend Issues

**Database Connection Failed**
- Verify `DATABASE_URL` is correct
- Check PostgreSQL service is running
- Ensure network access is allowed

**Redis Connection Failed**
- Verify `REDIS_URL` is correct
- Check Redis service is running
- Ensure network access is allowed

**Stripe Webhook Not Working**
- Verify webhook URL is correct
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Ensure webhook endpoint accepts raw body

### Frontend Issues

**API Calls Failing**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS configuration on backend
- Verify backend is accessible

**WebSocket Not Connecting**
- Verify Socket.IO endpoint is accessible
- Check CORS includes WebSocket origin
- Verify authentication token is valid

## SSL and Security

- Railway and Vercel provide SSL certificates automatically
- Ensure `NODE_ENV=production` for secure cookies
- Use strong `JWT_SECRET` (min 32 characters)
- Configure `CORS_ORIGIN` to specific domains (not `*` in production)

## Monitoring

- Railway provides built-in metrics and logs
- Vercel provides analytics and logs
- Backend exposes Prometheus metrics at `/metrics`
- Health check endpoint at `/health`
