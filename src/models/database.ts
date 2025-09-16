import { sequelize } from '../config/database';
import User from './user';
import AppointmentService from './appointment-service';

/**
 * Database models registry
 */
export const models = {
  User,
  AppointmentService,
};

/**
 * Initialize all model associations
 */
export const initializeAssociations = (): void => {
  // Currently no associations between User and AppointmentService
  // This function is prepared for future associations if needed
  console.log('Model associations initialized');
};

/**
 * Sync all models with database
 */
export const syncDatabase = async (
  options: { force?: boolean; alter?: boolean } = {}
): Promise<void> => {
  try {
    await sequelize.sync(options);
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Database synchronization failed:', error);
    throw error;
  }
};

/**
 * Test database connection
 */
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

/**
 * Close database connection
 */
export const closeConnection = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log('Database connection closed successfully');
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
};

// Initialize associations
initializeAssociations();

export { sequelize };
export default models;
