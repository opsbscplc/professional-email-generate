# Vercel Deployment Checklist

## Pre-Deployment Steps

### 1. Verify Files Are Ready
```bash
git status
```

Expected to see:
- `.npmrc` (new)
- `.vercelignore` (new)
- `vercel.json` (modified)
- `.gitignore` (modified)
- `VERCEL_DEPLOYMENT_FIX.md` (new)

### 2. Stage and Commit Changes
```bash
git add .npmrc .vercelignore vercel.json .gitignore VERCEL_DEPLOYMENT_FIX.md DEPLOYMENT_CHECKLIST.md
git commit -m "Fix Vercel deployment npm installation errors

- Add .npmrc with network retry and timeout configuration
- Create .vercelignore to exclude cached files
- Enhance vercel.json with npm resilience settings
- Configure retry logic for network failures
- Limit concurrent connections to prevent socket exhaustion"
```

### 3. Clear Vercel Build Cache (CRITICAL)

**Method 1: Vercel Dashboard (Recommended)**
1. Visit: https://vercel.com/dashboard
2. Select project: `professional-email-generate`
3. Go to **Settings** → **Build & Development Settings**
4. Find **Build Cache** section
5. Click **Clear Build Cache**
6. Confirm action

**Method 2: Force Deploy with CLI**
```bash
vercel --force
```

### 4. Push to GitHub
```bash
git push origin main
```

### 5. Monitor Deployment
```bash
# Watch logs in real-time
vercel logs --follow

# Or check Vercel dashboard
# https://vercel.com/[your-username]/professional-email-generate/deployments
```

## Success Indicators

### During Deployment
Look for these in logs:
- ✅ "Running npm ci --prefer-offline=false --no-audit --loglevel=error"
- ✅ "Installing dependencies..."
- ✅ "Dependencies installed successfully"
- ✅ NO "ECONNRESET" errors
- ✅ NO "TAR_ENTRY_ERROR" messages

### After Deployment
- ✅ Build status: "Ready"
- ✅ No error messages in deployment logs
- ✅ Application accessible at production URL
- ✅ All features working correctly

## If Deployment Fails

### 1. Check Build Logs
```bash
vercel logs [deployment-url]
```

### 2. Verify Cache Was Cleared
- In Vercel dashboard, deployment should show "Build Cache: disabled" or "Clean build"

### 3. Try Manual Deploy
```bash
vercel --prod --force
```

### 4. Check npm Registry
```bash
curl -I https://registry.npmjs.org/
# Should return: HTTP/2 200
```

## Rollback Plan

If deployment continues to fail:
```bash
# Revert changes
git revert HEAD
git push origin main
```

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://professional-email-generate.vercel.app/health
# Should return: 200 OK
```

### 2. Test Core Features
- [ ] Homepage loads
- [ ] Email generation works
- [ ] API endpoints respond
- [ ] Export features functional (PDF, PPT, JSON)

### 3. Monitor Performance
- Check Vercel Analytics
- Review error rates
- Verify no increased latency

## Notes

- Cache clearing is **MANDATORY** - don't skip this step
- First deployment after fix may take 3-5 minutes (longer than usual)
- Subsequent deployments will be faster
- Configuration changes only affect build time, not runtime performance

---

**Last Updated**: 2025-11-07
**Status**: Ready for deployment
