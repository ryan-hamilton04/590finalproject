import { test, expect } from '@playwright/test';

/**
 * Complete Smoothie Stand Workflow Test
 *
 * This test was created by live browser inspection using Playwright MCP
 * to ensure accurate selectors and assertions based on the actual DOM structure.
 *
 * Test Flow:
 * 1. Login with CI/CD test credentials
 * 2. Navigate to customer page and create an order
 * 3. Navigate to operator page and process the order
 * 4. Verify order completion on customer page
 */

test.describe('Smoothie Stand Complete Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should complete full order workflow from customer to operator', async ({ page }) => {
    // Step 1: Login with CI/CD test credentials
    await page.getByRole('link', { name: 'Login' }).click();
    await expect(page).toHaveURL('/login');

    // Wait for the password input to be fully initialized by Vue
    const passwordInput = page.getByRole('textbox', { name: 'CI/CD Test Password' });
    await passwordInput.waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle');

    // Fill in CI/CD test password
    await passwordInput.fill('your-cicd-test-password');

    // Click login and wait for navigation
    await Promise.all([
      page.waitForURL('/', { timeout: 10000 }),
      page.getByRole('button', { name: 'CI/CD Test Login' }).click()
    ]);

    // Verify successful login - should redirect to home page with user profile
    await expect(page.getByRole('heading', { name: 'Welcome back, CI/CD Test!' })).toBeVisible({ timeout: 10000 });

    // Step 2: Navigate to customer page
    await page.getByRole('link', { name: 'Customer' }).click();
    await expect(page).toHaveURL('/customer');
    await expect(page.getByRole('heading', { name: 'Welcome, CI/CD Test' })).toBeVisible();

    // Step 3: Create a new order
    // Wait for the combobox to be fully initialized by Vue
    const combobox = page.getByRole('combobox');
    await combobox.waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle');

    // Open the ingredients dropdown
    await combobox.click();

    // Wait for dropdown options to be visible
    await page.getByRole('option', { name: 'strawberry' }).waitFor({ state: 'visible' });

    // Select strawberry
    await page.getByRole('option', { name: 'strawberry' }).click();

    // Select banana
    await page.getByRole('option', { name: 'banana' }).click();

    // Close the dropdown
    await page.keyboard.press('Escape');

    // Verify selected ingredients are displayed
    await expect(combobox).toContainText('strawberry, banana');

    // Save draft
    await page.getByRole('button', { name: 'Save Draft' }).click();

    // Submit order
    await page.getByRole('button', { name: 'Submit Order' }).click()

    // Verify a new order appears with "queued" status and our ingredients
    const newOrderRow = page.getByRole('row').filter({
      hasText: 'queued'
    }).filter({
      hasText: 'strawberry,banana'
    }).first();
    await expect(newOrderRow).toBeVisible();

    // Capture the order ID for later verification
    const orderCell = newOrderRow.getByRole('cell').first();
    const orderId = await orderCell.textContent();

    // Step 4: Navigate to operator page
    await page.getByRole('link', { name: 'Operator' }).click();
    await expect(page).toHaveURL('/operator');
    await expect(page.getByRole('heading', { name: 'Work Screen for CI/CD Test' })).toBeVisible();

    // Step 5: Find the queued order and start blending
    const operatorOrderRow = page.getByRole('row').filter({ hasText: orderId || '' });
    await expect(operatorOrderRow).toContainText('queued');
    await expect(operatorOrderRow).toContainText('Unassigned');

    // Start blending
    await operatorOrderRow.getByRole('button', { name: 'Start Blending' }).click();

    // Verify status changed to "blending" and operator is assigned
    await expect(operatorOrderRow).toContainText('blending');
    await expect(operatorOrderRow).toContainText('cicd-test@smoothiestand.local');

    // Step 6: Mark order as done
    await operatorOrderRow.getByRole('button', { name: 'Mark Done' }).click();

    // Verify status changed to "done"
    await expect(operatorOrderRow).toContainText('done');

    // Step 7: Go back to customer page to verify completion
    await page.getByRole('link', { name: 'Customer' }).click();
    await expect(page).toHaveURL('/customer');

    // Verify the order shows as "done" in customer's order list
    const customerOrderRow = page.getByRole('row').filter({ hasText: orderId || '' });
    await expect(customerOrderRow).toBeVisible();
    await expect(customerOrderRow).toContainText('done');
    await expect(customerOrderRow).toContainText('strawberry,banana');
    await expect(customerOrderRow).toContainText('cicd-test@smoothiestand.local');
  });

  test('should allow creating multiple orders', async ({ page }) => {
    // Login
    await page.getByRole('link', { name: 'Login' }).click();

    // Wait for the password input to be fully initialized by Vue
    const passwordInput = page.getByRole('textbox', { name: 'CI/CD Test Password' });
    await passwordInput.waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle');

    await passwordInput.fill('your-cicd-test-password');

    await Promise.all([
      page.waitForURL('/', { timeout: 10000 }),
      page.getByRole('button', { name: 'CI/CD Test Login' }).click()
    ]);

    // Navigate to customer page
    await page.getByRole('link', { name: 'Customer' }).click();
    await expect(page).toHaveURL('/customer');

    // Wait for the combobox to be fully initialized by Vue
    const combobox = page.getByRole('combobox');
    await combobox.waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle');

    // Count existing orders before creating new ones
    const initialOrderCount = await page.getByRole('row').filter({ hasText: /queued|blending|done/ }).count();

    // Create first order with milk
    await combobox.click();
    await page.getByRole('option', { name: 'milk' }).waitFor({ state: 'visible' });
    await page.getByRole('option', { name: 'milk' }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Save Draft' }).click();
    await page.getByRole('button', { name: 'Submit Order' }).click();

    // Verify first order appears
    await expect(page.getByRole('row').filter({ hasText: 'milk' }).filter({ hasText: 'queued' }).first()).toBeVisible();

    // Create second order with strawberry and milk
    await combobox.click();
    await page.getByRole('option', { name: 'strawberry' }).waitFor({ state: 'visible' });
    await page.getByRole('option', { name: 'strawberry' }).click();
    await page.getByRole('option', { name: 'milk' }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Save Draft' }).click();
    await page.getByRole('button', { name: 'Submit Order' }).click();

    // Verify both new orders appear in the table (check we have at least 2 more than we started with)
    // Use toPass to retry the assertion until the page updates with the new orders
    await expect.poll(async () => {
      const finalOrderCount = await page.getByRole('row').filter({ hasText: /queued|blending|done/ }).count();
      return finalOrderCount;
    }, {
      message: 'Expected at least 2 new orders to appear',
      timeout: 5000
    }).toBeGreaterThanOrEqual(initialOrderCount + 2);
  });

  test('should show operator assignment correctly', async ({ page }) => {
    // Login
    await page.getByRole('link', { name: 'Login' }).click();

    // Wait for the password input to be fully initialized by Vue
    const passwordInput = page.getByRole('textbox', { name: 'CI/CD Test Password' });
    await passwordInput.waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle');

    await passwordInput.fill('your-cicd-test-password');

    await Promise.all([
      page.waitForURL('/', { timeout: 10000 }),
      page.getByRole('button', { name: 'CI/CD Test Login' }).click()
    ]);

    // Create an order as customer
    await page.getByRole('link', { name: 'Customer' }).click();
    await expect(page).toHaveURL('/customer');

    // Wait for the combobox to be fully initialized by Vue
    const combobox = page.getByRole('combobox');
    await combobox.waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle');

    await combobox.click();
    await page.getByRole('option', { name: 'banana' }).waitFor({ state: 'visible' });
    await page.getByRole('option', { name: 'banana' }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Save Draft' }).click();
    await page.getByRole('button', { name: 'Submit Order' }).click();

    // Switch to operator view
    await page.getByRole('link', { name: 'Operator' }).click();
    await expect(page).toHaveURL('/operator');

    // Find the specific order we just created (queued with banana and unassigned)
    const orderRow = page.getByRole('row').filter({ hasText: 'banana' }).filter({ hasText: 'queued' }).filter({ hasText: 'Unassigned' }).first();
    await expect(orderRow).toBeVisible();

    // Get the order ID to track it after status changes
    const orderIdCell = orderRow.getByRole('cell').first();
    const orderId = await orderIdCell.textContent();

    // Start blending
    await orderRow.getByRole('button', { name: 'Start Blending' }).click();

    // Find the row again by order ID since status changed
    const updatedOrderRow = page.getByRole('row').filter({ hasText: orderId || '' });

    // Verify operator is now assigned and status changed
    await expect(updatedOrderRow).toContainText('cicd-test@smoothiestand.local');
    await expect(updatedOrderRow).toContainText('blending');
  });
});
