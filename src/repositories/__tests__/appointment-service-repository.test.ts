import { AppointmentServiceRepository } from '../appointment-service-repository';
import { AppointmentService } from '../../models/appointment-service';
import { sequelize } from '../../config/database';
import type {
  CreateServiceDto,
  UpdateServiceDto,
} from '../../types/appointment-service.types';

describe('AppointmentServiceRepository', () => {
  let serviceRepository: AppointmentServiceRepository;

  beforeAll(async () => {
    // 確保資料庫連接已建立
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    serviceRepository = new AppointmentServiceRepository();
    // 清空測試資料
    await AppointmentService.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('create', () => {
    it('應該成功建立新服務', async () => {
      const serviceData: CreateServiceDto = {
        name: 'Test Service',
        description: 'Test Description',
        price: 1000,
        showTime: 60,
        order: 1,
        isPublic: true,
      };

      const service = await serviceRepository.create(serviceData);

      expect(service).toBeDefined();
      expect(service.name).toBe(serviceData.name);
      expect(service.description).toBe(serviceData.description);
      expect(service.price).toBe(serviceData.price);
      expect(service.showTime).toBe(serviceData.showTime);
      expect(service.order).toBe(serviceData.order);
      expect(service.isPublic).toBe(serviceData.isPublic);
      expect(service.isRemove).toBe(false);
      expect(service.id).toBeDefined();
    });

    it('應該使用預設值建立服務', async () => {
      const serviceData: CreateServiceDto = {
        name: 'Minimal Service',
        price: 500,
      };

      const service = await serviceRepository.create(serviceData);

      expect(service.name).toBe(serviceData.name);
      expect(service.price).toBe(serviceData.price);
      expect(service.order).toBe(0);
      expect(service.isPublic).toBe(true);
      expect(service.isRemove).toBe(false);
    });
  });

  describe('findById', () => {
    it('應該根據 ID 找到服務', async () => {
      const serviceData: CreateServiceDto = {
        name: 'Find By ID Service',
        price: 1500,
      };

      const createdService = await serviceRepository.create(serviceData);
      const foundService = await serviceRepository.findById(createdService.id);

      expect(foundService).toBeDefined();
      expect(foundService!.id).toBe(createdService.id);
      expect(foundService!.name).toBe(serviceData.name);
    });

    it('當服務不存在時應該回傳 null', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const foundService = await serviceRepository.findById(nonExistentId);

      expect(foundService).toBeNull();
    });
  });

  describe('findAll', () => {
    it('應該回傳所有服務並按 order 排序', async () => {
      const services = [
        { name: 'Service C', price: 1000, order: 3 },
        { name: 'Service A', price: 1000, order: 1 },
        { name: 'Service B', price: 1000, order: 2 },
      ];

      await Promise.all(
        services.map(service => serviceRepository.create(service))
      );
      const foundServices = await serviceRepository.findAll();

      expect(foundServices).toHaveLength(3);
      expect(foundServices[0]?.name).toBe('Service A');
      expect(foundServices[1]?.name).toBe('Service B');
      expect(foundServices[2]?.name).toBe('Service C');
    });
  });

  describe('findPublicServices', () => {
    it('應該只回傳公開且未刪除的服務', async () => {
      const services = [
        {
          name: 'Public Service',
          price: 1000,
          isPublic: true,
          isRemove: false,
        },
        {
          name: 'Private Service',
          price: 1000,
          isPublic: false,
          isRemove: false,
        },
        {
          name: 'Removed Service',
          price: 1000,
          isPublic: true,
          isRemove: true,
        },
      ];

      await Promise.all(
        services.map(service => AppointmentService.create(service as any))
      );

      const publicServices = await serviceRepository.findPublicServices();

      expect(publicServices).toHaveLength(1);
      expect(publicServices[0]?.name).toBe('Public Service');
    });

    it('應該按 order 排序公開服務', async () => {
      const services = [
        { name: 'Service C', price: 1000, order: 3, isPublic: true },
        { name: 'Service A', price: 1000, order: 1, isPublic: true },
        { name: 'Service B', price: 1000, order: 2, isPublic: true },
      ];

      await Promise.all(
        services.map(service => serviceRepository.create(service))
      );
      const publicServices = await serviceRepository.findPublicServices();

      expect(publicServices).toHaveLength(3);
      expect(publicServices[0]?.name).toBe('Service A');
      expect(publicServices[1]?.name).toBe('Service B');
      expect(publicServices[2]?.name).toBe('Service C');
    });
  });

  describe('findPublicServiceById', () => {
    it('應該找到公開且未刪除的服務', async () => {
      const serviceData: CreateServiceDto = {
        name: 'Public Service',
        price: 1000,
        isPublic: true,
      };

      const createdService = await serviceRepository.create(serviceData);
      const foundService = await serviceRepository.findPublicServiceById(
        createdService.id
      );

      expect(foundService).toBeDefined();
      expect(foundService!.name).toBe(serviceData.name);
    });

    it('當服務為私有時應該回傳 null', async () => {
      const serviceData = {
        name: 'Private Service',
        price: 1000,
        isPublic: false,
      };

      const createdService = await AppointmentService.create(
        serviceData as any
      );
      const foundService = await serviceRepository.findPublicServiceById(
        createdService.id
      );

      expect(foundService).toBeNull();
    });

    it('當服務已刪除時應該回傳 null', async () => {
      const serviceData = {
        name: 'Removed Service',
        price: 1000,
        isPublic: true,
        isRemove: true,
      };

      const createdService = await AppointmentService.create(
        serviceData as any
      );
      const foundService = await serviceRepository.findPublicServiceById(
        createdService.id
      );

      expect(foundService).toBeNull();
    });
  });

  describe('updateById', () => {
    it('應該成功更新服務資料', async () => {
      const serviceData: CreateServiceDto = {
        name: 'Original Service',
        price: 1000,
      };

      const createdService = await serviceRepository.create(serviceData);
      const updateData: UpdateServiceDto = {
        name: 'Updated Service',
        price: 1500,
      };

      const updatedService = await serviceRepository.updateById(
        createdService.id,
        updateData
      );

      expect(updatedService).toBeDefined();
      expect(updatedService!.name).toBe('Updated Service');
      expect(updatedService!.price).toBe(1500);
    });

    it('當服務不存在時應該回傳 null', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updatedService = await serviceRepository.updateById(nonExistentId, {
        name: 'New Name',
      });

      expect(updatedService).toBeNull();
    });
  });

  describe('softDeleteById', () => {
    it('應該成功軟刪除服務', async () => {
      const serviceData: CreateServiceDto = {
        name: 'Delete Service',
        price: 1000,
      };

      const createdService = await serviceRepository.create(serviceData);
      const deleted = await serviceRepository.softDeleteById(createdService.id);

      expect(deleted).toBe(true);

      const foundService = await serviceRepository.findById(createdService.id);
      expect(foundService!.isRemove).toBe(true);
    });

    it('當服務不存在時應該回傳 false', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const deleted = await serviceRepository.softDeleteById(nonExistentId);

      expect(deleted).toBe(false);
    });
  });

  describe('deleteById', () => {
    it('應該成功硬刪除服務', async () => {
      const serviceData: CreateServiceDto = {
        name: 'Hard Delete Service',
        price: 1000,
      };

      const createdService = await serviceRepository.create(serviceData);
      const deleted = await serviceRepository.deleteById(createdService.id);

      expect(deleted).toBe(true);

      const foundService = await serviceRepository.findById(createdService.id);
      expect(foundService).toBeNull();
    });

    it('當服務不存在時應該回傳 false', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const deleted = await serviceRepository.deleteById(nonExistentId);

      expect(deleted).toBe(false);
    });
  });

  describe('count', () => {
    it('應該回傳正確的服務數量', async () => {
      const services = [
        { name: 'Service 1', price: 1000 },
        { name: 'Service 2', price: 1000 },
        { name: 'Service 3', price: 1000 },
      ];

      await Promise.all(
        services.map(service => serviceRepository.create(service))
      );
      const count = await serviceRepository.count();

      expect(count).toBe(3);
    });
  });

  describe('countPublic', () => {
    it('應該回傳正確的公開服務數量', async () => {
      const services = [
        { name: 'Public 1', price: 1000, isPublic: true, isRemove: false },
        { name: 'Public 2', price: 1000, isPublic: true, isRemove: false },
        { name: 'Private', price: 1000, isPublic: false, isRemove: false },
        { name: 'Removed', price: 1000, isPublic: true, isRemove: true },
      ];

      await Promise.all(
        services.map(service => AppointmentService.create(service as any))
      );

      const count = await serviceRepository.countPublic();

      expect(count).toBe(2);
    });
  });

  describe('findByPriceRange', () => {
    it('應該找到價格範圍內的公開服務', async () => {
      const services = [
        { name: 'Cheap Service', price: 500, isPublic: true },
        { name: 'Medium Service', price: 1000, isPublic: true },
        { name: 'Expensive Service', price: 2000, isPublic: true },
        { name: 'Private Service', price: 1000, isPublic: false },
      ];

      await Promise.all(
        services.map(service => serviceRepository.create(service))
      );
      const servicesInRange = await serviceRepository.findByPriceRange(
        800,
        1500
      );

      expect(servicesInRange).toHaveLength(1);
      expect(servicesInRange[0]?.name).toBe('Medium Service');
    });
  });
});
