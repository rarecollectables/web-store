const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting deployment process...');

// Check if we're in the correct directory
if (!fs.existsSync('netlify.toml')) {
  throw new Error('Please run this script from the project root directory');
}

// 1. Run pre-deploy checks
console.log('\nRunning pre-deploy checks...');
execSync('npm run pre-deploy');

// 2. Build the project
console.log('\nBuilding project...');
execSync('npm run build');

// 3. Verify build output
const buildDir = path.join(__dirname, '../dist');
if (!fs.existsSync(buildDir)) {
  throw new Error('Build directory not found. Build failed.');
}

// 4. Add git changes
console.log('\nAdding changes to git...');
execSync('git add .');

// 5. Create commit
console.log('\nCreating git commit...');
const commitMessage = 'feat: update build and deployment';
execSync(`git commit -m "${commitMessage}"`);

// 6. Push to repository
console.log('\nPushing to repository...');
execSync('git push origin main');

console.log('\nDeployment process completed!');
console.log('The changes will now be picked up by Netlify.');
