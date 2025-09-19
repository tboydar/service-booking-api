import { ServiceManagementService } from '../service-management-service';
import { AppointmentServiceRepository } from '../../repositories/appointment-service-repository';
import type {
  CreateServiceDto,
  UpdateServiceDto,
} from '../../types/appointment-service.types';

// Mock dependencies
jest.mock('../../repositories/appointment-service-repository');

// Mock the AppointmentServiceRepository
jest.mock('../../repositories/appointment-service-repository');

describe('ServiceManagementService', () => {
  let serviceManagementService: ServiceManagementService;
  let mockServiceRepository: jest.Mocked<AppointmentServiceRepository>;

  const mockService = {
    id: 'service-123',
    name: 'Test Service',
    description: 'Test Description',
    price: 1000,
    showTime: 60,
    order: 1,
    isRemove: false,
    isPublic: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockServiceRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findPublicServices: jest.fn(),
      findPublicServiceById: jest.fn(),
      updateById: jest.fn(),
      softDeleteById: jest.fn(),
      deleteById: jest.fn(),
      findByName: jest.fn(),
      count: jest.fn(),
      countPublic: jest.fn(),
      findByPriceRange: jest.fn(),
    } as any;

    serviceManagementService = new ServiceManagementService(
      mockServiceRepository
    );
  });

  describe('getPublicServices', () => {
    it('應該回傳所有公開服務', async () => {
      // Arrange
      const mockServices = [mockService, { ...mockService, id: 'service-456' }];
      mockServiceRepository.findPublicServices.mockResolvedValue(
        mockServices as any
      );

      // Act
      const result = await serviceManagementService.getPublicServices();

      // Assert
      expect(mockServiceRepository.findPublicServices).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        data: mockServices,
        timestamp: expect.any(String),
      });
    });

    it('應該回傳空陣列當沒有公開服務時', async () => {
      // Arrange
      mockServiceRepository.findPublicServices.mockResolvedValue([]);

      // Act
      const result = await serviceManagementService.getPublicServices();

      // Assert
      expect(result.data).toEqual([]);
    });
  });

  describe('getServiceById', () => {
    it('應該回傳指定的公開服務', async () => {
      // Arrange
      mockServiceRepository.findPublicServiceById.mockResolvedValue(
        mockService as any
      );

      // Act
      const result =
        await serviceManagementService.getServiceById('service-123');

      // Assert
      expect(mockServiceRepository.findPublicServiceById).toHaveBeenCalledWith(
        'service-123'
      );
      expect(result).toEqual({
        success: true,
        data: mockService,
        timestamp: expect.any(String),
      });
    });

    it('應該在服務不存在時拋出錯誤', async () => {
      // Arrange
      mockServiceRepository.findPublicServiceById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        serviceManagementService.getServiceById('non-existent')
      ).rejects.toThrow('NOT_FOUND_ERROR: Service not found');
    });

    it('應該在 ID 無效時拋出錯誤', async () => {
      // Act & Assert
      await expect(serviceManagementService.getServiceById('')).rejects.toThrow(
        'VALIDATION_ERROR: Service ID must be a non-empty string'
      );

      await expect(
        serviceManagementService.getServiceById(null as any)
      ).rejects.toThrow(
        'VALIDATION_ERROR: Service ID must be a non-empty string'
      );
    });
  });

  describe('createService', () => {
    const validCreateData: CreateServiceDto = {
      name: 'New Service',
      description: 'New Description',
      price: 2000,
      showTime: 90,
      order: 2,
      isPublic: true,
    };

    it('應該成功建立新服務', async () => {
      // Arrange
      const createdService = { ...mockService, ...validCreateData };
      mockServiceRepository.create.mockResolvedValue(createdService as any);

      // Act
      const result =
        await serviceManagementService.createService(validCreateData);

      // Assert
      expect(mockServiceRepository.create).toHaveBeenCalledWith({
        name: 'New Service',
        description: 'New Description',
        price: 2000,
        showTime: 90,
        order: 2,
        isPublic: true,
        isRemove: false,
      });

      expect(result).toEqual({
        success: true,
        data: createdService,
        timestamp: expect.any(String),
      });
    });

    it('應該使用預設值建立服務', async () => {
      // Arrange
      const minimalData: CreateServiceDto = {
        name: 'Minimal Service',
        price: 1500,
      };

      const createdService = {
        ...mockService,
        name: 'Minimal Service',
        price: 1500,
        order: 0,
        isPublic: true,
      };

      mockServiceRepository.create.mockResolvedValue(createdService as any);

      // Act
      await serviceManagementService.createService(minimalData);

      // Assert
      expect(mockServiceRepository.create).toHaveBeenCalledWith({
        name: 'Minimal Service',
        description: undefined,
        price: 1500,
        showTime: undefined,
        order: 0,
        isPublic: true,
        isRemove: false,
      });
    });

    it('應該在服務名稱無效時拋出錯誤', async () => {
      // Act & Assert
      await expect(
        serviceManagementService.createService({ name: '', price: 1000 })
      ).rejects.toThrow('VALIDATION_ERROR: Service name is required');

      await expect(
        serviceManagementService.createService({
          name: null as any,
          price: 1000,
        })
      ).rejects.toThrow('VALIDATION_ERROR: Service name is required');
    });

    it('應該在價格無效時拋出錯誤', async () => {
      // Act & Assert
      await expect(
        serviceManagementService.createService({ name: 'Test', price: -100 })
      ).rejects.toThrow(
        'VALIDATION_ERROR: Service price must be a non-negative number'
      );

      await expect(
        serviceManagementService.createService({
          name: 'Test',
          price: 'invalid' as any,
        })
      ).rejects.toThrow(
        'VALIDATION_ERROR: Service price must be a non-negative number'
      );
    });

    it('應該正確處理名稱和描述的空白字元', async () => {
      // Arrange
      const dataWithSpaces: CreateServiceDto = {
        name: '  Spaced Service  ',
        description: '  Spaced Description  ',
        price: 1000,
      };

      mockServiceRepository.create.mockResolvedValue(mockService as any);

      // Act
      await serviceManagementService.createService(dataWithSpaces);

      // Assert
      expect(mockServiceRepository.create).toHaveBeenCalledWith({
        name: 'Spaced Service',
        description: 'Spaced Description',
        price: 1000,
        showTime: undefined,
        order: 0,
        isPublic: true,
        isRemove: false,
      });
    });
  });

  describe('updateService', () => {
    const validUpdateData: UpdateServiceDto = {
      name: 'Updated Service',
      price: 1500,
    };

    it('應該成功更新服務', async () => {
      // Arrange
      const updatedService = { ...mockService, ...validUpdateData };
      mockServiceRepository.findById.mockResolvedValue(mockService as any);
      mockServiceRepository.updateById.mockResolvedValue(updatedService as any);

      // Act
      const result = await serviceManagementService.updateService(
        'service-123',
        validUpdateData
      );

      // Assert
      expect(mockServiceRepository.findById).toHaveBeenCalledWith(
        'service-123'
      );
      expect(mockServiceRepository.updateById).toHaveBeenCalledWith(
        'service-123',
        {
          name: 'Updated Service',
          price: 1500,
        }
      );

      expect(result).toEqual({
        success: true,
        data: updatedService,
        timestamp: expect.any(String),
      });
    });

    it('應該在服務不存在時拋出錯誤', async () => {
      // Arrange
      mockServiceRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        serviceManagementService.updateService('non-existent', validUpdateData)
      ).rejects.toThrow('NOT_FOUND_ERROR: Service not found');
    });

    it('應該在 ID 無效時拋出錯誤', async () => {
      // Act & Assert
      await expect(
        serviceManagementService.updateService('', validUpdateData)
      ).rejects.toThrow(
        'VALIDATION_ERROR: Service ID must be a non-empty string'
      );
    });

    it('應該驗證更新資料的格式', async () => {
      // Arrange
      mockServiceRepository.findById.mockResolvedValue(mockService as any);

      // Act & Assert
      await expect(
        serviceManagementService.updateService('service-123', { name: '' })
      ).rejects.toThrow(
        'VALIDATION_ERROR: Service name must be a non-empty string'
      );

      await expect(
        serviceManagementService.updateService('service-123', { price: -100 })
      ).rejects.toThrow(
        'VALIDATION_ERROR: Service price must be a non-negative number'
      );

      await expect(
        serviceManagementService.updateService('service-123', { showTime: -10 })
      ).rejects.toThrow(
        'VALIDATION_ERROR: Show time must be a non-negative number'
      );

      await expect(
        serviceManagementService.updateService('service-123', { order: -1 })
      ).rejects.toThrow(
        'VALIDATION_ERROR: Order must be a non-negative number'
      );

      await expect(
        serviceManagementService.updateService('service-123', {
          isPublic: 'invalid' as any,
        })
      ).rejects.toThrow('VALIDATION_ERROR: isPublic must be a boolean');
    });

    it('應該只更新提供的欄位', async () => {
      // Arrange
      const partialUpdate: UpdateServiceDto = { name: 'Partial Update' };
      mockServiceRepository.findById.mockResolvedValue(mockService as any);
      mockServiceRepository.updateById.mockResolvedValue(mockService as any);

      // Act
      await serviceManagementService.updateService(
        'service-123',
        partialUpdate
      );

      // Assert
      expect(mockServiceRepository.updateById).toHaveBeenCalledWith(
        'service-123',
        {
          name: 'Partial Update',
        }
      );
    });
  });

  describe('deleteService', () => {
    it('應該成功軟刪除服務', async () => {
      // Arrange
      mockServiceRepository.findById.mockResolvedValue(mockService as any);
      mockServiceRepository.softDeleteById.mockResolvedValue(true);

      // Act
      await serviceManagementService.deleteService('service-123');

      // Assert
      expect(mockServiceRepository.findById).toHaveBeenCalledWith(
        'service-123'
      );
      expect(mockServiceRepository.softDeleteById).toHaveBeenCalledWith(
        'service-123'
      );
    });

    it('應該在服務不存在時拋出錯誤', async () => {
      // Arrange
      mockServiceRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        serviceManagementService.deleteService('non-existent')
      ).rejects.toThrow('NOT_FOUND_ERROR: Service not found');
    });

    it('應該在 ID 無效時拋出錯誤', async () => {
      // Act & Assert
      await expect(serviceManagementService.deleteService('')).rejects.toThrow(
        'VALIDATION_ERROR: Service ID must be a non-empty string'
      );
    });

    it('應該在軟刪除失敗時拋出錯誤', async () => {
      // Arrange
      mockServiceRepository.findById.mockResolvedValue(mockService as any);
      mockServiceRepository.softDeleteById.mockResolvedValue(false);

      // Act & Assert
      await expect(
        serviceManagementService.deleteService('service-123')
      ).rejects.toThrow('INTERNAL_ERROR: Failed to delete service');
    });
  });

  describe('getAllServices', () => {
    it('應該回傳所有服務（包含私有和已刪除）', async () => {
      // Arrange
      const allServices = [
        mockService,
        { ...mockService, id: 'service-456', isPublic: false },
        { ...mockService, id: 'service-789', isRemove: true },
      ];
      mockServiceRepository.findAll.mockResolvedValue(allServices as any);

      // Act
      const result = await serviceManagementService.getAllServices();

      // Assert
      expect(mockServiceRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        data: allServices,
        timestamp: expect.any(String),
      });
    });
  });

  describe('getServiceByIdAdmin', () => {
    it('應該回傳指定服務（包含私有和已刪除）', async () => {
      // Arrange
      mockServiceRepository.findById.mockResolvedValue(mockService as any);

      // Act
      const result =
        await serviceManagementService.getServiceByIdAdmin('service-123');

      // Assert
      expect(mockServiceRepository.findById).toHaveBeenCalledWith(
        'service-123'
      );
      expect(result).toEqual({
        success: true,
        data: mockService,
        timestamp: expect.any(String),
      });
    });

    it('應該在服務不存在時拋出錯誤', async () => {
      // Arrange
      mockServiceRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        serviceManagementService.getServiceByIdAdmin('non-existent')
      ).rejects.toThrow('NOT_FOUND_ERROR: Service not found');
    });
  });
});
