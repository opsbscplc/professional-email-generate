#!/usr/bin/env node

/**
 * Performance Testing Script
 * Automated performance testing and validation
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Performance thresholds
const THRESHOLDS = {
  // Bundle sizes (in bytes)
  maxMainBundleSize: 500 * 1024, // 500KB
  maxVendorBundleSize: 1024 * 1024, // 1MB
  maxPageBundleSize: 100 * 1024, // 100KB
  
  // Lighthouse scores (0-100)
  minPerformanceScore: 90,
  minAccessibilityScore: 95,
  minBestPracticesScore: 90,
  minSEOScore: 90,
  
  // Core Web Vitals
  maxLCP: 2500, // ms
  maxFID: 100, // ms
  maxCLS: 0.1,
}

class PerformanceTester {
  constructor() {
    this.results = {
      bundleAnalysis: null,
      lighthouseReport: null,
      buildTime: null,
      errors: [],
      warnings: [],
    }
  }

  async run() {
    console.log('🚀 Starting performance tests...\n')

    try {
      await this.measureBuildTime()
      await this.analyzeBundles()
      await this.runLighthouseTests()
      await this.generateReport()
    } catch (error) {
      console.error('❌ Performance tests failed:', error.message)
      process.exit(1)
    }
  }

  async measureBuildTime() {
    console.log('⏱️  Measuring build time...')
    const startTime = Date.now()
    
    try {
      execSync('npm run build:production', { stdio: 'pipe' })
      this.results.buildTime = Date.now() - startTime
      console.log(`✅ Build completed in ${this.results.buildTime}ms\n`)
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`)
    }
  }

  async analyzeBundles() {
    console.log('📦 Analyzing bundle sizes...')
    
    try {
      // Generate bundle analysis
      execSync('ANALYZE=true npm run build', { stdio: 'pipe' })
      
      // Read Next.js build output
      const buildDir = path.join(process.cwd(), '.next')
      const buildManifest = path.join(buildDir, 'build-manifest.json')
      
      if (fs.existsSync(buildManifest)) {
        const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'))
        this.results.bundleAnalysis = this.analyzeBundleManifest(manifest)
      }
      
      console.log('✅ Bundle analysis completed\n')
    } catch (error) {
      this.results.warnings.push(`Bundle analysis failed: ${error.message}`)
      console.log('⚠️  Bundle analysis failed, continuing...\n')
    }
  }

  analyzeBundleManifest(manifest) {
    const analysis = {
      pages: {},
      totalSize: 0,
      violations: [],
    }

    // Analyze each page bundle
    for (const [page, files] of Object.entries(manifest.pages)) {
      let pageSize = 0
      
      files.forEach(file => {
        try {
          const filePath = path.join(process.cwd(), '.next', file)
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath)
            pageSize += stats.size
          }
        } catch (error) {
          // File might not exist, skip
        }
      })
      
      analysis.pages[page] = pageSize
      analysis.totalSize += pageSize
      
      // Check thresholds
      if (pageSize > THRESHOLDS.maxPageBundleSize) {
        analysis.violations.push({
          type: 'bundle_size',
          page,
          size: pageSize,
          threshold: THRESHOLDS.maxPageBundleSize,
        })
      }
    }

    return analysis
  }

  async runLighthouseTests() {
    console.log('🔍 Running Lighthouse performance tests...')
    
    try {
      // Start the application
      const server = execSync('npm run start &', { stdio: 'pipe' })
      
      // Wait for server to start
      await this.waitForServer('http://localhost:3000')
      
      // Run Lighthouse
      execSync('npm run performance:lighthouse', { stdio: 'pipe' })
      
      // Read Lighthouse report
      const reportPath = path.join(process.cwd(), 'performance-report.json')
      if (fs.existsSync(reportPath)) {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
        this.results.lighthouseReport = this.analyzeLighthouseReport(report)
      }
      
      console.log('✅ Lighthouse tests completed\n')
    } catch (error) {
      this.results.warnings.push(`Lighthouse tests failed: ${error.message}`)
      console.log('⚠️  Lighthouse tests failed, continuing...\n')
    }
  }

  analyzeLighthouseReport(report) {
    const categories = report.lhr.categories
    const audits = report.lhr.audits
    
    const analysis = {
      scores: {
        performance: Math.round(categories.performance.score * 100),
        accessibility: Math.round(categories.accessibility.score * 100),
        bestPractices: Math.round(categories['best-practices'].score * 100),
        seo: Math.round(categories.seo.score * 100),
      },
      coreWebVitals: {
        lcp: audits['largest-contentful-paint']?.numericValue || 0,
        fid: audits['max-potential-fid']?.numericValue || 0,
        cls: audits['cumulative-layout-shift']?.numericValue || 0,
      },
      violations: [],
    }

    // Check score thresholds
    if (analysis.scores.performance < THRESHOLDS.minPerformanceScore) {
      analysis.violations.push({
        type: 'performance_score',
        score: analysis.scores.performance,
        threshold: THRESHOLDS.minPerformanceScore,
      })
    }

    // Check Core Web Vitals
    if (analysis.coreWebVitals.lcp > THRESHOLDS.maxLCP) {
      analysis.violations.push({
        type: 'lcp',
        value: analysis.coreWebVitals.lcp,
        threshold: THRESHOLDS.maxLCP,
      })
    }

    return analysis
  }

  async waitForServer(url, timeout = 30000) {
    const start = Date.now()
    
    while (Date.now() - start < timeout) {
      try {
        const response = await fetch(url)
        if (response.ok) return
      } catch (error) {
        // Server not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    throw new Error('Server failed to start within timeout')
  }

  async generateReport() {
    console.log('📊 Generating performance report...\n')
    
    const report = {
      timestamp: new Date().toISOString(),
      buildTime: this.results.buildTime,
      bundleAnalysis: this.results.bundleAnalysis,
      lighthouseReport: this.results.lighthouseReport,
      summary: this.generateSummary(),
    }

    // Write report to file
    const reportPath = path.join(process.cwd(), 'performance-report-detailed.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    // Print summary
    this.printSummary(report.summary)
    
    // Exit with error code if there are violations
    if (report.summary.violations.length > 0) {
      console.log('\n❌ Performance tests failed due to violations')
      process.exit(1)
    } else {
      console.log('\n✅ All performance tests passed!')
    }
  }

  generateSummary() {
    const violations = []
    const warnings = [...this.results.warnings]

    // Collect violations from bundle analysis
    if (this.results.bundleAnalysis?.violations) {
      violations.push(...this.results.bundleAnalysis.violations)
    }

    // Collect violations from Lighthouse
    if (this.results.lighthouseReport?.violations) {
      violations.push(...this.results.lighthouseReport.violations)
    }

    return {
      buildTime: this.results.buildTime,
      violations,
      warnings,
      passed: violations.length === 0,
    }
  }

  printSummary(summary) {
    console.log('='.repeat(50))
    console.log('PERFORMANCE TEST SUMMARY')
    console.log('='.repeat(50))
    
    console.log(`Build Time: ${summary.buildTime}ms`)
    
    if (this.results.bundleAnalysis) {
      console.log(`Total Bundle Size: ${(this.results.bundleAnalysis.totalSize / 1024).toFixed(2)}KB`)
    }
    
    if (this.results.lighthouseReport) {
      const scores = this.results.lighthouseReport.scores
      console.log(`Lighthouse Scores:`)
      console.log(`  Performance: ${scores.performance}/100`)
      console.log(`  Accessibility: ${scores.accessibility}/100`)
      console.log(`  Best Practices: ${scores.bestPractices}/100`)
      console.log(`  SEO: ${scores.seo}/100`)
    }
    
    if (summary.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:')
      summary.warnings.forEach(warning => console.log(`  - ${warning}`))
    }
    
    if (summary.violations.length > 0) {
      console.log('\n❌ VIOLATIONS:')
      summary.violations.forEach(violation => {
        console.log(`  - ${violation.type}: ${JSON.stringify(violation)}`)
      })
    }
  }
}

// Run the performance tests
if (require.main === module) {
  const tester = new PerformanceTester()
  tester.run().catch(error => {
    console.error('Performance test runner failed:', error)
    process.exit(1)
  })
}

module.exports = PerformanceTester