import { Router } from 'express';
import analyticsController from './analytics.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';

const router = Router();

/**
 * @swagger
 * /analytics/overview:
 *   get:
 *     summary: Get analytics overview (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics overview
 */
router.get('/overview', authenticate, requireRole('admin'), analyticsController.getOverview.bind(analyticsController));

/**
 * @swagger
 * /analytics/score-distribution:
 *   get:
 *     summary: Get score distribution (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Score distribution
 */
router.get(
  '/score-distribution',
  authenticate,
  requireRole('admin'),
  analyticsController.getScoreDistribution.bind(analyticsController)
);

export default router;
