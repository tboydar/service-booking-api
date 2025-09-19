import { Context } from 'koa';
import { ServiceController } from '../service-controller';
import { ServiceManagementService } from '../../services/service-management-service';
import { AppError } from '../../middlewares/error-handler';

// Mock the ServiceManagementService
jest.mock('../../services/service-management-service');

describe('ServiceController', () => {
  let serviceController: ServiceController;
  let mockServiceManagementService: jest.Mocked<ServiceManagementService>;
  let mockContext: Partial<Context>;

  beforeEach(() => {
    // Create mock ServiceManagementService methods
    const mockGetPublicServices = jest.fn();
    const mockGetServiceById = jest.fn();
    const mockCreateService = jest.fn();
    const mockUpdateService = jest.fn();
    const mockDeleteService = jest.fn();
    const mockGetAllServices = jest.fn();
    const mockGetServiceByIdAdmin = jest.fn();

    // Create mock service instance
    mockServiceManagementService = {
      getPublicServices: mockGetPublicServices,
      getServiceById: mockGetServiceById,
      createService: mockCreateService,
      updateService: mockUpdateService,
      deleteService: mockDeleteService,
      getAllServices: mockGetAllServices,
      getServiceByIdAdmin: mockGetServiceByIdAdmin,
    } as any;

    // Create controller with mocked service
    serviceController = new ServiceController(mockServiceManagementService);

    // Create mock context
    mockContext = {
      request: {
        body: {},
      } as any,
      params: {},
      status: 200,
      body: null,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getServices', () => {
    const mockServicesResponse = {
      success: true as const,
      data: [
        {
          id: 'service-1',
          name: 'Service 1',
          description: 'Description 1',
          price: 1000,
          showTime: 30,
          order: 0,
          isRemove: false,
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      timestamp: '2023-01-01T00:00:00.000Z',
    };

    it('應該成功取得公開服務列表', async () => {
      // Arrange
      mockServiceManagementService.getPublicServices.mockResolvedValue(
        mockServicesResponse
      );

      // Act
      await serviceController.getServices(mockContext as Context);

      // Assert
      expect(mockServiceManagementService.getPublicServices).toHaveBeenCalled();
      expect(mockContext.status).toBe(200);
      expect(mockContext.body).toEqual(mockServicesResponse);
    });

    it('應該重新拋出未知錯誤', async () => {
      // Arrange
      const unknownError = new Error('Unknown error');
      mockServiceManagementService.getPublicServices.mockRejectedValue(
        unknownError
      );

      // Act & Assert
      await expect(
        serviceController.getServices(mockContext as Context)
      ).rejects.toThrow(unknownError);
    });
  });

  describe('getServiceById', () => {
    const mockServiceResponse = {
      success: true as const,
      data: {
        id: 'service-1',
        name: 'Service 1',
        description: 'Description 1',
        price: 1000,
        showTime: 30,
        order: 0,
        isRemove: false,
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      timestamp: '2023-01-01T00:00:00.000Z',
    };

    it('應該成功取得指定服務', async () => {
      // Arrange
      (mockContext as any).params = { id: 'service-1' };
      mockServiceManagementService.getServiceById.mockResolvedValue(
        mockServiceResponse
      );

      // Act
      await serviceController.getServiceById(mockContext as Context);

      // Assert
      expect(mockServiceManagementService.getServiceById).toHaveBeenCalledWith(
        'service-1'
      );
      expect(mockContext.status).toBe(200);
      expect(mockContext.body).toEqual(mockServiceResponse);
    });

    it('當服務不存在時應該拋出 NOT_FOUND_ERROR', async () => {
      // Arrange
      (mockContext as any).params = { id: 'non-existent' };
      mockServiceManagementService.getServiceById.mockRejectedValue(
        new Error('NOT_FOUND_ERROR: Service not found')
      );

      // Act & Assert
      await expect(
        serviceController.getServiceById(mockContext as Context)
      ).rejects.toThrow(AppError);

      try {
        await serviceController.getServiceById(mockContext as Context);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe('NOT_FOUND_ERROR');
        expect((error as AppError).statusCode).toBe(404);
        expect((error as AppError).message).toBe('Service not found');
      }
    });

    it('當 ID 格式不正確時應該拋出 VALIDATION_ERROR', async () => {
      // Arrange
      (mockContext as any).params = { id: 'invalid-id' };
      mockServiceManagementService.getServiceById.mockRejectedValue(
        new Error('VALIDATION_ERROR: Service ID must be a non-empty string')
      );

      // Act & Assert
      await expect(
        serviceController.getServiceById(mockContext as Context)
      ).rejects.toThrow(AppError);

      try {
        await serviceController.getServiceById(mockContext as Context);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe('VALIDATION_ERROR');
        expect((error as AppError).statusCode).toBe(400);
      }
    });
  });

  describe('createService', () => {
    const validServiceData = {
      name: 'New Service',
      description: 'Service description',
      price: 1500,
      showTime: 45,
      order: 1,
      isPublic: true,
    };

    const mockCreateResponse = {
      success: true as const,
      data: {
        id: 'new-service-id',
        ...validServiceData,
        isRemove: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      timestamp: '2023-01-01T00:00:00.000Z',
    };

    it('應該成功建立新服務', async () => {
      // Arrange
      mockContext.request!.body = validServiceData;
      mockServiceManagementService.createService.mockResolvedValue(
        mockCreateResponse
      );

      // Act
      await serviceController.createService(mockContext as Context);

      // Assert
      expect(mockServiceManagementService.createService).toHaveBeenCalledWith(
        validServiceData
      );
      expect(mockContext.status).toBe(201);
      expect(mockContext.body).toEqual(mockCreateResponse);
    });

    it('當驗證失敗時應該拋出 VALIDATION_ERROR', async () => {
      // Arrange
      mockContext.request!.body = { name: '' }; // Invalid data
      mockServiceManagementService.createService.mockRejectedValue(
        new Error('VALIDATION_ERROR: Service name is required')
      );

      // Act & Assert
      await expect(
        serviceController.createService(mockContext as Context)
      ).rejects.toThrow(AppError);

      try {
        await serviceController.createService(mockContext as Context);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe('VALIDATION_ERROR');
        expect((error as AppError).statusCode).toBe(400);
      }
    });
  });

  describe('updateService', () => {
    const updateData = {
      name: 'Updated Service',
      price: 2000,
    };

    const mockUpdateResponse = {
      success: true as const,
      data: {
        id: 'service-1',
        name: 'Updated Service',
        description: 'Original description',
        price: 2000,
        showTime: 30,
        order: 0,
        isRemove: false,
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      timestamp: '2023-01-01T00:00:00.000Z',
    };

    it('應該成功更新服務', async () => {
      // Arrange
      (mockContext as any).params = { id: 'service-1' };
      mockContext.request!.body = updateData;
      mockServiceManagementService.updateService.mockResolvedValue(
        mockUpdateResponse
      );

      // Act
      await serviceController.updateService(mockContext as Context);

      // Assert
      expect(mockServiceManagementService.updateService).toHaveBeenCalledWith(
        'service-1',
        updateData
      );
      expect(mockContext.status).toBe(200);
      expect(mockContext.body).toEqual(mockUpdateResponse);
    });

    it('當服務不存在時應該拋出 NOT_FOUND_ERROR', async () => {
      // Arrange
      (mockContext as any).params = { id: 'non-existent' };
      mockContext.request!.body = updateData;
      mockServiceManagementService.updateService.mockRejectedValue(
        new Error('NOT_FOUND_ERROR: Service not found')
      );

      // Act & Assert
      await expect(
        serviceController.updateService(mockContext as Context)
      ).rejects.toThrow(AppError);

      try {
        await serviceController.updateService(mockContext as Context);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe('NOT_FOUND_ERROR');
        expect((error as AppError).statusCode).toBe(404);
      }
    });
  });

  describe('deleteService', () => {
    it('應該成功刪除服務', async () => {
      // Arrange
      (mockContext as any).params = { id: 'service-1' };
      mockServiceManagementService.deleteService.mockResolvedValue();

      // Act
      await serviceController.deleteService(mockContext as Context);

      // Assert
      expect(mockServiceManagementService.deleteService).toHaveBeenCalledWith(
        'service-1'
      );
      expect(mockContext.status).toBe(204);
      expect(mockContext.body).toBeNull();
    });

    it('當服務不存在時應該拋出 NOT_FOUND_ERROR', async () => {
      // Arrange
      (mockContext as any).params = { id: 'non-existent' };
      mockServiceManagementService.deleteService.mockRejectedValue(
        new Error('NOT_FOUND_ERROR: Service not found')
      );

      // Act & Assert
      await expect(
        serviceController.deleteService(mockContext as Context)
      ).rejects.toThrow(AppError);

      try {
        await serviceController.deleteService(mockContext as Context);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe('NOT_FOUND_ERROR');
        expect((error as AppError).statusCode).toBe(404);
      }
    });

    it('當刪除失敗時應該拋出 INTERNAL_ERROR', async () => {
      // Arrange
      (mockContext as any).params = { id: 'service-1' };
      mockServiceManagementService.deleteService.mockRejectedValue(
        new Error('INTERNAL_ERROR: Failed to delete service')
      );

      // Act & Assert
      await expect(
        serviceController.deleteService(mockContext as Context)
      ).rejects.toThrow(AppError);

      try {
        await serviceController.deleteService(mockContext as Context);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe('INTERNAL_ERROR');
        expect((error as AppError).statusCode).toBe(500);
      }
    });
  });

  describe('constructor', () => {
    it('應該使用提供的 ServiceManagementService', () => {
      // Arrange & Act
      const controller = new ServiceController(mockServiceManagementService);

      // Assert
      expect(controller).toBeInstanceOf(ServiceController);
    });

    it('應該在沒有提供 ServiceManagementService 時建立預設實例', () => {
      // Arrange & Act
      const controller = new ServiceController();

      // Assert
      expect(controller).toBeInstanceOf(ServiceController);
    });
  });
});
