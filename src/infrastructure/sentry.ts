import * as Sentry from '@sentry/node';
import config from './config';

/**
 * Initialize Sentry for error tracking
 */
export function initSentry(): void {
  if (!process.env.SENTRY_DSN) {
    console.log('Sentry DSN not configured, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: config.nodeEnv,
    tracesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0, // 10% in production, 100% in dev
    integrations: [
      // Enable HTTP tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express integration
      new Sentry.Integrations.Express({ app: undefined }),
    ],
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request) {
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        if (event.request.data) {
          // Remove sensitive fields from request data
          const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
          if (typeof event.request.data === 'object') {
            sensitiveFields.forEach((field) => {
              if (event.request.data[field]) {
                event.request.data[field] = '[REDACTED]';
              }
            });
          }
        }
      }
      return event;
    },
  });

  console.log('Sentry initialized');
}

export default Sentry;
