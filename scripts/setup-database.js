#!/usr/bin/env node

/**
 * Database Setup Script for Production
 * Sets up the required database tables and indexes for the email template generator
 */

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
    process.exit(1)
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

async function setupDatabase() {
  log('🗄️  Setting up production database...', colors.cyan)
  
  const credentials = loadCredentials()
  const connectionString = credentials.POSTGRES_URL_NON_POOLING || credentials.POSTGRES_URL

  if (!connectionString) {
    log('Database connection string not found in credentials', colors.red)
    process.exit(1)
  }

  const client = new Client({
    connectionString: connectionString,
    ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false
  })

  try {
    await client.connect()
    log('✓ Connected to database', colors.green)

    // Create sessions table for analytics and session tracking
    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(255) UNIQUE NOT NULL,
        user_agent TEXT,
        ip_address INET,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        data JSONB DEFAULT '{}'::jsonb
      );
    `

    await client.query(createSessionsTable)
    log('✓ Sessions table created/verified', colors.green)

    // Create error_logs table for error tracking
    const createErrorLogsTable = `
      CREATE TABLE IF NOT EXISTS error_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(255),
        error_type VARCHAR(100) NOT NULL,
        error_message TEXT NOT NULL,
        error_stack TEXT,
        user_agent TEXT,
        ip_address INET,
        url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb
      );
    `

    await client.query(createErrorLogsTable)
    log('✓ Error logs table created/verified', colors.green)

    // Create analytics table for usage tracking
    const createAnalyticsTable = `
      CREATE TABLE IF NOT EXISTS analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(255),
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB DEFAULT '{}'::jsonb,
        user_agent TEXT,
        ip_address INET,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    await client.query(createAnalyticsTable)
    log('✓ Analytics table created/verified', colors.green)

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);',
      'CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);',
      'CREATE INDEX IF NOT EXISTS idx_error_logs_session_id ON error_logs(session_id);',
      'CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);',
      'CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics(session_id);',
      'CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);',
      'CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);'
    ]

    for (const indexQuery of indexes) {
      await client.query(indexQuery)
    }
    log('✓ Database indexes created/verified', colors.green)

    // Create a function to clean up expired sessions
    const createCleanupFunction = `
      CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
      RETURNS INTEGER AS $$
      DECLARE
        deleted_count INTEGER;
      BEGIN
        DELETE FROM sessions WHERE expires_at < NOW();
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RETURN deleted_count;
      END;
      $$ LANGUAGE plpgsql;
    `

    await client.query(createCleanupFunction)
    log('✓ Cleanup function created/verified', colors.green)

    // Test database connectivity with a simple query
    const testQuery = 'SELECT NOW() as current_time, version() as db_version;'
    const result = await client.query(testQuery)
    log(`✓ Database test successful - ${result.rows[0].current_time}`, colors.green)

    log('🎉 Database setup completed successfully!', colors.bright + colors.green)

  } catch (error) {
    log(`Database setup failed: ${error.message}`, colors.red)
    console.error(error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Install pg dependency if not present
function checkDependencies() {
  try {
    require('pg')
  } catch (error) {
    log('Installing pg dependency...', colors.yellow)
    const { execSync } = require('child_process')
    execSync('npm install pg', { stdio: 'inherit' })
    log('✓ pg dependency installed', colors.green)
  }
}

async function main() {
  log('🚀 Database Setup for Email Template Generator', colors.bright + colors.cyan)
  
  checkDependencies()
  await setupDatabase()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { setupDatabase }