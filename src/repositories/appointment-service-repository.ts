import { AppointmentService } from '../models/appointment-service';
import type {
  CreateServiceDto,
  UpdateServiceDto,
} from '../types/appointment-service.types';

/**
 * AppointmentService Repository class for handling service data operations
 */
export class AppointmentServiceRepository {
  /**
   * Create a new service
   */
  async create(serviceData: CreateServiceDto): Promise<AppointmentService> {
    return await AppointmentService.create(serviceData as any);
  }

  /**
   * Find service by ID
   */
  async findById(id: string): Promise<AppointmentService | null> {
    return await AppointmentService.findByPk(id);
  }

  /**
   * Find all services (including removed and private)
   */
  async findAll(): Promise<AppointmentService[]> {
    return await AppointmentService.findAll({
      order: [
        ['order', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });
  }

  /**
   * Find all public services (not removed)
   */
  async findPublicServices(): Promise<AppointmentService[]> {
    return await AppointmentService.findAll({
      where: {
        isPublic: true,
        isRemove: false,
      },
      order: [
        ['order', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });
  }

  /**
   * Find public service by ID (not removed)
   */
  async findPublicServiceById(id: string): Promise<AppointmentService | null> {
    return await AppointmentService.findOne({
      where: {
        id,
        isPublic: true,
        isRemove: false,
      },
    });
  }

  /**
   * Update service by ID
   */
  async updateById(
    id: string,
    updateData: UpdateServiceDto
  ): Promise<AppointmentService | null> {
    const service = await AppointmentService.findByPk(id);
    if (!service) {
      return null;
    }

    await service.update(updateData);
    return service;
  }

  /**
   * Soft delete service by ID
   */
  async softDeleteById(id: string): Promise<boolean> {
    const service = await AppointmentService.findByPk(id);
    if (!service) {
      return false;
    }

    await service.update({ isRemove: true });
    return true;
  }

  /**
   * Restore soft-deleted service by ID
   */
  async restoreById(id: string): Promise<AppointmentService | null> {
    const service = await AppointmentService.findByPk(id);
    if (!service) {
      return null;
    }

    await service.update({ isRemove: false });
    return service;
  }

  /**
   * Hard delete service by ID
   */
  async deleteById(id: string): Promise<boolean> {
    const deletedCount = await AppointmentService.destroy({
      where: { id },
    });
    return deletedCount > 0;
  }

  /**
   * Find services by name (partial match)
   */
  async findByName(name: string): Promise<AppointmentService[]> {
    return await AppointmentService.findAll({
      where: {
        name: {
          [require('sequelize').Op.iLike]: `%${name}%`,
        },
      },
      order: [
        ['order', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });
  }

  /**
   * Get service count
   */
  async count(): Promise<number> {
    return await AppointmentService.count();
  }

  /**
   * Get public service count
   */
  async countPublic(): Promise<number> {
    return await AppointmentService.count({
      where: {
        isPublic: true,
        isRemove: false,
      },
    });
  }

  /**
   * Find services by price range
   */
  async findByPriceRange(
    minPrice: number,
    maxPrice: number
  ): Promise<AppointmentService[]> {
    return await AppointmentService.findAll({
      where: {
        price: {
          [require('sequelize').Op.between]: [minPrice, maxPrice],
        },
        isPublic: true,
        isRemove: false,
      },
      order: [
        ['order', 'ASC'],
        ['price', 'ASC'],
      ],
    });
  }
}

export default AppointmentServiceRepository;
