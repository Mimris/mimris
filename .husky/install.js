const { execSync } = require('child_process');

try {
  execSync('npx husky install', { stdio: 'inherit' });
  console.log('Husky installed successfully!');
} catch (error) {
  console.error('Failed to install Husky:', error);
  process.exit(1);
}
