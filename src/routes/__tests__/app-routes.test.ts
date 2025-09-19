import { AppRoutes } from '../app-routes';
import Koa from 'koa';

describe('AppRoutes', () => {
  let appRoutes: AppRoutes;

  beforeEach(() => {
    appRoutes = new AppRoutes();
  });

  describe('Constructor', () => {
    it('應該正確初始化路由', () => {
      expect(appRoutes).toBeInstanceOf(AppRoutes);
    });
  });

  describe('getRoutes', () => {
    it('應該回傳所有路由陣列', () => {
      const routes = appRoutes.getRoutes();

      expect(Array.isArray(routes)).toBe(true);
      expect(routes).toHaveLength(2); // auth and service routes
    });
  });

  describe('applyRoutes', () => {
    it('應該將路由套用到 Koa 應用程式', () => {
      const app = new Koa();
      const useSpy = jest.spyOn(app, 'use');

      appRoutes.applyRoutes(app);

      // Should call app.use for routes and allowedMethods for each router
      expect(useSpy).toHaveBeenCalledTimes(4); // 2 routers × 2 calls each (routes + allowedMethods)
    });
  });

  describe('getRouteInfo', () => {
    it('應該回傳正確的路由資訊', () => {
      const routeInfo = appRoutes.getRouteInfo();

      expect(routeInfo).toHaveLength(2);

      // Check auth routes
      const authRoutes = routeInfo.find(r => r.prefix === '/auth');
      expect(authRoutes).toBeDefined();
      expect(authRoutes?.routes).toHaveLength(2);
      expect(authRoutes?.routes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            method: 'POST',
            path: '/register',
            description: 'User registration',
            auth: false,
          }),
          expect.objectContaining({
            method: 'POST',
            path: '/login',
            description: 'User login',
            auth: false,
          }),
        ])
      );

      // Check service routes
      const serviceRoutes = routeInfo.find(r => r.prefix === '/services');
      expect(serviceRoutes).toBeDefined();
      expect(serviceRoutes?.routes).toHaveLength(5);
      expect(serviceRoutes?.routes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            method: 'GET',
            path: '/',
            description: 'Get public services',
            auth: false,
          }),
          expect.objectContaining({
            method: 'GET',
            path: '/:id',
            description: 'Get service by ID',
            auth: false,
          }),
          expect.objectContaining({
            method: 'POST',
            path: '/',
            description: 'Create service',
            auth: true,
          }),
          expect.objectContaining({
            method: 'PUT',
            path: '/:id',
            description: 'Update service',
            auth: true,
          }),
          expect.objectContaining({
            method: 'DELETE',
            path: '/:id',
            description: 'Delete service',
            auth: true,
          }),
        ])
      );
    });
  });

  describe('Route Documentation', () => {
    it('應該提供完整的路由文件', () => {
      const routeInfo = appRoutes.getRouteInfo();

      routeInfo.forEach(routeGroup => {
        expect(routeGroup.prefix).toBeDefined();
        expect(Array.isArray(routeGroup.routes)).toBe(true);

        routeGroup.routes.forEach(route => {
          expect(route.method).toBeDefined();
          expect(route.path).toBeDefined();
          expect(route.description).toBeDefined();
          expect(typeof route.auth).toBe('boolean');
        });
      });
    });
  });
});
