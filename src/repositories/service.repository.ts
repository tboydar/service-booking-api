import { Service } from '../models';

export class ServiceRepository {
  async findAll(): Promise<Service[]> {
    return Service.findAll();
  }

  async findById(id: string): Promise<Service | null> {
    return Service.findByPk(id);
  }

  async create(serviceData: Partial<Service>): Promise<Service> {
    return Service.create(serviceData);
  }

  async update(id: string, serviceData: Partial<Service>): Promise<[number, Service[]]> {
    return Service.update(serviceData, { where: { id }, returning: true });
  }

  async delete(id: string): Promise<number> {
    return Service.destroy({ where: { id } });
  }

  async count(): Promise<number> {
    return Service.count();
  }
}