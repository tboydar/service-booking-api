import { AppointmentServiceRepository } from '../repositories/appointment-service-repository';
import type {
  CreateServiceDto,
  UpdateServiceDto,
  ServiceResponse,
  ServicesListResponse,
  AppointmentServiceAttributes,
} from '../types/appointment-service.types';

/**
 * Service management service for handling appointment service CRUD operations
 */
export class ServiceManagementService {
  private serviceRepository: AppointmentServiceRepository;

  constructor(serviceRepository?: AppointmentServiceRepository) {
    this.serviceRepository =
      serviceRepository || new AppointmentServiceRepository();
  }

  /**
   * Get all public services (not removed)
   * @returns Promise<ServicesListResponse> - List of public services
   */
  async getPublicServices(): Promise<ServicesListResponse> {
    const services = await this.serviceRepository.findPublicServices();

    return {
      success: true,
      data: services.map(service => this.mapServiceToResponse(service)),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get service by ID (public only)
   * @param id - Service ID
   * @returns Promise<ServiceResponse> - Service data
   */
  async getServiceById(id: string): Promise<ServiceResponse> {
    if (!id || typeof id !== 'string') {
      throw new Error(
        'VALIDATION_ERROR: Service ID must be a non-empty string'
      );
    }

    const service = await this.serviceRepository.findPublicServiceById(id);
    if (!service) {
      throw new Error('NOT_FOUND_ERROR: Service not found');
    }

    return {
      success: true,
      data: this.mapServiceToResponse(service),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a new service
   * @param serviceData - Service creation data
   * @returns Promise<ServiceResponse> - Created service data
   */
  async createService(serviceData: CreateServiceDto): Promise<ServiceResponse> {
    // Validate required fields
    if (!serviceData.name || typeof serviceData.name !== 'string') {
      throw new Error('VALIDATION_ERROR: Service name is required');
    }

    if (typeof serviceData.price !== 'number' || serviceData.price < 0) {
      throw new Error(
        'VALIDATION_ERROR: Service price must be a non-negative number'
      );
    }

    // Prepare service data with defaults
    const serviceToCreate: any = {
      name: serviceData.name.trim(),
      price: serviceData.price,
      order: serviceData.order ?? 0,
      isPublic: serviceData.isPublic ?? true,
      isRemove: false, // Always false for new services
    };

    // Only add description if it exists and is not empty
    if (serviceData.description && serviceData.description.trim()) {
      serviceToCreate.description = serviceData.description.trim();
    }

    // Only add showTime if it exists
    if (serviceData.showTime !== undefined) {
      serviceToCreate.showTime = serviceData.showTime;
    }

    const newService = await this.serviceRepository.create(serviceToCreate);

    return {
      success: true,
      data: this.mapServiceToResponse(newService),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update an existing service
   * @param id - Service ID
   * @param serviceData - Service update data
   * @returns Promise<ServiceResponse> - Updated service data
   */
  async updateService(
    id: string,
    serviceData: UpdateServiceDto
  ): Promise<ServiceResponse> {
    if (!id || typeof id !== 'string') {
      throw new Error(
        'VALIDATION_ERROR: Service ID must be a non-empty string'
      );
    }

    // Check if service exists
    const existingService = await this.serviceRepository.findById(id);
    if (!existingService) {
      throw new Error('NOT_FOUND_ERROR: Service not found');
    }

    // Validate update data
    const updateData: UpdateServiceDto = {};

    if (serviceData.name !== undefined) {
      if (!serviceData.name || typeof serviceData.name !== 'string') {
        throw new Error(
          'VALIDATION_ERROR: Service name must be a non-empty string'
        );
      }
      updateData.name = serviceData.name.trim();
    }

    if (serviceData.description !== undefined) {
      updateData.description = serviceData.description?.trim();
    }

    if (serviceData.price !== undefined) {
      if (typeof serviceData.price !== 'number' || serviceData.price < 0) {
        throw new Error(
          'VALIDATION_ERROR: Service price must be a non-negative number'
        );
      }
      updateData.price = serviceData.price;
    }

    if (serviceData.showTime !== undefined) {
      if (
        serviceData.showTime !== null &&
        (typeof serviceData.showTime !== 'number' || serviceData.showTime < 0)
      ) {
        throw new Error(
          'VALIDATION_ERROR: Show time must be a non-negative number'
        );
      }
      updateData.showTime = serviceData.showTime;
    }

    if (serviceData.order !== undefined) {
      if (typeof serviceData.order !== 'number' || serviceData.order < 0) {
        throw new Error(
          'VALIDATION_ERROR: Order must be a non-negative number'
        );
      }
      updateData.order = serviceData.order;
    }

    if (serviceData.isPublic !== undefined) {
      if (typeof serviceData.isPublic !== 'boolean') {
        throw new Error('VALIDATION_ERROR: isPublic must be a boolean');
      }
      updateData.isPublic = serviceData.isPublic;
    }

    const updatedService = await this.serviceRepository.updateById(
      id,
      updateData
    );
    if (!updatedService) {
      throw new Error('INTERNAL_ERROR: Failed to update service');
    }

    return {
      success: true,
      data: this.mapServiceToResponse(updatedService),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Delete a service (soft delete)
   * @param id - Service ID
   * @returns Promise<void>
   */
  async deleteService(id: string): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new Error(
        'VALIDATION_ERROR: Service ID must be a non-empty string'
      );
    }

    // Check if service exists
    const existingService = await this.serviceRepository.findById(id);
    if (!existingService) {
      throw new Error('NOT_FOUND_ERROR: Service not found');
    }

    const success = await this.serviceRepository.softDeleteById(id);
    if (!success) {
      throw new Error('INTERNAL_ERROR: Failed to delete service');
    }
  }

  /**
   * Get all services (including private and removed) - for admin use
   * @returns Promise<ServicesListResponse> - List of all services
   */
  async getAllServices(): Promise<ServicesListResponse> {
    const services = await this.serviceRepository.findAll();

    return {
      success: true,
      data: services.map(service => this.mapServiceToResponse(service)),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get service by ID (including private and removed) - for admin use
   * @param id - Service ID
   * @returns Promise<ServiceResponse> - Service data
   */
  async getServiceByIdAdmin(id: string): Promise<ServiceResponse> {
    if (!id || typeof id !== 'string') {
      throw new Error(
        'VALIDATION_ERROR: Service ID must be a non-empty string'
      );
    }

    const service = await this.serviceRepository.findById(id);
    if (!service) {
      throw new Error('NOT_FOUND_ERROR: Service not found');
    }

    return {
      success: true,
      data: this.mapServiceToResponse(service),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Map service model to response format
   * @param service - Service model instance
   * @returns AppointmentServiceAttributes - Formatted service data
   */
  private mapServiceToResponse(service: any): AppointmentServiceAttributes {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      showTime: service.showTime,
      order: service.order,
      isRemove: service.isRemove,
      isPublic: service.isPublic,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}

export default ServiceManagementService;
