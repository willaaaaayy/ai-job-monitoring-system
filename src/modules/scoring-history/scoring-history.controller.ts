import { Request, Response, NextFunction } from 'express';
import scoringHistoryService from './scoring-history.service';

export class ScoringHistoryController {
  async getHistoryByJobId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const history = await scoringHistoryService.getHistoryByJobId(id, tenantId);
      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ScoringHistoryController();
