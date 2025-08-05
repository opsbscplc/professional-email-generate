#!/usr/bin/env node

/**
 * Script to set up environment variables in Vercel
 */

const { execSync } = require('child_process')

const envVars = [
  {
    name: 'POSTGRES_PRISMA_URL',
    value: 'postgres://postgres.ruhoqvycrkxrdkwgersi:RHOHJyQkXCA94olV@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true'
  },
  {
    name: 'POSTGRES_URL_NON_POOLING',
    value: 'postgres://postgres.ruhoqvycrkxrdkwgersi:RHOHJyQkXCA94olV@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require'
  },
  {
    name: 'POSTGRES_USER',
    value: 'postgres'
  },
  {
    name: 'POSTGRES_HOST',
    value: 'db.ruhoqvycrkxrdkwgersi.supabase.co'
  },
  {
    name: 'POSTGRES_PASSWORD',
    value: 'RHOHJyQkXCA94olV'
  },
  {
    name: 'POSTGRES_DATABASE',
    value: 'postgres'
  },
  {
    name: 'SUPABASE_URL',
    value: 'https://ruhoqvycrkxrdkwgersi.supabase.co'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    value: 'https://ruhoqvycrkxrdkwgersi.supabase.co'
  },
  {
    name: 'SUPABASE_ANON_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1aG9xdnljcmt4cmRrd2dlcnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NDY1MjEsImV4cCI6MjA2OTUyMjUyMX0.5VHjo5BSh1Viq0dbtSC9r1pkD0DBLSmo6uBZSWwrRMM'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1aG9xdnljcmt4cmRrd2dlcnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NDY1MjEsImV4cCI6MjA2OTUyMjUyMX0.5VHjo5BSh1Viq0dbtSC9r1pkD0DBLSmo6uBZSWwrRMM'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1aG9xdnljcmt4cmRrd2dlcnNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk0NjUyMSwiZXhwIjoyMDY5NTIyNTIxfQ.XHLgn9TZCqiWyxZPzZN9545Lrr8But5dm6jq4MyT-sQ'
  },
  {
    name: 'SUPABASE_JWT_SECRET',
    value: 'z5pXX+ZQNiGr4SvO6BsFTypR9x2vW38hcwbi85STCA/MkbbrP7nINq/3O7C1l9lBBwcRgoOE+4ofZCtjbG+PXw=='
  },
  {
    name: 'NODE_ENV',
    value: 'production'
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    value: 'https://professional-email-generate.vercel.app'
  }
]

console.log('Setting up environment variables in Vercel...')

for (const envVar of envVars) {
  try {
    console.log(`Setting ${envVar.name}...`)
    execSync(`echo "${envVar.value}" | vercel env add ${envVar.name} production`, { 
      stdio: 'inherit',
      encoding: 'utf8'
    })
    console.log(`✓ ${envVar.name} set successfully`)
  } catch (error) {
    console.log(`⚠ ${envVar.name} might already exist or failed to set`)
  }
}

console.log('Environment variables setup complete!')