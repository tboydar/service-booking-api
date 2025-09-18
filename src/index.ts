import { createApp } from './server';
import { config } from './config/environment';

const startServer = async (): Promise<void> => {
  try {
    const app = createApp();
    
    const server = app.listen(config.PORT, () => {
      console.log('🎯 Service Booking API - 服務預約管理系統');
      console.log(`🚀 Server running on http://localhost:${config.PORT}`);
      console.log(`📚 API Documentation: http://localhost:${config.PORT}/api-docs`);
      console.log(`🔗 OpenAPI Spec: http://localhost:${config.PORT}/swagger.json`);
      console.log(`🏥 Health Check: http://localhost:${config.PORT}/health`);
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
      console.log('✅ Server started successfully');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Received SIGTERM signal, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 Received SIGINT signal, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start server if this file is run directly
if (require.main === module) {
  void startServer();
}