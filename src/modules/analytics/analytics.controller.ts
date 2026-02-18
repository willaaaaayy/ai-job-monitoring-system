import { Request, Response, NextFunction } from 'express';
import analyticsService from './analytics.service';

export class AnalyticsController {
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const overview = await analyticsService.getOverview(tenantId);
      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  }

  async getScoreDistribution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const distribution = await analyticsService.getScoreDistribution(tenantId);
      res.status(200).json({
        success: true,
        data: distribution,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AnalyticsController();
