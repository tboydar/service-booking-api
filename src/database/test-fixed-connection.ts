#!/usr/bin/env ts-node

async function testFixedConnection(): Promise<void> {
  console.log('Testing fixed connection...');

  try {
    const { databaseConnection } = await import('./connection');

    const status = await databaseConnection.testConnection();
    console.log('Connection status:', status);

    if (status.isConnected) {
      await databaseConnection.connect();
      console.log('✓ Connected successfully');
      await databaseConnection.disconnect();
      console.log('✓ Disconnected successfully');
    }
  } catch (error) {
    console.error('✗ Error:', error);
  }
}

testFixedConnection();
