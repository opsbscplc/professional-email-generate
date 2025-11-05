#!/usr/bin/env node

/**
 * Health Check Script for Production Deployment
 * Validates that all services are running correctly
 */

const https = require('https')
const { Client } = require('pg')
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
  cyan: '\x1b[36m',
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function loadCredentials() {
  const credentialsPath = path.join(__dirname, '..', 'deployment-credentials.txt')
  
  if (!fs.existsSync(credentialsPath)) {
    log('deployment-credentials.txt not found', colors.red)
    return null
  }

  const credentials = fs.readFileSync(credentialsPath, 'utf8')
  const envVars = {}
  
  credentials.split('\n').forEach(line => {
    if (line.startsWith('#') || !line.includes('=')) return
    const [key, ...valueParts] = line.split('=')
    const value = valueParts.join('=').replace(/"/g, '')
    if (key && value) {
      envVars[key] = value
    }
  })

  return envVars
}

function makeHttpsRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    
    const req = https.get(url, (res) => {
      const responseTime = Date.now() - startTime
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          responseTime: responseTime
        })
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    req.setTimeout(10000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
  })
}

async function checkWebsiteHealth(baseUrl) {
  log('🌐 Checking website health...', colors.cyan)
  
  const endpoints = [
    { path: '/', name: 'Home Page' },
    { path: '/template-enhancer', name: 'Template Enhancer' },
    { path: '/trainer', name: 'AI Trainer' },
    { path: '/api/health', name: 'Health API' }
  ]

  const results = []
  
  for (const endpoint of endpoints) {
    try {
      const url = `${baseUrl}${endpoint.path}`
      const response = await makeHttpsRequest(url)
      
      if (response.statusCode === 200) {
        log(`✓ ${endpoint.name} - OK (${response.responseTime}ms)`, colors.green)
        results.push({ endpoint: endpoint.name, status: 'OK', responseTime: response.responseTime })
      } else {
        log(`⚠ ${endpoint.name} - Status ${response.statusCode} (${response.responseTime}ms)`, colors.yellow)
        results.push({ endpoint: endpoint.name, status: `HTTP ${response.statusCode}`, responseTime: response.responseTime })
      }
    } catch (error) {
      log(`✗ ${endpoint.name} - Error: ${error.message}`, colors.red)
      results.push({ endpoint: endpoint.name, status: 'ERROR', error: error.message })
    }
  }
  
  return results
}

async function checkDatabaseHealth() {
  log('🗄️  Checking database health...', colors.cyan)
  
  const credentials = loadCredentials()
  if (!credentials) {
    log('✗ Cannot check database - credentials not found', colors.red)
    return { status: 'ERROR', error: 'Credentials not found' }
  }

  const connectionString = credentials.POSTGRES_URL_NON_POOLING || credentials.POSTGRES_URL
  
  if (!connectionString) {
    log('✗ Database connection string not found', colors.red)
    return { status: 'ERROR', error: 'Connection string not found' }
  }

  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    const startTime = Date.now()
    await client.connect()
    
    // Test basic connectivity
    const result = await client.query('SELECT NOW() as current_time, version() as version')
    const responseTime = Date.now() - startTime
    
    // Check if our tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('sessions', 'error_logs', 'analytics')
    `
    const tablesResult = await client.query(tablesQuery)
    const existingTables = tablesResult.rows.map(row => row.table_name)
    
    log(`✓ Database connection OK (${responseTime}ms)`, colors.green)
    log(`✓ Database version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`, colors.green)
    log(`✓ Tables found: ${existingTables.join(', ')}`, colors.green)
    
    return {
      status: 'OK',
      responseTime: responseTime,
      version: result.rows[0].version,
      tables: existingTables
    }
    
  } catch (error) {
    log(`✗ Database connection failed: ${error.message}`, colors.red)
    return { status: 'ERROR', error: error.message }
  } finally {
    await client.end()
  }
}

async function checkSupabaseHealth() {
  log('🔗 Checking Supabase health...', colors.cyan)
  
  const credentials = loadCredentials()
  if (!credentials || !credentials.SUPABASE_URL) {
    log('✗ Supabase URL not found in credentials', colors.red)
    return { status: 'ERROR', error: 'Supabase URL not found' }
  }

  try {
    const healthUrl = `${credentials.SUPABASE_URL}/rest/v1/`
    const response = await makeHttpsRequest(healthUrl)
    
    if (response.statusCode === 200 || response.statusCode === 401) {
      // 401 is expected without proper auth headers
      log(`✓ Supabase API reachable (${response.responseTime}ms)`, colors.green)
      return { status: 'OK', responseTime: response.responseTime }
    } else {
      log(`⚠ Supabase API returned status ${response.statusCode}`, colors.yellow)
      return { status: `HTTP ${response.statusCode}`, responseTime: response.responseTime }
    }
  } catch (error) {
    log(`✗ Supabase health check failed: ${error.message}`, colors.red)
    return { status: 'ERROR', error: error.message }
  }
}

function generateHealthReport(websiteResults, databaseResult, supabaseResult) {
  const report = {
    timestamp: new Date().toISOString(),
    overall_status: 'OK',
    checks: {
      website: websiteResults,
      database: databaseResult,
      supabase: supabaseResult
    }
  }

  // Determine overall status
  const hasErrors = websiteResults.some(r => r.status === 'ERROR') || 
                   databaseResult.status === 'ERROR' || 
                   supabaseResult.status === 'ERROR'
  
  if (hasErrors) {
    report.overall_status = 'ERROR'
  } else {
    const hasWarnings = websiteResults.some(r => r.status.startsWith('HTTP') && !r.status.includes('200')) ||
                       databaseResult.status !== 'OK' ||
                       supabaseResult.status !== 'OK'
    
    if (hasWarnings) {
      report.overall_status = 'WARNING'
    }
  }

  return report
}

async function main() {
  const baseUrl = process.argv[2] || 'https://bscplc-generator-text.vercel.app'
  
  log('🏥 Health Check for Email Template Generator', colors.bright + colors.cyan)
  log(`Checking deployment at: ${baseUrl}`, colors.blue)
  log('', colors.reset)

  try {
    // Run all health checks
    const [websiteResults, databaseResult, supabaseResult] = await Promise.all([
      checkWebsiteHealth(baseUrl),
      checkDatabaseHealth(),
      checkSupabaseHealth()
    ])

    // Generate report
    const report = generateHealthReport(websiteResults, databaseResult, supabaseResult)
    
    log('', colors.reset)
    log('📊 Health Check Summary:', colors.bright + colors.blue)
    log(`Overall Status: ${report.overall_status}`, 
         report.overall_status === 'OK' ? colors.green : 
         report.overall_status === 'WARNING' ? colors.yellow : colors.red)
    
    // Save report to file
    const reportPath = path.join(__dirname, '..', 'health-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    log(`Report saved to: ${reportPath}`, colors.blue)
    
    // Exit with appropriate code
    process.exit(report.overall_status === 'ERROR' ? 1 : 0)
    
  } catch (error) {
    log(`Health check failed: ${error.message}`, colors.red)
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { main, checkWebsiteHealth, checkDatabaseHealth, checkSupabaseHealth }