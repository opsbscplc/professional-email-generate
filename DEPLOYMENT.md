# Deployment Guide - Email Template Generator

This guide covers the deployment process for the Email Template Generator to Vercel with Supabase database integration.

## Prerequisites

- Node.js 18+ installed
- Vercel CLI installed (`npm install -g vercel`)
- Access to the deployment credentials (stored in `deployment-credentials.txt`)
- Supabase project configured

## Quick Deployment

### 1. Automated Deployment

Run the automated deployment script:

```bash
# Deploy to production
node scripts/deploy.js --prod

# Deploy to preview
node scripts/deploy.js

# Skip tests during deployment
node scripts/deploy.js --prod --skip-tests

# Skip environment variable setup (if already configured)
node scripts/deploy.js --prod --skip-env
```

### 2. Manual Deployment Steps

If you prefer manual deployment:

```bash
# 1. Build the application
npm run build

# 2. Login to Vercel
vercel login

# 3. Link the project
vercel link

# 4. Deploy
vercel --prod
```

## Environment Configuration

### Required Environment Variables

The following environment variables must be configured in Vercel:

#### Database Configuration
- `POSTGRES_URL` - Main database connection string
- `POSTGRES_PRISMA_URL` - Prisma-compatible connection string
- `POSTGRES_URL_NON_POOLING` - Direct connection without pooling
- `POSTGRES_USER` - Database username
- `POSTGRES_HOST` - Database host
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DATABASE` - Database name

#### Supabase Configuration
- `SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_JWT_SECRET` - JWT secret for Supabase

#### Application Configuration
- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_URL` - Your deployed application URL

### Setting Environment Variables

#### Via Vercel Dashboard
1. Go to your project in Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable for the Production environment

#### Via Vercel CLI
```bash
# Set individual variables
vercel env add POSTGRES_URL production
vercel env add SUPABASE_URL production
# ... repeat for all variables

# Pull environment variables to local
vercel env pull .env.local
```

## Database Setup

### Initialize Production Database

Run the database setup script to create required tables:

```bash
node scripts/setup-database.js
```

This script will:
- Create `sessions` table for session tracking
- Create `error_logs` table for error logging
- Create `analytics` table for usage analytics
- Set up proper indexes for performance
- Create cleanup functions for maintenance

### Database Schema

#### Sessions Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  data JSONB DEFAULT '{}'::jsonb
);
```

#### Error Logs Table
```sql
CREATE TABLE error_logs (
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
```

#### Analytics Table
```sql
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255),
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Health Monitoring

### Health Check Script

Run health checks to verify deployment:

```bash
# Check health of deployed application
node scripts/health-check.js https://your-app.vercel.app

# Check health with default URL
node scripts/health-check.js
```

The health check validates:
- Website endpoints (/, /template-enhancer, /trainer, /api/health)
- Database connectivity and table existence
- Supabase API accessibility

### Health Check Endpoints

The application provides built-in health check endpoints:

- `GET /api/health` - Basic health status
- `GET /health` - Redirects to /api/health

### Monitoring Setup

Consider setting up monitoring with:
- Vercel Analytics (built-in)
- Uptime monitoring (UptimeRobot, Pingdom)
- Error tracking (Sentry integration available)
- Performance monitoring (Web Vitals tracking included)

## Security Configuration

### Security Headers

The application includes security headers configured in `vercel.json`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### CORS Configuration

API endpoints are configured with appropriate CORS headers for the production domain.

### HTTPS Enforcement

All traffic is automatically redirected to HTTPS by Vercel.

## Performance Optimization

### Build Optimizations

- Code splitting enabled
- Image optimization configured
- Tailwind CSS purging for production
- Bundle analysis available (`npm run build:analyze`)

### Caching Strategy

- API responses cached where appropriate
- Static assets cached by Vercel CDN
- Database connection pooling via Supabase

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build locally
npm run build

# Check for TypeScript errors
npm run lint
```

#### Environment Variable Issues
```bash
# Verify environment variables
vercel env ls

# Pull latest environment variables
vercel env pull .env.local
```

#### Database Connection Issues
```bash
# Test database connection
node scripts/health-check.js

# Check database setup
node scripts/setup-database.js
```

### Logs and Debugging

```bash
# View deployment logs
vercel logs

# View function logs
vercel logs --follow

# Inspect deployment
vercel inspect
```

## Rollback Procedures

### Quick Rollback

```bash
# List recent deployments
vercel ls

# Promote a previous deployment
vercel promote [deployment-url]
```

### Manual Rollback

1. Go to Vercel dashboard
2. Navigate to your project
3. Go to Deployments tab
4. Find the stable deployment
5. Click "Promote to Production"

## Maintenance

### Regular Tasks

1. **Database Cleanup**: Run cleanup function for expired sessions
2. **Log Monitoring**: Check error logs regularly
3. **Performance Monitoring**: Review Web Vitals and response times
4. **Security Updates**: Keep dependencies updated
5. **Backup Verification**: Ensure database backups are working

### Scheduled Maintenance

Consider setting up:
- Weekly dependency updates
- Monthly security audits
- Quarterly performance reviews

## Support and Monitoring

### Key Metrics to Monitor

- Response times for all endpoints
- Error rates and types
- Database connection health
- User session analytics
- Core Web Vitals scores

### Alerting Setup

Set up alerts for:
- High error rates (>5%)
- Slow response times (>2s)
- Database connection failures
- High memory/CPU usage

## Contact and Support

For deployment issues:
1. Check this documentation
2. Run health checks
3. Review Vercel logs
4. Check database connectivity
5. Verify environment variables

---

**Last Updated**: January 2025
**Version**: 1.0.0