import { Context } from 'koa';
import { ServiceManagementService } from '../services/service-management-service';
import { AppError } from '../middlewares/error-handler';
import type {
  CreateServiceRequest,
  UpdateServiceRequest,
  UuidParam,
} from '../validation/service.schemas';

/**
 * Service controller for handling appointment service CRUD endpoints
 */
export class ServiceController {
  private serviceManagementService: ServiceManagementService;

  constructor(serviceManagementService?: ServiceManagementService) {
    this.serviceManagementService =
      serviceManagementService || new ServiceManagementService();
  }

  /**
   * Get all public services
   * GET /services
   */
  getServices = async (ctx: Context): Promise<void> => {
    const result = await this.serviceManagementService.getPublicServices();

    ctx.status = 200;
    ctx.body = result;
  };

  /**
   * Get service by ID (public only)
   * GET /services/:id
   */
  getServiceById = async (ctx: Context): Promise<void> => {
    try {
      const { id } = (ctx as any).params as UuidParam;

      const result = await this.serviceManagementService.getServiceById(id);

      ctx.status = 200;
      ctx.body = result;
    } catch (error: any) {
      // Handle service-specific errors
      if (error.message.startsWith('NOT_FOUND_ERROR:')) {
        throw new AppError('NOT_FOUND_ERROR', 'Service not found', 404);
      }

      if (error.message.startsWith('VALIDATION_ERROR:')) {
        throw new AppError(
          'VALIDATION_ERROR',
          error.message.replace('VALIDATION_ERROR: ', ''),
          400
        );
      }

      // Re-throw unknown errors
      throw error;
    }
  };

  /**
   * Create a new service (requires authentication)
   * POST /services
   */
  createService = async (ctx: Context): Promise<void> => {
    try {
      const serviceData = ctx.request.body as CreateServiceRequest;

      const result =
        await this.serviceManagementService.createService(serviceData);

      ctx.status = 201;
      ctx.body = result;
    } catch (error: any) {
      // Handle service-specific errors
      if (error.message.startsWith('VALIDATION_ERROR:')) {
        throw new AppError(
          'VALIDATION_ERROR',
          error.message.replace('VALIDATION_ERROR: ', ''),
          400
        );
      }

      // Re-throw unknown errors
      throw error;
    }
  };

  /**
   * Update an existing service (requires authentication)
   * PUT /services/:id
   */
  updateService = async (ctx: Context): Promise<void> => {
    try {
      const { id } = (ctx as any).params as UuidParam;
      const serviceData = ctx.request.body as UpdateServiceRequest;

      const result = await this.serviceManagementService.updateService(
        id,
        serviceData
      );

      ctx.status = 200;
      ctx.body = result;
    } catch (error: any) {
      // Handle service-specific errors
      if (error.message.startsWith('NOT_FOUND_ERROR:')) {
        throw new AppError('NOT_FOUND_ERROR', 'Service not found', 404);
      }

      if (error.message.startsWith('VALIDATION_ERROR:')) {
        throw new AppError(
          'VALIDATION_ERROR',
          error.message.replace('VALIDATION_ERROR: ', ''),
          400
        );
      }

      // Re-throw unknown errors
      throw error;
    }
  };

  /**
   * Delete a service (soft delete, requires authentication)
   * DELETE /services/:id
   */
  deleteService = async (ctx: Context): Promise<void> => {
    try {
      const { id } = (ctx as any).params as UuidParam;

      await this.serviceManagementService.deleteService(id);

      ctx.status = 204;
      ctx.body = null;
    } catch (error: any) {
      // Handle service-specific errors
      if (error.message.startsWith('NOT_FOUND_ERROR:')) {
        throw new AppError('NOT_FOUND_ERROR', 'Service not found', 404);
      }

      if (error.message.startsWith('VALIDATION_ERROR:')) {
        throw new AppError(
          'VALIDATION_ERROR',
          error.message.replace('VALIDATION_ERROR: ', ''),
          400
        );
      }

      if (error.message.startsWith('INTERNAL_ERROR:')) {
        throw new AppError('INTERNAL_ERROR', 'Failed to delete service', 500);
      }

      // Re-throw unknown errors
      throw error;
    }
  };

  /**
   * Restore a soft-deleted service (requires authentication)
   * PUT /services/:id/restore
   */
  restoreService = async (ctx: Context): Promise<void> => {
    try {
      const { id } = (ctx as any).params as UuidParam;

      const result = await this.serviceManagementService.restoreService(id);

      ctx.status = 200;
      ctx.body = result;
    } catch (error: any) {
      // Handle service-specific errors
      if (error.message.startsWith('NOT_FOUND_ERROR:')) {
        throw new AppError('NOT_FOUND_ERROR', 'Service not found', 404);
      }

      if (error.message.startsWith('VALIDATION_ERROR:')) {
        throw new AppError(
          'VALIDATION_ERROR',
          error.message.replace('VALIDATION_ERROR: ', ''),
          400
        );
      }

      // Re-throw unknown errors
      throw error;
    }
  };
}

export default ServiceController;
