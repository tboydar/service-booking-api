import { createServiceRoutes } from '../service-routes';
import { ServiceController } from '../../controllers/service-controller';

describe('Service Routes', () => {
  let mockServiceController: jest.Mocked<ServiceController>;

  beforeEach(() => {
    mockServiceController = {
      getServices: jest.fn(),
      getServiceById: jest.fn(),
      createService: jest.fn(),
      updateService: jest.fn(),
      deleteService: jest.fn(),
      restoreService: jest.fn(),  // Add missing method
      serviceManagementService: {} as any,
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createServiceRoutes', () => {
    it('應該建立服務路由', () => {
      // Act
      const router = createServiceRoutes(mockServiceController);

      // Assert
      expect(router).toBeDefined();
      expect(router.opts.prefix).toBe('/services');
    });

    it('應該在沒有提供控制器時使用預設控制器', () => {
      // Act
      const router = createServiceRoutes();

      // Assert
      expect(router).toBeDefined();
      expect(router.opts.prefix).toBe('/services');
    });
  });

  describe('路由端點', () => {
    it('應該有 GET / 路由（公開）', () => {
      // Arrange
      const router = createServiceRoutes(mockServiceController);

      // Act
      const routes = router.stack;

      // Assert
      const getServicesRoute = routes.find(
        (route: any) =>
          route.path === '/services' && route.methods.includes('GET')
      );
      expect(getServicesRoute).toBeDefined();
    });

    it('應該有 GET /:id 路由（公開）', () => {
      // Arrange
      const router = createServiceRoutes(mockServiceController);

      // Act
      const routes = router.stack;

      // Assert
      const getServiceRoute = routes.find(
        (route: any) =>
          route.path === '/services/:id' && route.methods.includes('GET')
      );
      expect(getServiceRoute).toBeDefined();
    });

    it('應該有 POST / 路由（需要認證）', () => {
      // Arrange
      const router = createServiceRoutes(mockServiceController);

      // Act
      const routes = router.stack;

      // Assert
      const createServiceRoute = routes.find(
        (route: any) =>
          route.path === '/services' && route.methods.includes('POST')
      );
      expect(createServiceRoute).toBeDefined();
    });

    it('應該有 PUT /:id 路由（需要認證）', () => {
      // Arrange
      const router = createServiceRoutes(mockServiceController);

      // Act
      const routes = router.stack;

      // Assert
      const updateServiceRoute = routes.find(
        (route: any) =>
          route.path === '/services/:id' && route.methods.includes('PUT')
      );
      expect(updateServiceRoute).toBeDefined();
    });

    it('應該有 DELETE /:id 路由（需要認證）', () => {
      // Arrange
      const router = createServiceRoutes(mockServiceController);

      // Act
      const routes = router.stack;

      // Assert
      const deleteServiceRoute = routes.find(
        (route: any) =>
          route.path === '/services/:id' && route.methods.includes('DELETE')
      );
      expect(deleteServiceRoute).toBeDefined();
    });
  });
});
