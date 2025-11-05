#!/usr/bin/env node

/**
 * Simplified Vercel Deployment Script
 * Handles the core deployment process with proper error handling
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function execCommand(command, description) {
  log(`\n${colors.blue}${description}...${colors.reset}`)
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' })
    log(`${colors.green}✓ ${description} completed${colors.reset}`)
    return output
  } catch (error) {
    log(`${colors.red}✗ ${description} failed: ${error.message}${colors.reset}`)
    throw error
  }
}

async function main() {
  log(`${colors.bright}${colors.magenta}🚀 Deploying Email Template Generator to Vercel${colors.reset}`)
  
  try {
    // Check if we're in the right directory
    if (!fs.existsSync('package.json')) {
      throw new Error('package.json not found. Please run this script from the project root.')
    }

    // Check if Vercel CLI is available
    try {
      execSync('vercel --version', { encoding: 'utf8' })
      log(`${colors.green}✓ Vercel CLI is available${colors.reset}`)
    } catch (error) {
      throw new Error('Vercel CLI not found. Please install it with: npm install -g vercel')
    }

    // Build the application
    execCommand('npm run build', 'Building application')

    // Check if user is logged in to Vercel
    try {
      execSync('vercel whoami', { encoding: 'utf8' })
      log(`${colors.green}✓ Logged in to Vercel${colors.reset}`)
    } catch (error) {
      log(`${colors.yellow}Please log in to Vercel...${colors.reset}`)
      execCommand('vercel login', 'Logging in to Vercel')
    }

    // Deploy to Vercel
    const isProduction = process.argv.includes('--prod')
    const deployCommand = isProduction ? 'vercel --prod' : 'vercel'
    const environment = isProduction ? 'production' : 'preview'
    
    log(`${colors.cyan}Deploying to ${environment} environment...${colors.reset}`)
    execCommand(deployCommand, `Deploying to ${environment}`)

    // Success message
    log(`${colors.bright}${colors.green}🎉 Deployment completed successfully!${colors.reset}`)
    log(`${colors.cyan}Your application is now live on Vercel.${colors.reset}`)
    
    // Show deployment info
    try {
      log(`${colors.blue}Getting deployment information...${colors.reset}`)
      execSync('vercel ls --limit=1', { encoding: 'utf8', stdio: 'inherit' })
    } catch (error) {
      log(`${colors.yellow}Could not retrieve deployment info${colors.reset}`)
    }

  } catch (error) {
    log(`${colors.red}Deployment failed: ${error.message}${colors.reset}`)
    log(`${colors.yellow}Please check the error above and try again.${colors.reset}`)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { main }