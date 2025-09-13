// Global teardown for Playwright tests
const { cleanTestDatabase } = require('./cleanup');

module.exports = async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');

  try {
    // Clean test database
    await cleanTestDatabase();

    // Stop test database
    const { spawn } = require('child_process');
    const path = require('path');

    console.log('🐳 Stopping test database...');
    const dockerComposePath = path.join(__dirname, '../../docker-compose.yml');

    const dockerProcess = spawn('docker-compose', [
      '--file', dockerComposePath,
      '--profile', 'test',
      'down'
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

    console.log('✅ Test environment cleanup complete');

  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
};