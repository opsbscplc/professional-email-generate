/**
 * Visual Regression Tests for UI Consistency
 * Tests to ensure UI components render consistently across changes
 */

import puppeteer, { Browser, Page } from 'puppeteer'
import { toMatchImageSnapshot } from 'jest-image-snapshot'

// Extend Jest matchers
expect.extend({ toMatchImageSnapshot })

describe('Visual Regression Tests', () => {
  let browser: Browser
  let page: Page

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  })

  afterAll(async () => {
    await browser.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 800 })
  })

  afterEach(async () => {
    await page.close()
  })

  describe('Page Screenshots', () => {
    it('should match home page visual snapshot', async () => {
      // Set up API key in localStorage
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('gemini-api-key', 'AIzaSyTestKey1234567890123456789012345')
      })

      await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' })
      
      // Wait for any animations to complete
      await page.waitForTimeout(1000)
      
      const screenshot = await page.screenshot({ fullPage: true })
      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: 'home-page',
        threshold: 0.2,
      })
    })

    it('should match template enhancer page visual snapshot', async () => {
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('gemini-api-key', 'AIzaSyTestKey1234567890123456789012345')
      })

      await page.goto('http://localhost:3000/template-enhancer', { waitUntil: 'networkidle0' })
      await page.waitForTimeout(1000)
      
      const screenshot = await page.screenshot({ fullPage: true })
      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: 'template-enhancer-page',
        threshold: 0.2,
      })
    })

    it('should match trainer page visual snapshot', async () => {
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('gemini-api-key', 'AIzaSyTestKey1234567890123456789012345')
      })

      await page.goto('http://localhost:3000/trainer', { waitUntil: 'networkidle0' })
      await page.waitForTimeout(1000)
      
      const screenshot = await page.screenshot({ fullPage: true })
      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: 'trainer-page',
        threshold: 0.2,
      })
    })

    it('should match API key setup modal visual snapshot', async () => {
      // Don't set API key to trigger modal
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' })
      await page.waitForTimeout(1000)
      
      const screenshot = await page.screenshot({ fullPage: true })
      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: 'api-key-modal',
        threshold: 0.2,
      })
    })
  })

  describe('Component Visual Tests', () => {
    it('should match glass button variants', async () => {
      await page.setContent(`
        <html>
          <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
              }
            </style>
          </head>
          <body>
            <div class="space-y-4">
              <button class="px-6 py-3 rounded-lg backdrop-blur-md bg-white/20 border border-white/30 text-white font-medium hover:bg-white/30 transition-all duration-200">
                Primary Button
              </button>
              <button class="px-6 py-3 rounded-lg backdrop-blur-md bg-white/10 border border-white/20 text-white/90 font-medium hover:bg-white/20 transition-all duration-200">
                Secondary Button
              </button>
              <button class="px-6 py-3 rounded-lg backdrop-blur-md border border-white/30 text-white font-medium hover:bg-white/10 transition-all duration-200">
                Outline Button
              </button>
              <button class="px-6 py-3 rounded-lg backdrop-blur-md text-white/80 font-medium hover:bg-white/10 transition-all duration-200">
                Ghost Button
              </button>
            </div>
          </body>
        </html>
      `)
      
      await page.waitForTimeout(500)
      
      const screenshot = await page.screenshot()
      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: 'glass-button-variants',
        threshold: 0.2,
      })
    })

    it('should match glass input states', async () => {
      await page.setContent(`
        <html>
          <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
              }
            </style>
          </head>
          <body>
            <div class="space-y-4 max-w-md">
              <div>
                <label class="block text-sm font-medium text-white mb-2">Normal Input</label>
                <input class="w-full px-4 py-3 rounded-lg backdrop-blur-md bg-white/10 border border-white/30 text-white placeholder-white/70" placeholder="Enter text" />
              </div>
              <div>
                <label class="block text-sm font-medium text-white mb-2">Focused Input</label>
                <input class="w-full px-4 py-3 rounded-lg backdrop-blur-md bg-white/20 border border-white/50 text-white placeholder-white/70 ring-2 ring-white/20" placeholder="Focused state" />
              </div>
              <div>
                <label class="block text-sm font-medium text-white mb-2">Error Input</label>
                <input class="w-full px-4 py-3 rounded-lg backdrop-blur-md bg-white/10 border border-red-400/50 text-white placeholder-white/70" placeholder="Error state" />
                <p class="text-sm text-red-400 mt-1">This field is required</p>
              </div>
            </div>
          </body>
        </html>
      `)
      
      await page.waitForTimeout(500)
      
      const screenshot = await page.screenshot()
      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: 'glass-input-states',
        threshold: 0.2,
      })
    })

    it('should match glass card variations', async () => {
      await page.setContent(`
        <html>
          <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
              }
            </style>
          </head>
          <body>
            <div class="grid grid-cols-2 gap-4 max-w-2xl">
              <div class="p-6 rounded-xl backdrop-blur-sm bg-white/5 border border-white/20 shadow-lg">
                <h3 class="text-white font-semibold mb-2">Low Opacity</h3>
                <p class="text-white/80 text-sm">backdrop-blur-sm bg-white/5</p>
              </div>
              <div class="p-6 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 shadow-lg">
                <h3 class="text-white font-semibold mb-2">Medium Opacity</h3>
                <p class="text-white/80 text-sm">backdrop-blur-md bg-white/10</p>
              </div>
              <div class="p-6 rounded-xl backdrop-blur-lg bg-white/20 border border-white/20 shadow-lg">
                <h3 class="text-white font-semibold mb-2">High Opacity</h3>
                <p class="text-white/80 text-sm">backdrop-blur-lg bg-white/20</p>
              </div>
              <div class="p-6 rounded-xl backdrop-blur-xl bg-white/10 border border-white/30 shadow-xl hover:bg-white/15 hover:border-white/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <h3 class="text-white font-semibold mb-2">Hover Effect</h3>
                <p class="text-white/80 text-sm">With hover animations</p>
              </div>
            </div>
          </body>
        </html>
      `)
      
      await page.waitForTimeout(500)
      
      const screenshot = await page.screenshot()
      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: 'glass-card-variations',
        threshold: 0.2,
      })
    })
  })

  describe('Responsive Visual Tests', () => {
    it('should match mobile viewport', async () => {
      await page.setViewport({ width: 375, height: 667 })
      
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('gemini-api-key', 'AIzaSyTestKey1234567890123456789012345')
      })

      await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' })
      await page.waitForTimeout(1000)
      
      const screenshot = await page.screenshot({ fullPage: true })
      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: 'mobile-home-page',
        threshold: 0.2,
      })
    })

    it('should match tablet viewport', async () => {
      await page.setViewport({ width: 768, height: 1024 })
      
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('gemini-api-key', 'AIzaSyTestKey1234567890123456789012345')
      })

      await page.goto('http://localhost:3000/template-enhancer', { waitUntil: 'networkidle0' })
      await page.waitForTimeout(1000)
      
      const screenshot = await page.screenshot({ fullPage: true })
      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: 'tablet-template-enhancer',
        threshold: 0.2,
      })
    })

    it('should match desktop viewport', async () => {
      await page.setViewport({ width: 1920, height: 1080 })
      
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('gemini-api-key', 'AIzaSyTestKey1234567890123456789012345')
      })

      await page.goto('http://localhost:3000/trainer', { waitUntil: 'networkidle0' })
      await page.waitForTimeout(1000)
      
      const screenshot = await page.screenshot({ fullPage: true })
      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: 'desktop-trainer',
        threshold: 0.2,
      })
    })
  })

  describe('Dark Mode Visual Tests', () => {
    it('should match dark mode appearance', async () => {
      await page.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: 'dark' }
      ])
      
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('gemini-api-key', 'AIzaSyTestKey1234567890123456789012345')
      })

      await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' })
      await page.waitForTimeout(1000)
      
      const screenshot = await page.screenshot({ fullPage: true })
      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: 'dark-mode-home',
        threshold: 0.2,
      })
    })
  })

  describe('Animation Visual Tests', () => {
    it('should match loading states', async () => {
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('gemini-api-key', 'AIzaSyTestKey1234567890123456789012345')
      })

      await page.goto('http://localhost:3000/template-enhancer', { waitUntil: 'networkidle0' })
      
      // Trigger loading state by clicking enhance button
      await page.click('button:has-text("Professional")')
      await page.fill('textarea[placeholder*="draft email"]', 'Test email content')
      
      // Mock slow API response to capture loading state
      await page.route('/api/gemini', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: 'Enhanced email' })
          })
        }, 2000)
      })
      
      await page.click('button:has-text("Enhance Email")')
      
      // Wait a bit for loading state to appear
      await page.waitForTimeout(500)
      
      const screenshot = await page.screenshot()
      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: 'loading-state',
        threshold: 0.2,
      })
    })
  })
})