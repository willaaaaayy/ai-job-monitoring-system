# AI Job Monitoring System

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

A production-ready, SaaS-ready Node.js backend service that monitors job listings, stores them in PostgreSQL, and integrates with n8n for AI-powered job scoring.

## 🚀 Version 2.0 - SaaS Architecture

**V2 introduces multi-user support, authentication, queue-based processing, caching, and comprehensive monitoring.**

### What's New in V2

- ✅ **JWT-based Authentication** - Secure user authentication and authorization
- ✅ **Multi-user Support** - Each user has isolated job data
- ✅ **Redis Caching** - Improved performance with 60s TTL cache
- ✅ **BullMQ Queue System** - Async job processing with retry logic
- ✅ **Rate Limiting** - 100 requests per 15 minutes per IP
- ✅ **Prometheus Metrics** - Production-ready monitoring
- ✅ **Swagger API Documentation** - Interactive API docs at `/docs`
- ✅ **State Machine** - Strict job status transition validation
- ✅ **Correlation IDs** - Request tracing across services
- ✅ **Enhanced Logging** - Structured JSON logging with correlation IDs

## Tech Stack

### Core
- **Node.js** - Runtime environment
- **TypeScript** - Type-safe JavaScript
- **Express** - Web framework
- **PostgreSQL** - Database
- **Prisma** - ORM

### V2 Additions
- **Redis** - Caching and queue backend
- **BullMQ** - Queue system for async processing
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Prometheus** - Metrics collection
- **Swagger** - API documentation

### Frontend (V3)
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe frontend code
- **TailwindCSS** - Utility-first CSS framework
- **React Query** - Data fetching and caching
- **Zustand** - Lightweight state management
- **shadcn/ui** - High-quality UI components

### Utilities
- **Axios** - HTTP client
- **node-cron** - Scheduled tasks
- **Winston** - Structured logging
- **Zod** - Schema validation
- **Docker** - Containerization

## Architecture

The project follows clean architecture principles with clear separation of concerns:

### V2 Architecture

```
src/
 ├─ modules/          # Domain-specific modules
 │   ├─ auth/        # Authentication (NEW)
 │   ├─ users/       # User management (NEW)
 │   ├─ jobs/        # Job management (UPDATED: Multi-user)
 │   ├─ scoring/     # Scoring logic (UPDATED: State machine)
 │   ├─ queue/       # BullMQ queue system (NEW)
 │   └─ metrics/     # Prometheus metrics (NEW)
 ├─ infrastructure/  # Shared infrastructure
 │   ├─ redis.ts     # Redis client (NEW)
 │   ├─ jwt.ts       # JWT utilities (NEW)
 │   ├─ queue.ts     # Queue setup (NEW)
 │   └─ metrics.ts   # Metrics collection (NEW)
 ├─ middlewares/    # Express middlewares
 │   ├─ auth.middleware.ts        # JWT verification (NEW)
 │   ├─ cache.middleware.ts       # Redis caching (NEW)
 │   ├─ rateLimit.middleware.ts   # Rate limiting (NEW)
 │   ├─ correlationId.middleware.ts  # Request tracing (NEW)
 │   └─ requestLogger.middleware.ts   # Enhanced logging (NEW)
 ├─ stateMachine/   # State machine (NEW)
 ├─ docs/           # Swagger docs (NEW)
 ├─ cron/           # Scheduled jobs (UPDATED: Queue integration)
 └─ mock/           # Mock API services
```

## Features

### Core Features
- ✅ Fetch jobs from external API (mock service included)
- ✅ Store jobs in PostgreSQL database
- ✅ Send jobs to n8n webhook for AI scoring
- ✅ Receive scoring results from n8n
- ✅ State transition validation (strict state machine)
- ✅ Structured logging with correlation IDs
- ✅ Error handling middleware
- ✅ Docker-ready setup

### V2 Features
- ✅ **JWT Authentication** - Secure user registration and login
- ✅ **Multi-user Support** - User isolation and data ownership
- ✅ **Redis Caching** - Fast job list retrieval (60s TTL)
- ✅ **Queue-based Processing** - Async job scoring with BullMQ
- ✅ **Rate Limiting** - Protection against abuse (100 req/15min)
- ✅ **Prometheus Metrics** - Production monitoring ready
- ✅ **Swagger Documentation** - Interactive API docs
- ✅ **Health Checks** - Database, Redis, and queue health monitoring
- ✅ **Request Tracing** - Correlation IDs for debugging

### Frontend Features (V3)
- ✅ **Modern SaaS Dashboard** - Clean, responsive UI
- ✅ **User Authentication** - Login and registration pages
- ✅ **Protected Routes** - Middleware-based route protection
- ✅ **Job Management** - View, filter, and manage jobs
- ✅ **Real-time Updates** - React Query with polling
- ✅ **Job Details** - Expandable scoring reasons
- ✅ **Toast Notifications** - User feedback for actions
- ✅ **Loading States** - Skeleton loaders and spinners
- ✅ **Error Handling** - User-friendly error messages

## Prerequisites

- Node.js 20+ 
- PostgreSQL 16+
- Redis 7+ (for caching and queues)
- Docker and Docker Compose (optional)

## Setup Instructions

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AIJobMonitoringSystem
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update the following:
   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_URL="postgresql://user:password@localhost:5433/jobmonitoring?schema=public"
   REDIS_URL="redis://localhost:6379"
   N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook/job-scoring"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-characters-long"
   JWT_EXPIRES_IN="24h"
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX=100
   QUEUE_CONCURRENCY=5
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run migrations
   npm run prisma:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000`

### Docker Setup

1. **Start Redis and PostgreSQL**
   ```bash
   docker-compose up -d postgres redis
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run database migrations**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Build and start application**
   ```bash
   docker-compose up -d app
   ```

2. **View logs**
   ```bash
   docker-compose logs -f app
   ```

3. **Stop services**
   ```bash
   docker-compose down
   ```

4. **Stop and remove volumes (clean slate)**
   ```bash
   docker-compose down -v
   ```

## API Endpoints

### Authentication (NEW)

#### Register User
```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
}
```

#### Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** Same as register

**Note:** All job endpoints now require authentication. Include the token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

### Health Check
```
GET /health
```
Returns server status, timestamp, and health of database, Redis, and queue.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "queue": "ok"
  }
}
```

### Metrics (NEW)
```
GET /metrics
```
Returns Prometheus-format metrics for monitoring.

### API Documentation (NEW)
```
GET /docs
```
Interactive Swagger UI for API documentation.

### Fetch Jobs (Manual Trigger)
```
POST /jobs/fetch
```
**Requires Authentication**

Manually triggers job fetching. Note: Jobs are automatically fetched every 6 hours via cron job.

**Response:**
```json
{
  "message": "Job fetch triggered. Check logs for details.",
  "note": "Use cron job or implement direct fetch logic here"
}
```

### Get All Jobs
```
GET /jobs
```
**Requires Authentication**

**Query Parameters:**
- `skip` (optional): Number of records to skip (pagination)
- `take` (optional): Number of records to return (pagination)

**Note:** Returns only jobs belonging to the authenticated user. Results are cached for 60 seconds.

**Response:**
```json
{
  "jobs": [
    {
      "id": "uuid",
      "title": "Senior Full Stack Developer",
      "description": "Job description...",
      "url": "https://example.com/jobs/...",
      "score": null,
      "reason": null,
      "status": "new",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 10,
  "skip": 0,
  "take": 10
}
```

### Get Job by ID
```
GET /jobs/:id
```
**Requires Authentication**

**Note:** Returns job only if it belongs to the authenticated user.

**Response:**
```json
{
  "id": "uuid",
  "title": "Senior Full Stack Developer",
  "description": "Job description...",
  "url": "https://example.com/jobs/...",
  "score": 8,
  "reason": "Great match for the role",
  "status": "scored",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Webhook: Receive Scoring Results
```
POST /webhooks/scoring
```

This endpoint is called by n8n after AI scoring is complete.

**Request Body:**
```json
{
  "jobId": "uuid",
  "score": 8,
  "reason": "Great match for the role. Strong experience in required technologies."
}
```

**Validation:**
- `jobId`: Must be a valid UUID
- `score`: Integer between 1 and 10
- `reason`: Non-empty string

**Response:**
```json
{
  "success": true,
  "message": "Scoring result processed successfully"
}
```

**Error Response (Validation Error):**
```json
{
  "success": false,
  "error": "Invalid webhook payload",
  "errors": [
    {
      "path": "score",
      "message": "Expected number, received string"
    }
  ]
}
```

**Error Response (State Transition Error):**
```json
{
  "success": false,
  "error": "Cannot update score for job with status 'scored'. Only jobs with status 'new' can be scored."
}
```

## n8n Integration

### Workflow Setup

The backend sends jobs to n8n via webhook. Your n8n workflow should:

1. **Receive Webhook** - Accept POST requests from the backend
   - Expected payload:
     ```json
     {
       "jobId": "uuid",
       "title": "Job Title",
       "description": "Job description..."
     }
     ```

2. **Process with AI** - Use OpenAI node or similar to score the job
   - Score range: 1-10
   - Generate a reason for the score

3. **Send Result Back** - POST to your backend's webhook endpoint
   - Endpoint: `POST /webhooks/scoring`
   - Payload:
     ```json
     {
       "jobId": "{{ $json.jobId }}",
       "score": 8,
       "reason": "Generated reason..."
     }
     ```

### Example n8n Workflow

```
[Webhook Trigger]
    ↓
[OpenAI Node] - Score job from 1-10
    ↓
[HTTP Request] - POST to /webhooks/scoring
```

### Webhook URL Configuration

Set the `N8N_WEBHOOK_URL` environment variable to your n8n webhook URL:
```env
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/job-scoring
```

## Database Schema

### User Model (NEW)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // Hashed with bcrypt
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  jobs      Job[]
}
```

### Job Model (UPDATED)

```prisma
model Job {
  id          String   @id @default(uuid())
  title       String
  description String   @db.Text
  url         String
  score       Int?
  reason      String?  @db.Text
  status      String   @default("new") // Values: new, queued, scored, archived
  userId      String   // NEW: User ownership
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([status])
  @@index([createdAt])
  @@index([userId])
  @@index([userId, status])
}
```

### Job Status (UPDATED)

- `new`: Job has been fetched but not yet queued
- `queued`: Job is in the scoring queue
- `scored`: Job has been scored by AI
- `archived`: Job has been archived

### State Transitions (UPDATED)

Strict state machine enforces the following transitions:
- `new` → `queued` (when added to queue)
- `queued` → `scored` (when webhook receives result)
- `scored` → `archived` (manual archive)

Invalid transitions are rejected with clear error messages.

## Queue System (NEW)

### Architecture

V2 uses BullMQ for async job processing:

1. **Cron Job** → Fetches jobs → Saves to DB → Adds to queue (status: `new` → `queued`)
2. **Queue Worker** → Processes queue → Sends to n8n webhook
3. **Webhook** → Receives result → Updates DB (status: `queued` → `scored`)

### Features

- **Retry Logic**: 3 attempts with exponential backoff
- **Dead Letter Queue**: Failed jobs after max retries
- **Concurrency Control**: Configurable worker concurrency
- **Job Tracking**: Monitor queue metrics via `/metrics`

### Queue Configuration

- **Concurrency**: 5 jobs processed simultaneously (configurable)
- **Retry**: 3 attempts with exponential backoff (2s, 4s, 8s)
- **Rate Limiting**: Max 10 jobs per second

## Cron Jobs (UPDATED)

The system includes a cron job that runs every 6 hours to:
1. Fetch jobs from the API
2. Save new jobs to the database
3. Add jobs to scoring queue (instead of direct n8n calls)

Cron expression: `0 */6 * * *` (runs at minute 0 of every 6th hour)

**Note:** Cron job requires a userId. In production, you may want to fetch jobs for all active users.

## Logging (UPDATED)

The application uses Winston for structured logging:

- **Format**: JSON only (structured logging)
- **Correlation IDs**: Every request gets a unique correlation ID for tracing
- **User Context**: Logs include userId when available
- **Request Duration**: All requests log start/end with duration
- **Files**:
  - `logs/error.log` - Error level logs
  - `logs/combined.log` - All logs

Log levels: `error`, `warn`, `info`, `debug`

### Log Format Example

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "message": "Request completed",
  "correlationId": "uuid-here",
  "userId": "user-uuid",
  "method": "GET",
  "path": "/jobs",
  "statusCode": 200,
  "duration": "45ms"
}
```

## Error Handling

The application includes centralized error handling:

- **ValidationError** (400): Invalid input data
- **NotFoundError** (404): Resource not found
- **StateTransitionError** (400): Invalid state transition
- **AppError** (500): Generic application errors

All errors are logged and return consistent JSON responses.

## Development Scripts

```bash
# Development
npm run dev              # Start development server with hot reload

# Build
npm run build            # Compile TypeScript to JavaScript

# Production
npm start                # Start production server

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio (database GUI)
npm run prisma:deploy    # Deploy migrations (production)
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment | `development` | No |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` | Yes |
| `N8N_WEBHOOK_URL` | n8n webhook endpoint URL | - | Yes |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | - | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration | `24h` | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | `900000` (15 min) | No |
| `RATE_LIMIT_MAX` | Max requests per window | `100` | No |
| `QUEUE_CONCURRENCY` | Queue worker concurrency | `5` | No |

## Project Structure (V2)

```
.
├── src/
│   ├── modules/
│   │   ├── auth/           # NEW: Authentication
│   │   ├── users/          # NEW: User management
│   │   ├── jobs/           # UPDATED: Multi-user support
│   │   ├── scoring/        # UPDATED: State machine
│   │   ├── queue/          # NEW: BullMQ integration
│   │   └── metrics/        # NEW: Prometheus metrics
│   ├── infrastructure/
│   │   ├── config.ts       # UPDATED: New config vars
│   │   ├── logger.ts       # UPDATED: Correlation IDs
│   │   ├── prisma.ts
│   │   ├── redis.ts        # NEW
│   │   ├── jwt.ts          # NEW
│   │   └── metrics.ts      # NEW
│   ├── middlewares/
│   │   ├── auth.middleware.ts        # NEW
│   │   ├── cache.middleware.ts       # NEW
│   │   ├── rateLimit.middleware.ts   # NEW
│   │   ├── correlationId.middleware.ts  # NEW
│   │   ├── requestLogger.middleware.ts   # NEW
│   │   └── error.middleware.ts       # UPDATED
│   ├── stateMachine/       # NEW: State machine
│   ├── docs/               # NEW: Swagger docs
│   ├── cron/
│   │   └── jobFetcher.ts   # UPDATED: Queue integration
│   ├── mock/
│   │   └── jobApi.ts
│   ├── app.ts              # UPDATED: New routes & middleware
│   └── server.ts           # UPDATED: Queue worker
├── prisma/
│   └── schema.prisma       # UPDATED: User model
├── dist/                   # Compiled JavaScript (generated)
├── logs/                   # Log files (generated)
├── Dockerfile
├── docker-compose.yml      # UPDATED: Redis service
├── package.json            # UPDATED: New dependencies
├── tsconfig.json
└── README.md
```

## Testing

The project structure supports testing:

- Unit tests: Test services and repositories in isolation
- Integration tests: Test API endpoints
- Mock Prisma client for testing

Example test structure (to be implemented):
```
src/
 └── __tests__/
     ├── unit/
     └── integration/
```

## Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Run database migrations**
   ```bash
   npm run prisma:deploy
   ```

3. **Start the server**
   ```bash
   npm start
   ```

Or use Docker:
```bash
docker-compose up -d
```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check network connectivity

### n8n Webhook Not Receiving Jobs
- Verify `N8N_WEBHOOK_URL` is correct
- Check n8n workflow is active
- Review application logs for errors

### Cron Job Not Running
- Check application logs
- Verify cron expression is correct
- Ensure application is running continuously
- Note: Cron requires userId in V2

### Redis Connection Issues
- Verify `REDIS_URL` is correct
- Ensure Redis is running: `docker-compose up -d redis`
- Check Redis health: `GET /health`

### Authentication Issues
- Verify `JWT_SECRET` is set (min 32 characters)
- Check token expiration: `JWT_EXPIRES_IN`
- Ensure token is included in `Authorization: Bearer <token>` header

### Queue Not Processing Jobs
- Check queue worker is running (should start with server)
- Verify Redis connection
- Check queue metrics: `GET /metrics`
- Review worker logs for errors

## Frontend Setup

### Prerequisites

- Node.js 20+
- Backend API running (see Backend Setup above)

### Local Development

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and update:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   The frontend will start on `http://localhost:3001`

### Frontend Features

- **Authentication**: Register and login pages with JWT token management
- **Dashboard**: View all jobs with filtering by score
- **Job Details**: View individual job details with expandable scoring reasons
- **Manual Fetch**: Trigger job fetching from the dashboard
- **Real-time Updates**: Jobs automatically refresh every 10 seconds
- **Responsive Design**: Works on desktop and mobile devices

### Frontend Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── dashboard/         # Dashboard with job list
│   ├── jobs/[id]/         # Job details page
│   └── api/proxy/         # API proxy route
├── components/
│   ├── layout/            # Layout components (Sidebar, Navbar)
│   ├── ui/                # shadcn/ui components
│   ├── jobs/              # Job-related components
│   └── auth/              # Authentication components
├── lib/                   # Utilities and API clients
├── hooks/                 # React Query hooks
├── store/                 # Zustand state management
└── types/                 # TypeScript type definitions
```

### Docker Setup (Frontend)

The frontend is included in `docker-compose.yml`:

```bash
# Start all services including frontend
docker-compose up -d

# View frontend logs
docker-compose logs -f frontend
```

The frontend will be available at `http://localhost:3001`

### Frontend Development

- **Port**: 3001 (configurable in `package.json`)
- **Hot Reload**: Enabled in development mode
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint configured
- **Formatting**: Prettier configured

## 🏢 Version 3.0 - Enterprise Architecture

**V3 introduces multi-tenancy, role-based access control, Stripe subscriptions, WebSocket real-time updates, analytics, and enhanced security.**

### What's New in V3

- ✅ **Multi-Tenant Architecture** - Complete tenant isolation with Tenant model
- ✅ **Role-Based Access Control** - Admin and user roles with granular permissions
- ✅ **Stripe Integration** - Subscription management with checkout and webhooks
- ✅ **WebSocket Real-Time Updates** - Socket.IO for live job status updates
- ✅ **Analytics Dashboard** - Admin-only analytics with charts and metrics
- ✅ **Scoring History** - Complete audit trail of all scoring events
- ✅ **Plan Limits** - Free (50 jobs), Pro (1000 jobs), Enterprise (unlimited)
- ✅ **Enhanced Security** - Helmet, CSRF protection, secure cookies
- ✅ **Production Deployment** - Railway (backend) and Vercel (frontend) guides

### Multi-Tenant Architecture

Each organization (tenant) has:
- Isolated job data (strict tenant isolation)
- Multiple users with roles (admin/user)
- Subscription plan with limits
- Real-time updates via WebSocket rooms

### Role System

**Admin Role:**
- View all tenant jobs
- Access analytics dashboard
- Manage subscription
- Manage tenant users

**User Role:**
- View own jobs only
- No analytics access
- No subscription management

### Database Schema Updates

**New Models:**
- `Tenant` - Organization/company model
- `ScoringHistory` - Complete audit trail

**Updated Models:**
- `User` - Added `tenantId` and `role`
- `Job` - Added `tenantId` for isolation

### API Endpoints (New)

#### Tenant Management (Admin Only)
```
POST   /tenants              # Create tenant
GET    /tenants              # List all tenants
GET    /tenants/:id          # Get tenant details
PUT    /tenants/:id          # Update tenant
GET    /tenants/plan-limit/check  # Check plan limits
```

#### Analytics (Admin Only)
```
GET    /analytics/overview           # Overview metrics
GET    /analytics/score-distribution  # Score distribution
```

#### Billing
```
POST   /billing/create-checkout-session  # Create Stripe checkout
POST   /billing/webhook                  # Stripe webhook handler
```

#### Scoring History
```
GET    /jobs/:id/history  # Get scoring history for a job
```

### Environment Variables (New)

| Variable | Description | Required |
|----------|-------------|----------|
| `STRIPE_SECRET_KEY` | Stripe secret key | No |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | No |
| `STRIPE_PRICE_ID_PRO` | Stripe Pro plan price ID | No |
| `STRIPE_PRICE_ID_ENTERPRISE` | Stripe Enterprise plan price ID | No |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | No |

### Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guides:
- Railway deployment (backend)
- Vercel deployment (frontend)
- Environment variables setup
- Database migrations
- Stripe webhook configuration

### Multi-Tenant Setup

1. **Create Tenant** (Admin only):
   ```bash
   POST /tenants
   {
     "name": "Acme Corp",
     "plan": "free"
   }
   ```

2. **Assign Users to Tenant**:
   Users must be assigned to a tenant during registration (manual assignment via admin).

3. **All Operations Scoped to Tenant**:
   - All job queries include `tenantId` filter
   - WebSocket rooms are tenant-scoped
   - Analytics are tenant-scoped

### Plan Limits

- **Free**: Max 50 jobs (queued when limit reached)
- **Pro**: Max 1000 jobs
- **Enterprise**: Unlimited

Jobs are queued (not prevented) when limit is reached, allowing processing after upgrade.

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please open an issue on GitHub.
