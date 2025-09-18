import { AppointmentService } from '../models';

export class ServiceRepository {
  async findAll(): Promise<AppointmentService[]> {
    return AppointmentService.findAll();
  }

  async findById(id: string): Promise<AppointmentService | null> {
    return AppointmentService.findByPk(id);
  }

  async create(serviceData: Partial<AppointmentService>): Promise<AppointmentService> {
    return AppointmentService.create(serviceData as any);
  }

  async update(id: string, serviceData: Partial<AppointmentService>): Promise<[number, AppointmentService[]]> {
    return AppointmentService.update(serviceData, { where: { id }, returning: true } as any);
  }

  async delete(id: string): Promise<number> {
    return AppointmentService.destroy({ where: { id } });
  }

  async count(): Promise<number> {
    return AppointmentService.count();
  }
}