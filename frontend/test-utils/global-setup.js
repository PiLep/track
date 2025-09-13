// Global setup for Playwright tests
const { initializeTestDatabase } = require('./cleanup');

module.exports = async function globalSetup() {
  console.log('🚀 Setting up test environment...');

  try {
    // Initialize test database
    await initializeTestDatabase();

    // Start test database if not running
    const { spawn } = require('child_process');
    const path = require('path');

    console.log('🐳 Starting test database...');
    const dockerComposePath = path.join(__dirname, '../../docker-compose.yml');

    // Start only the test database
    const dockerProcess = spawn('docker-compose', [
      '--file', dockerComposePath,
      '--profile', 'test',
      'up',
      '-d',
      'postgres-test'
    ], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '../..')
    });

    await new Promise((resolve, reject) => {
      dockerProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Docker compose failed with code ${code}`));
        }
      });
      dockerProcess.on('error', reject);
    });

    // Wait for database to be ready
    console.log('⏳ Waiting for test database to be ready...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log('✅ Test environment setup complete');

  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    throw error;
  }
};