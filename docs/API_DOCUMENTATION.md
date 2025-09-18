# API Documentation

This directory contains the API documentation implementation for the Service Booking API.

## Overview

The API documentation is implemented using a combination of:

1. **OpenAPI/Swagger Specification** - Machine-readable API specification
2. **Custom HTML Documentation** - User-friendly, interactive documentation
3. **Route Documentation** - JSDoc comments in route files

## File Structure

```
src/
├── config/
│   └── swagger.ts          # OpenAPI specification configuration
├── routes/
│   ├── auth-routes.ts      # Authentication endpoints with Swagger docs
│   ├── service-routes.ts   # Service management endpoints with Swagger docs
│   ├── health-routes.ts    # Health check endpoints with Swagger docs
│   └── index.ts           # Route exports
├── public/
│   └── index.html         # Custom API documentation page
└── server.ts              # Server setup with documentation routes
```

## Endpoints

### Documentation Endpoints

- **`/docs`** - Main API documentation page (redirects to `/index.html`)
- **`/swagger.json`** - OpenAPI specification in JSON format
- **`/index.html`** - Static HTML documentation page

### API Endpoints

All endpoints are documented with:
- Request/response schemas
- Example requests and responses
- Status codes and error handling
- Authentication requirements

#### Authentication (`/auth`)
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout (requires auth)
- `POST /auth/refresh` - Token refresh (requires auth)

#### Services (`/services`)
- `GET /services` - List all services (with pagination)
- `GET /services/:id` - Get service details
- `POST /services` - Create new service (requires auth)
- `PUT /services/:id` - Update service (requires auth)
- `DELETE /services/:id` - Delete service (requires auth)

#### Health Check (`/health`)
- `GET /health` - System health status
- `GET /health/version` - API version information

## Features

### OpenAPI Specification

The API includes a complete OpenAPI 3.0.3 specification with:

- **Comprehensive schemas** for all data models (User, Service, Error responses, etc.)
- **Security definitions** for JWT authentication
- **Detailed parameter descriptions** with examples
- **Response codes and examples** for all endpoints
- **Request/response body schemas** with validation rules

### Interactive Documentation

The custom HTML documentation provides:

- **Clean, responsive design** that works on all devices
- **Organized sections** for easy navigation
- **Code examples** for all endpoints
- **Copy-pasteable curl commands**
- **Visual indication** of authentication requirements
- **Quick start guide** and feature overview

### Route-Level Documentation

Each route file includes:

- **JSDoc comments** with Swagger annotations
- **Detailed descriptions** of endpoint functionality
- **Parameter and body specifications**
- **Response examples** for success and error cases
- **Authentication requirements** clearly marked

## Usage

### Starting the Server

```bash
npm run dev
```

The API documentation will be available at:
- Main documentation: http://localhost:3000/docs
- OpenAPI spec: http://localhost:3000/swagger.json
- API root: http://localhost:3000

### Adding New Endpoints

1. Add routes in the appropriate route file (`auth-routes.ts`, `service-routes.ts`, etc.)
2. Include Swagger JSDoc comments above each route handler
3. Update the main documentation page if needed
4. Ensure proper TypeScript types are defined

### Documentation Standards

- All endpoints must include JSDoc comments with Swagger annotations
- Examples should use realistic data that matches the business domain
- Error responses should include proper error codes and messages
- Authentication requirements should be clearly indicated
- Parameter descriptions should be comprehensive and include validation rules

## Implementation Status

✅ **Completed:**
- OpenAPI 3.0.3 specification setup
- Complete schema definitions for all data models
- Authentication and Services route documentation
- Health check endpoints
- Custom HTML documentation page
- Static file serving for documentation
- Responsive design for mobile devices

🚧 **Placeholder Implementation:**
- Route handlers return "Not Implemented" responses
- Actual business logic implementation pending
- Database integration pending
- JWT authentication middleware pending

## Next Steps

1. Implement actual route handlers with business logic
2. Add database integration for data persistence
3. Implement JWT authentication middleware
4. Add request validation using the defined schemas
5. Add integration tests for all documented endpoints
6. Consider adding Swagger UI as an alternative documentation interface

## Notes

- The documentation is designed to be comprehensive and user-friendly
- All responses follow a consistent JSON structure
- Error handling includes detailed validation messages
- The API supports both English and Chinese documentation
- The design follows modern API documentation best practices