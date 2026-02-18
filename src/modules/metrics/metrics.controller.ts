import { Request, Response } from 'express';
import { register, updateQueueMetrics } from '../../infrastructure/metrics';

export class MetricsController {
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      // Update queue metrics before returning
      await updateQueueMetrics();

      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.end(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate metrics' });
    }
  }
}

export default new MetricsController();
