const Router = require('@koa/router');
import { ServiceController } from '../controllers/service-controller';
import { validateBody, validateParams } from '../middlewares/validation';
import { jwtAuth } from '../middlewares/jwt-auth';
import {
  createServiceSchema,
  updateServiceSchema,
  uuidParamSchema,
} from '../validation/service.schemas';

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
  router.get('/', controller.getServices);

  /**
   * GET /services/:id
   * Get service by ID (public only, no authentication required)
   */
  router.get(
    '/:id',
    validateParams(uuidParamSchema),
    controller.getServiceById
  );

  /**
   * POST /services
   * Create a new service (requires authentication)
   */
  router.post(
    '/',
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

  return router;
};

// Default export for convenience
export const serviceRoutes = createServiceRoutes();
