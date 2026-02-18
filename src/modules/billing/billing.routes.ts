import { Router } from 'express';
import billingController from './billing.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { userRateLimitMiddleware } from '../../middlewares/userRateLimit.middleware';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limit billing endpoints
const billingRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many billing requests, please try again later',
});

/**
 * @swagger
 * /billing/create-checkout-session:
 *   post:
 *     summary: Create Stripe checkout session
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/create-checkout-session',
  authenticate,
  userRateLimitMiddleware,
  billingRateLimit,
  billingController.createCheckoutSession.bind(billingController)
);

/**
 * @swagger
 * /billing/webhook:
 *   post:
 *     summary: Stripe webhook endpoint (no auth required, signature verified)
 *     tags: [Billing]
 */
router.post(
  '/webhook',
  billingController.handleWebhook.bind(billingController)
);

export default router;
