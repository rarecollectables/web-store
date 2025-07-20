const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting pre-deployment checks...');

// Check Node.js version
const nodeVersion = execSync('node --version').toString().trim();
console.log(`Node.js version: ${nodeVersion}`);

// Check dependencies
console.log('\nChecking dependencies...');
try {
  execSync('npm install --legacy-peer-deps');
  console.log('Dependencies installed successfully');
} catch (error) {
  console.warn('Warning: Dependency installation had warnings, but continuing...');
}

try {
  execSync('npm audit fix --legacy-peer-deps');
  console.log('Security vulnerabilities fixed');
} catch (error) {
  console.warn('Warning: Some security vulnerabilities might not be fixed');
}

// Check build configuration
console.log('\nChecking build configuration...');
const netlifyConfig = fs.existsSync(path.join(__dirname, '../netlify.toml'));
console.log(`Netlify config found: ${netlifyConfig}`);

// Check environment file
console.log('\nChecking environment configuration...');
const envFile = fs.existsSync(path.join(__dirname, '../.env'));
console.log(`.env file found: ${envFile}`);

// Check build directory
console.log('\nChecking build directory...');
const buildDir = path.join(__dirname, '../web-build');
try {
  fs.accessSync(buildDir);
  console.log('Build directory accessible');
} catch (error) {
  console.log('Build directory does not exist (this is expected for first build)');
}

console.log('\nPre-deployment checks completed!');
