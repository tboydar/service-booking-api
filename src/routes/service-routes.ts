const Router = require('@koa/router');
import { ServiceController } from '../controllers/service-controller';
import { validateBody, validateParams } from '../middlewares/validation';
import { jwtAuth } from '../middlewares/jwt-auth';
import {
  createServiceSchema,
  updateServiceSchema,
  uuidParamSchema,
} from '../validation/service.schemas';
import { apiRateLimit } from '../middlewares/rate-limiter';

/**
 * Service management routes
 * Handles appointment service CRUD endpoints
 */
export const createServiceRoutes = (
  serviceController?: ServiceController
): any => {
  const router = new Router({ prefix: '/services' });
  const controller = serviceController || new ServiceController();

  /**
   * GET /services
   * Get all public services (no authentication required)
   */
  router.get('/', apiRateLimit, controller.getServices);

  /**
   * GET /services/:id
   * Get service by ID (public only, no authentication required)
   */
  router.get(
    '/:id',
    apiRateLimit,
    validateParams(uuidParamSchema),
    controller.getServiceById
  );

  /**
   * POST /services
   * Create a new service (requires authentication)
   */
  router.post(
    '/',
    apiRateLimit,
    jwtAuth,
    validateBody(createServiceSchema),
    controller.createService
  );

  /**
   * PUT /services/:id
   * Update an existing service (requires authentication)
   */
  router.put(
    '/:id',
    apiRateLimit,
    jwtAuth,
    validateParams(uuidParamSchema),
    validateBody(updateServiceSchema),
    controller.updateService
  );

  /**
   * DELETE /services/:id
   * Delete a service (soft delete, requires authentication)
   */
  router.delete(
    '/:id',
    jwtAuth,
    validateParams(uuidParamSchema),
    controller.deleteService
  );

  /**
   * PUT /services/:id/restore
   * Restore a soft-deleted service (requires authentication)
   */
  router.put(
    '/:id/restore',
    jwtAuth,
    validateParams(uuidParamSchema),
    controller.restoreService
  );

  return router;
};

// Default export for convenience
export const serviceRoutes = createServiceRoutes();
