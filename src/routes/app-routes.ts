import { createAuthRoutes } from './auth-routes';
import { createServiceRoutes } from './service-routes';

/**
 * Application routes configuration
 * Centralizes all route definitions and provides a unified interface
 */
export class AppRoutes {
  private authRoutes: any;
  private serviceRoutes: any;

  constructor() {
    this.authRoutes = createAuthRoutes();
    this.serviceRoutes = createServiceRoutes();
  }

  /**
   * Get all configured routes
   */
  public getRoutes(): any[] {
    return [this.authRoutes, this.serviceRoutes];
  }

  /**
   * Apply all routes to a Koa application
   */
  public applyRoutes(app: any): void {
    // Apply auth routes
    app.use(this.authRoutes.routes());
    app.use(this.authRoutes.allowedMethods());

    // Apply service routes
    app.use(this.serviceRoutes.routes());
    app.use(this.serviceRoutes.allowedMethods());
  }

  /**
   * Get route information for documentation/debugging
   */
  public getRouteInfo(): RouteInfo[] {
    return [
      {
        prefix: '/auth',
        routes: [
          {
            method: 'POST',
            path: '/register',
            description: 'User registration',
            auth: false,
          },
          {
            method: 'POST',
            path: '/login',
            description: 'User login',
            auth: false,
          },
        ],
      },
      {
        prefix: '/services',
        routes: [
          {
            method: 'GET',
            path: '/',
            description: 'Get public services',
            auth: false,
          },
          {
            method: 'GET',
            path: '/:id',
            description: 'Get service by ID',
            auth: false,
          },
          {
            method: 'POST',
            path: '/',
            description: 'Create service',
            auth: true,
          },
          {
            method: 'PUT',
            path: '/:id',
            description: 'Update service',
            auth: true,
          },
          {
            method: 'DELETE',
            path: '/:id',
            description: 'Delete service',
            auth: true,
          },
        ],
      },
    ];
  }
}

/**
 * Route information interface
 */
interface RouteInfo {
  prefix: string;
  routes: {
    method: string;
    path: string;
    description: string;
    auth: boolean;
  }[];
}

/**
 * Default app routes instance
 */
export const appRoutes = new AppRoutes();
