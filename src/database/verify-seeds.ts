#!/usr/bin/env ts-node

/**
 * Verify seed data was inserted correctly
 */

import { User } from '../models/user';
import { AppointmentService } from '../models/appointment-service';
import { initializeDatabase } from './init';

async function verifySeeds(): Promise<void> {
  try {
    console.log('🔍 Verifying seed data...');

    // Initialize database connection
    await initializeDatabase();

    // Check users
    const users = await User.findAll();
    console.log(`📊 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email})`);
    });

    // Check services
    const services = await AppointmentService.findAll({
      order: [['order', 'ASC']],
    });
    console.log(`\n📊 Found ${services.length} services:`);
    services.forEach(service => {
      const status = service.isRemove
        ? '❌ Removed'
        : service.isPublic
          ? '✅ Public'
          : '🔒 Private';
      console.log(
        `  - ${service.name} (Order: ${service.order}, Price: $${(service.price / 100).toFixed(2)}) ${status}`
      );
    });

    // Check public services only
    const publicServices = await AppointmentService.getPublicServices();
    console.log(`\n🌐 Public services (${publicServices.length}):`);
    publicServices.forEach(service => {
      console.log(`  - ${service.name} (Order: ${service.order})`);
    });

    console.log('\n✅ Seed data verification completed successfully!');
  } catch (error) {
    console.error(
      '❌ Seed verification failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
}

if (require.main === module) {
  verifySeeds().catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}
