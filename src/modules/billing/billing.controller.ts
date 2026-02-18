import { Request, Response, NextFunction } from 'express';
import billingService from './billing.service';
import { createCheckoutSessionSchema } from './billing.types';
import { ValidationError } from '../../middlewares/error.middleware';
import logger from '../../infrastructure/logger';

export class BillingController {
  async createCheckoutSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const validationResult = createCheckoutSessionSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError('Invalid checkout session data', errors);
      }

      const { url } = await billingService.createCheckoutSession(tenantId, validationResult.data);
      res.status(200).json({
        success: true,
        data: { url },
      });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      if (!signature) {
        res.status(400).json({ error: 'Missing Stripe signature' });
        return;
      }

      // req.body is already a Buffer when using express.raw()
      const event = await billingService.verifyWebhookSignature(req.body as Buffer, signature);
      await billingService.handleWebhook(event);

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Webhook handling error', { error });
      next(error);
    }
  }
}

export default new BillingController();
