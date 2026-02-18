import { Router } from 'express';
import tenantController from './tenant.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';

const router = Router();

/**
 * @swagger
 * /tenants:
 *   post:
 *     summary: Create a new tenant (Admin only)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, requireRole('admin'), tenantController.createTenant.bind(tenantController));

/**
 * @swagger
 * /tenants:
 *   get:
 *     summary: Get all tenants (Admin only)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, requireRole('admin'), tenantController.getAllTenants.bind(tenantController));

/**
 * @swagger
 * /tenants/:id:
 *   get:
 *     summary: Get tenant by ID
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, tenantController.getTenantById.bind(tenantController));

/**
 * @swagger
 * /tenants/:id:
 *   put:
 *     summary: Update tenant (Admin only)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticate, requireRole('admin'), tenantController.updateTenant.bind(tenantController));

/**
 * @swagger
 * /tenants/plan-limit/check:
 *   get:
 *     summary: Check plan limit for current tenant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 */
router.get('/plan-limit/check', authenticate, tenantController.checkPlanLimit.bind(tenantController));

export default router;
