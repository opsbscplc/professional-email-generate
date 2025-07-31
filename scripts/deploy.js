#!/usr/bin/env node

/**
 * Deployment Script for Email Template Generator
 * Handles Vercel deployment with proper environment configuration
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
    process.exit(1)
  }
}

function checkPrerequisites() {
  log(`${colors.cyan}Checking deployment prerequisites...${colors.reset}`)
  
  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { encoding: 'utf8' })
    log(`${colors.green}✓ Vercel CLI is installed${colors.reset}`)
  } catch (error) {
    log(`${colors.red}✗ Vercel CLI not found. Please install it with: npm install -g vercel${colors.reset}`)
    process.exit(1)
  }

  // Check if credentials file exists
  if (!fs.existsSync('deployment-credentials.txt')) {
    log(`${colors.red}✗ deployment-credentials.txt not found${colors.reset}`)
    process.exit(1)
  }
  log(`${colors.green}✓ Deployment credentials found${colors.reset}`)

  // Check if build passes
  execCommand('npm run build', 'Building application')
  
  // Check if tests pass (optional, can be skipped with --skip-tests)
  if (!process.argv.includes('--skip-tests')) {
    execCommand('npm run test:unit', 'Running unit tests')
  }
}

function setupVercelProject() {
  log(`${colors.cyan}Setting up Vercel project...${colors.reset}`)
  
  // Login to Vercel (if not already logged in)
  try {
    execSync('vercel whoami', { encoding: 'utf8' })
    log(`${colors.green}✓ Already logged in to Vercel${colors.reset}`)
  } catch (error) {
    log(`${colors.yellow}Logging in to Vercel...${colors.reset}`)
    execCommand('vercel login', 'Vercel login')
  }

  // Link project (if not already linked)
  if (!fs.existsSync('.vercel')) {
    execCommand('vercel link --yes', 'Linking Vercel project')
  } else {
    log(`${colors.green}✓ Project already linked to Vercel${colors.reset}`)
  }
}

function configureEnvironmentVariables() {
  log(`${colors.cyan}Configuring environment variables...${colors.reset}`)
  
  const credentialsPath = path.join(__dirname, '..', 'deployment-credentials.txt')
  const credentials = fs.readFileSync(credentialsPath, 'utf8')
  
  // Parse environment variables from credentials file
  const envVars = {}
  credentials.split('\n').forEach(line => {
    if (line.startsWith('#') || !line.includes('=')) return
    const [key, ...valueParts] = line.split('=')
    const value = valueParts.join('=').replace(/"/g, '')
    if (key && value) {
      envVars[key] = value
    }
  })

  // Set environment variables in Vercel
  const envVarsToSet = [
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL', 
    'POSTGRES_URL_NON_POOLING',
    'POSTGRES_USER',
    'POSTGRES_HOST',
    'POSTGRES_PASSWORD',
    'POSTGRES_DATABASE',
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET'
  ]

  envVarsToSet.forEach(key => {
    if (envVars[key]) {
      try {
        execSync(`vercel env add ${key} production`, { 
          input: envVars[key], 
          encoding: 'utf8',
          stdio: ['pipe', 'inherit', 'inherit']
        })
        log(`${colors.green}✓ Set ${key}${colors.reset}`)
      } catch (error) {
        // Variable might already exist, try to update
        log(`${colors.yellow}Variable ${key} might already exist${colors.reset}`)
      }
    }
  })
}

function deployToVercel() {
  const isProduction = process.argv.includes('--prod')
  const command = isProduction ? 'vercel --prod' : 'vercel'
  const environment = isProduction ? 'production' : 'preview'
  
  execCommand(command, `Deploying to ${environment}`)
}

function runPostDeploymentTests() {
  log(`${colors.cyan}Running post-deployment validation...${colors.reset}`)
  
  // Get deployment URL
  try {
    const deploymentInfo = execSync('vercel ls --limit=1', { encoding: 'utf8' })
    log(`${colors.green}✓ Deployment completed successfully${colors.reset}`)
    log(`${colors.blue}Deployment info:${colors.reset}`)
    console.log(deploymentInfo)
  } catch (error) {
    log(`${colors.yellow}Could not retrieve deployment info${colors.reset}`)
  }
}

function main() {
  log(`${colors.bright}${colors.magenta}🚀 Email Template Generator Deployment${colors.reset}`)
  log(`${colors.cyan}Starting deployment process...${colors.reset}`)

  try {
    checkPrerequisites()
    setupVercelProject()
    
    if (!process.argv.includes('--skip-env')) {
      configureEnvironmentVariables()
    }
    
    deployToVercel()
    runPostDeploymentTests()
    
    log(`${colors.bright}${colors.green}🎉 Deployment completed successfully!${colors.reset}`)
    log(`${colors.cyan}Your application should be available at your Vercel URL${colors.reset}`)
    
  } catch (error) {
    log(`${colors.red}Deployment failed: ${error.message}${colors.reset}`)
    process.exit(1)
  }
}

// Run the deployment
if (require.main === module) {
  main()
}

module.exports = { main }