#!/usr/bin/env node

/**
 * Validation Script for Vercel Deployment Fix
 *
 * This script validates that all deployment fix files are correctly configured
 * and ready for deployment to Vercel.
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath, fileName) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    log(`✓ ${fileName} exists`, 'green');
    return true;
  } else {
    log(`✗ ${fileName} not found at: ${fullPath}`, 'red');
    return false;
  }
}

function validateJSON(filePath, fileName) {
  try {
    const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
    JSON.parse(content);
    log(`✓ ${fileName} is valid JSON`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${fileName} has JSON syntax errors: ${error.message}`, 'red');
    return false;
  }
}

function checkNpmrcContent() {
  try {
    const content = fs.readFileSync(path.join(__dirname, '.npmrc'), 'utf8');
    const requiredSettings = [
      'fetch-retries',
      'fetch-retry-mintimeout',
      'fetch-timeout',
      'maxsockets',
      'network-concurrency'
    ];

    let allPresent = true;
    requiredSettings.forEach(setting => {
      if (content.includes(setting)) {
        log(`  ✓ ${setting} configured`, 'green');
      } else {
        log(`  ✗ ${setting} missing`, 'red');
        allPresent = false;
      }
    });

    return allPresent;
  } catch (error) {
    log(`✗ Error reading .npmrc: ${error.message}`, 'red');
    return false;
  }
}

function checkVercelJsonConfig() {
  try {
    const content = fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8');
    const config = JSON.parse(content);

    const checks = [
      { key: 'installCommand', expected: 'npm ci', message: 'Install command configured' },
      { key: 'env.NPM_CONFIG_FETCH_RETRIES', expected: '5', message: 'Retry configuration in env' },
      { key: 'build.env.NPM_CONFIG_FETCH_RETRIES', expected: '5', message: 'Retry configuration in build.env' }
    ];

    let allPassed = true;
    checks.forEach(check => {
      const keys = check.key.split('.');
      let value = config;
      for (const key of keys) {
        value = value?.[key];
      }

      if (value && (check.expected === undefined || value.includes(check.expected))) {
        log(`  ✓ ${check.message}`, 'green');
      } else {
        log(`  ✗ ${check.message} - not found or incorrect`, 'red');
        allPassed = false;
      }
    });

    return allPassed;
  } catch (error) {
    log(`✗ Error checking vercel.json: ${error.message}`, 'red');
    return false;
  }
}

function checkPackageLockIntegrity() {
  try {
    const content = fs.readFileSync(path.join(__dirname, 'package-lock.json'), 'utf8');
    const lockfile = JSON.parse(content);

    if (lockfile.lockfileVersion && lockfile.packages) {
      log(`✓ package-lock.json structure is valid (version ${lockfile.lockfileVersion})`, 'green');
      return true;
    } else {
      log(`✗ package-lock.json structure is invalid`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ package-lock.json validation failed: ${error.message}`, 'red');
    return false;
  }
}

// Main validation
log('\n=== Vercel Deployment Fix Validation ===\n', 'blue');

let allChecksPass = true;

// Check file existence
log('1. Checking required files...', 'yellow');
allChecksPass &= checkFileExists('.npmrc', '.npmrc');
allChecksPass &= checkFileExists('.vercelignore', '.vercelignore');
allChecksPass &= checkFileExists('vercel.json', 'vercel.json');
allChecksPass &= checkFileExists('package-lock.json', 'package-lock.json');

// Validate JSON files
log('\n2. Validating JSON syntax...', 'yellow');
allChecksPass &= validateJSON('vercel.json', 'vercel.json');
allChecksPass &= validateJSON('package-lock.json', 'package-lock.json');

// Check .npmrc content
log('\n3. Validating .npmrc configuration...', 'yellow');
allChecksPass &= checkNpmrcContent();

// Check vercel.json configuration
log('\n4. Validating vercel.json configuration...', 'yellow');
allChecksPass &= checkVercelJsonConfig();

// Check package-lock.json integrity
log('\n5. Checking package-lock.json integrity...', 'yellow');
allChecksPass &= checkPackageLockIntegrity();

// Final result
log('\n=== Validation Summary ===\n', 'blue');
if (allChecksPass) {
  log('✓ All validation checks passed!', 'green');
  log('✓ Ready for deployment to Vercel', 'green');
  log('\nNext steps:', 'yellow');
  log('1. Clear Vercel build cache in dashboard', 'reset');
  log('2. Commit changes: git add . && git commit -m "Fix deployment"', 'reset');
  log('3. Push to GitHub: git push origin main', 'reset');
  log('4. Monitor deployment in Vercel dashboard\n', 'reset');
  process.exit(0);
} else {
  log('✗ Some validation checks failed', 'red');
  log('✗ Please fix the issues above before deploying\n', 'red');
  process.exit(1);
}
