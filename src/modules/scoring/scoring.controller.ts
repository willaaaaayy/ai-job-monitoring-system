import { Request, Response, NextFunction } from 'express';
import scoringService, { scoringWebhookSchema } from './scoring.service';
import { ValidationError } from '../../middlewares/error.middleware';

export class ScoringController {
  async receiveScoringResult(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate request body with Zod
      const validationResult = scoringWebhookSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        throw new ValidationError('Invalid webhook payload', errors);
      }

      await scoringService.processScoringResult(validationResult.data);

      res.status(200).json({
        success: true,
        message: 'Scoring result processed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ScoringController();
