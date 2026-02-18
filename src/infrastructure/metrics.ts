import { Registry, Counter, Histogram, Gauge } from 'prom-client';
import { getQueueMetrics } from '../modules/queue/scoring.queue';

// Create a Registry to register the metrics
export const register = new Registry();

// HTTP Metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Queue Metrics
export const queueJobsWaiting = new Gauge({
  name: 'queue_jobs_waiting',
  help: 'Number of jobs waiting in queue',
  labelNames: ['queue_name'],
  registers: [register],
});

export const queueJobsActive = new Gauge({
  name: 'queue_jobs_active',
  help: 'Number of active jobs in queue',
  labelNames: ['queue_name'],
  registers: [register],
});

export const queueJobsCompleted = new Gauge({
  name: 'queue_jobs_completed',
  help: 'Number of completed jobs in queue',
  labelNames: ['queue_name'],
  registers: [register],
});

export const queueJobsFailed = new Gauge({
  name: 'queue_jobs_failed',
  help: 'Number of failed jobs in queue',
  labelNames: ['queue_name'],
  registers: [register],
});

// Database Metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  registers: [register],
});

// Cache Metrics
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_key'],
  registers: [register],
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_key'],
  registers: [register],
});

/**
 * Update queue metrics from BullMQ
 */
export async function updateQueueMetrics(): Promise<void> {
  try {
    const metrics = await getQueueMetrics();
    queueJobsWaiting.set({ queue_name: 'scoring' }, metrics.waiting);
    queueJobsActive.set({ queue_name: 'scoring' }, metrics.active);
    queueJobsCompleted.set({ queue_name: 'scoring' }, metrics.completed);
    queueJobsFailed.set({ queue_name: 'scoring' }, metrics.failed);
  } catch (error) {
    // Silently fail metrics update
    console.error('Failed to update queue metrics', error);
  }
}
