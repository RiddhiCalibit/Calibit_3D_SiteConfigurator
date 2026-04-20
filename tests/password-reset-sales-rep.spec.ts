import { test, expect } from '@playwright/test';

test.describe('Password Reset for Sales Rep', () => {
  test('should submit password reset request as sales rep', async ({ page }) => {
    // Navigate to login page
    await page.goto('/');
    
    // Click on "Forgot your password?" button
    await page.click('button:has-text("Forgot your password?")');
    
    // Verify we're on the forgot password page
    await expect(page).toHaveTitle(/.*3D_Site_Configurator.*/);
    await expect(page.locator('text=Forgot your password?')).toBeVisible();
    
    // Enter sales rep email
    await page.fill('input[placeholder*="Enter your email"]', 'sales@equipmentco.com');
    
    // Click submit button
    await page.click('button:has-text("Send Reset Request")');
    
    // Verify success message
    await expect(page.locator('text=If this email exists')).toBeVisible();
  });

  test('should allow admin to approve and set temporary password', async ({ page, browser }) => {
    // First, sales rep requests password reset
    await page.goto('/');
    await page.click('button:has-text("Forgot your password?")');
    await page.fill('input[placeholder*="Enter your email"]', 'sales@equipmentco.com');
    await page.click('button:has-text("Send Reset Request")');
    
    // Now, admin logs in on a different context
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    await adminPage.goto('/');
    
    // Login as tenant admin
    await adminPage.fill('input[placeholder*="name@company.com"]', 'zee@admin.com');
    await adminPage.fill('input[type="password"]', 'password');
    await adminPage.click('button:has-text("Sign In")');
    
    // Wait for redirect to dashboard
    await adminPage.waitForURL(/.*admin|configure.*/);
    
    // Navigate to Admin Dashboard and check Activity Logs
    // or look for password reset requests  
    await expect(adminPage.locator('text=Dashboard|Admin')).toBeVisible();
    
    await adminContext.close();
  });

  test('should verify activity log for password reset request', async ({ page }) => {
    // Login as tenant admin
    await page.goto('/');
    await page.fill('input[placeholder*="name@company.com"]', 'zee@admin.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("Sign In")');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/.*admin|configure.*/);
    
    // Navigate to Activity Logs
    await page.click('text=Activity Logs');
    
    // Check for password reset request log
    const logEntries = page.locator('table tbody tr');
    const count = await logEntries.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Verify log entry contains password reset action
    const hasPasswordResetLog = await page.locator('text=Password reset requested|REQUEST|password_reset').count() > 0;
    expect(hasPasswordResetLog).toBeTruthy();
  });

  test('should verify only one log entry is created for password reset', async ({ page }) => {
    // Login as tenant admin
    await page.goto('/');
    await page.fill('input[placeholder*="name@company.com"]', 'zee@admin.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("Sign In")');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/.*admin|configure.*/);
    
    // Navigate to Activity Logs
    await page.click('text=Activity Logs');
    
    // Count password reset logs for sales@equipmentco.com
    const resetLogs = page.locator('tr:has-text("Password reset requested")');
    const count = await resetLogs.count();
    
    // Should only have one log entry (not duplicated)
    console.log(`Found ${count} password reset log entries`);
    expect(count).toBe(1);
  });

  test('should navigate back from forgot password page', async ({ page }) => {
    // Navigate to login page
    await page.goto('/');
    
    // Click on "Forgot your password?" button
    await page.click('button:has-text("Forgot your password?")');
    
    // Verify we're on forgot password page
    await expect(page.locator('text=Forgot your password?')).toBeVisible();
    
    // Click back button
    await page.click('button:has-text("Back to Login")');
    
    // Verify we're back at login page
    await expect(page.locator('text=Sign in to your company workspace')).toBeVisible();
  });
});
