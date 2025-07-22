const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

const log = {
  success: (msg) => console.log(chalk.green(`✓ ${msg}`)),
  warning: (msg) => console.log(chalk.yellow(`⚠ ${msg}`)),
  error: (msg) => console.log(chalk.red(`✗ ${msg}`)),
  info: (msg) => console.log(chalk.blue(msg))
};

async function validateDeployment() {
  console.log('\nStarting deployment validation...\n');
  
  // 1. Environment Check
  log.info('Checking environment...');
  try {
    const nodeVersion = execSync('node --version').toString().trim();
    log.success(`Node.js version: ${nodeVersion}`);
  } catch (error) {
    log.error('Node.js not found');
    process.exit(1);
  }

  // 2. Package.json Validation
  log.info('\nValidating package.json...');
  const packageJson = require('../package.json');
  
  // Check for version ranges
  const problematicVersions = Object.entries(packageJson.dependencies)
    .filter(([_, version]) => version.startsWith('^') || version.startsWith('~'));
  
  if (problematicVersions.length > 0) {
    log.warning('Found version ranges that might cause deployment issues:');
    problematicVersions.forEach(([dep, version]) => {
      log.warning(`- ${dep}: ${version}`);
    });
  }

  // 3. Dependency Validation
  log.info('\nValidating dependencies...');
  try {
    // Try regular install
    execSync('npm install');
    log.success('Dependencies installed successfully with regular install');
  } catch (error) {
    log.info('Regular install failed, trying with --legacy-peer-deps...');
    
    try {
      execSync('npm install --legacy-peer-deps');
      log.success('Dependencies installed successfully with --legacy-peer-deps');
    } catch (legacyError) {
      log.error('Failed to install dependencies even with --legacy-peer-deps');
      process.exit(1);
    }
  }

  // 4. Build Validation
  log.info('\nValidating build process...');
  try {
    execSync('npm run build');
    log.success('Build successful');
    
    // Verify build output
    const buildDir = path.join(__dirname, '../dist');
    if (!fs.existsSync(buildDir)) {
      log.error('Build directory not found after build');
      process.exit(1);
    }
  } catch (error) {
    log.error('Build failed');
    process.exit(1);
  }

  // 5. Netlify Configuration Validation
  log.info('\nValidating Netlify configuration...');
  try {
    const netlifyConfig = fs.readFileSync('../netlify.toml', 'utf8');
    
    // Check for common issues
    const configIssues = [];
    
    // Check build command
    if (!netlifyConfig.includes('command = "npm install')) {
      configIssues.push('Build command should start with "npm install"');
    }

    // Check publish directory
    if (!netlifyConfig.includes('publish = "dist"')) {
      configIssues.push('Publish directory should be set to "dist"');
    }

    if (configIssues.length > 0) {
      log.warning('Found Netlify configuration issues:');
      configIssues.forEach(issue => log.warning(`- ${issue}`));
    }
  } catch (error) {
    log.error('Could not read netlify.toml');
    process.exit(1);
  }

  // 6. Environment Variables Check
  log.info('\nChecking environment variables...');
  const requiredEnvVars = [
    'API_URL',
    'SECURE_STORE_KEY_PREFIX',
    'IMAGE_QUALITY',
    'MAX_IMAGE_SIZE',
    'CACHE_TTL'
  ];

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingEnvVars.length > 0) {
    log.warning('Missing required environment variables:');
    missingEnvVars.forEach(varName => log.warning(`- ${varName}`));
  }

  // 7. Security Check
  log.info('\nRunning security checks...');
  try {
    execSync('npm audit');
    log.success('Security audit passed');
  } catch (error) {
    log.warning('Security vulnerabilities found. Please check npm audit output');
  }

  // 8. Performance Check
  log.info('\nRunning performance checks...');
  try {
    execSync('npm run build -- --report');
    log.success('Performance report generated');
  } catch (error) {
    log.warning('Performance report generation failed');
  }

  // Final summary
  console.log('\n\nDeployment validation summary:');
  if (configIssues.length > 0 || missingEnvVars.length > 0 || problematicVersions.length > 0) {
    log.warning('There are issues that need to be addressed before deployment');
  } else {
    log.success('All checks passed! Ready for deployment');
  }
}

// Run the validation
validateDeployment();
