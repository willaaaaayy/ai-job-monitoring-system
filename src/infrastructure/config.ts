import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  databaseUrl: z.string().url(),
  n8nWebhookUrl: z.string().url().refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: 'n8n webhook URL must be a valid HTTP/HTTPS URL' }
  ),
  redisUrl: z.string().url().default('redis://localhost:6379'),
  jwtSecret: z.string().min(32, 'JWT secret must be at least 32 characters'),
  jwtExpiresIn: z.string().default('24h'),
  rateLimitWindowMs: z.coerce.number().default(900000), // 15 minutes
  rateLimitMax: z.coerce.number().default(100),
  queueConcurrency: z.coerce.number().default(5),
  stripeSecretKey: z.string().optional().refine(
    (val) => {
      if (!val) return true; // Optional
      return val.startsWith('sk_test_') || val.startsWith('sk_live_');
    },
    { message: 'Stripe secret key must start with sk_test_ or sk_live_' }
  ),
  stripeWebhookSecret: z.string().optional().refine(
    (val) => {
      if (!val) return true; // Optional
      return val.startsWith('whsec_');
    },
    { message: 'Stripe webhook secret must start with whsec_' }
  ),
  stripePriceIdPro: z.string().optional(),
  stripePriceIdEnterprise: z.string().optional(),
  corsOrigin: z.string().default('*'),
  frontendUrl: z.string().url().optional(),
});

type Config = z.infer<typeof configSchema>;

let config: Config;

try {
  config = configSchema.parse({
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    n8nWebhookUrl: process.env.N8N_WEBHOOK_URL,
    redisUrl: process.env.REDIS_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
    rateLimitMax: process.env.RATE_LIMIT_MAX,
    queueConcurrency: process.env.QUEUE_CONCURRENCY,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripePriceIdPro: process.env.STRIPE_PRICE_ID_PRO,
    stripePriceIdEnterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE,
    corsOrigin: process.env.CORS_ORIGIN,
    frontendUrl: process.env.FRONTEND_URL,
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Invalid configuration:');
    error.errors.forEach((err) => {
      console.error(`  ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

export default config;
