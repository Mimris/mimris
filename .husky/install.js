const { execSync } = require('child_process');

try {
  // Modern approach for Husky v6+
  execSync('npm install husky --save-dev', { stdio: 'inherit' });
  execSync('npx husky-init', { stdio: 'inherit' });
  console.log('Husky installed successfully!');
} catch (error) {
  console.error('Failed to install Husky:', error);
  process.exit(1);
}
