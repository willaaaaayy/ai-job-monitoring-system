import { Request, Response, NextFunction } from 'express';
import tenantService from './tenant.service';
import { createTenantSchema, updateTenantSchema } from './tenant.types';
import { ValidationError } from '../../middlewares/error.middleware';

export class TenantController {
  async createTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationResult = createTenantSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError('Invalid tenant data', errors);
      }

      const tenant = await tenantService.createTenant(validationResult.data);
      res.status(201).json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTenantById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenant = await tenantService.getTenantById(id);
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }
      res.status(200).json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllTenants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : undefined;
      const take = req.query.take ? parseInt(req.query.take as string, 10) : undefined;
      const tenants = await tenantService.getAllTenants(skip, take);
      res.status(200).json({
        success: true,
        data: tenants,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validationResult = updateTenantSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError('Invalid tenant data', errors);
      }

      const tenant = await tenantService.updateTenant(id, validationResult.data);
      res.status(200).json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkPlanLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const limitInfo = await tenantService.checkPlanLimit(tenantId);
      res.status(200).json({
        success: true,
        data: limitInfo,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TenantController();
