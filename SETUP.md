# Setup Guide

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)
- `N8N_WEBHOOK_URL` - URL of your n8n webhook endpoint

### Optional Variables

- `STRIPE_SECRET_KEY` - Stripe secret key (for billing)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `STRIPE_PRICE_ID_PRO` - Stripe price ID for Pro plan
- `STRIPE_PRICE_ID_ENTERPRISE` - Stripe price ID for Enterprise plan
- `CORS_ORIGIN` - Allowed CORS origins (comma-separated)
- `SENTRY_DSN` - Sentry DSN for error tracking
- `FRONTEND_URL` - Frontend URL for redirects

## Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from https://dashboard.stripe.com/apikeys
3. Create products and prices for Pro and Enterprise plans
4. Set up webhook endpoint at https://dashboard.stripe.com/webhooks
5. Add webhook URL: `https://your-backend-url.com/billing/webhook`
6. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## n8n Setup

1. Set up n8n instance (cloud or self-hosted)
2. Create a webhook workflow
3. Configure the webhook to accept POST requests with:
   - `jobId` (string)
   - `title` (string)
   - `description` (string)
   - `tenantId` (string)
4. Add AI scoring logic
5. Return response with:
   - `jobId` (string)
   - `score` (number, 1-10)
   - `reason` (string)
6. Configure webhook to POST back to: `https://your-backend-url.com/webhooks/scoring`
7. Copy webhook URL to `N8N_WEBHOOK_URL`

## Database Setup

1. Run migrations:
```bash
npm run prisma:migrate
```

2. Generate Prisma client:
```bash
npm run prisma:generate
```

## Running the Application

### Backend

```bash
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Monitoring Setup

### Prometheus & Grafana

1. Start monitoring stack:
```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

2. Access Grafana at http://localhost:3001
   - Default credentials: admin/admin
3. Access Prometheus at http://localhost:9090
4. Import dashboard from `grafana/dashboards/job-monitoring.json`

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```
