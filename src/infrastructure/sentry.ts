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
      // HTTP and Express integrations are automatically included in v8+
    ],
    beforeSend(event) {
      // Filter out sensitive data
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      const request = event.request;
      if (request?.data && typeof request.data === 'object') {
        // Remove sensitive fields from request data
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
        sensitiveFields.forEach((field) => {
          if (request.data && request.data[field]) {
            request.data[field] = '[REDACTED]';
          }
        });
      }
      return event;
    },
  });

  console.log('Sentry initialized');
}

export default Sentry;
