import { Router } from 'express';
import jobController from './job.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { cacheMiddleware } from '../../middlewares/cache.middleware';
import scoringHistoryController from '../scoring-history/scoring-history.controller';
import { userRateLimitMiddleware } from '../../middlewares/userRateLimit.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// More lenient rate limit for job fetch endpoint (manual trigger)
const jobFetchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute (allows multiple clicks but prevents abuse)
  message: 'Too many job fetch requests. Please wait a moment before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @swagger
 * /jobs/fetch:
 *   post:
 *     summary: Trigger manual job fetch
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job fetch triggered
 */
router.post('/fetch', authenticate, jobFetchRateLimit, jobController.fetchJobs.bind(jobController));

/**
 * @swagger
 * /jobs:
 *   get:
 *     summary: Get all jobs for authenticated user (admin sees all tenant jobs, user sees own)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, queued, scored, archived, pending_upgrade]
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *       - in: query
 *         name: maxScore
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, description, and URL
 *     responses:
 *       200:
 *         description: List of jobs
 */
router.get(
  '/',
  authenticate,
  userRateLimitMiddleware,
  cacheMiddleware,
  jobController.getAllJobs.bind(jobController)
);

/**
 * @swagger
 * /jobs/search:
 *   get:
 *     summary: Search jobs by query string
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Search query is required
 */
router.get(
  '/search',
  authenticate,
  userRateLimitMiddleware,
  jobController.searchJobs.bind(jobController)
);

/**
 * @swagger
 * /jobs/{id}:
 *   get:
 *     summary: Get job by ID
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Job details
 *       404:
 *         description: Job not found
 */
router.get('/:id', authenticate, jobController.getJobById.bind(jobController));

/**
 * @swagger
 * /jobs/{id}/history:
 *   get:
 *     summary: Get scoring history for a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Scoring history
 */
router.get('/:id/history', authenticate, scoringHistoryController.getHistoryByJobId.bind(scoringHistoryController));

export default router;
