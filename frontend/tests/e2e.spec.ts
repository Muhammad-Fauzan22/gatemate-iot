// =============================================================================
// GATEMATE Frontend - E2E Tests (Playwright)
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('GATEMATE E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test.describe('Authentication Flow', () => {
        test('should redirect to login when not authenticated', async ({ page }) => {
            await expect(page).toHaveURL(/.*login/);
        });

        test('should show login form', async ({ page }) => {
            await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
            await expect(page.getByPlaceholder(/email/i)).toBeVisible();
            await expect(page.getByPlaceholder(/password/i)).toBeVisible();
            await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
        });

        test('should login successfully', async ({ page }) => {
            await page.getByPlaceholder(/email/i).fill('user@gatemate.com');
            await page.getByPlaceholder(/password/i).fill('password123');
            await page.getByRole('button', { name: /log in/i }).click();

            // Should redirect to dashboard
            await expect(page).toHaveURL(/.*dashboard/);
            await expect(page.getByText(/welcome back/i)).toBeVisible();
        });

        test('should show error for invalid credentials', async ({ page }) => {
            await page.getByPlaceholder(/email/i).fill('wrong@email.com');
            await page.getByPlaceholder(/password/i).fill('wrongpassword');
            await page.getByRole('button', { name: /log in/i }).click();

            await expect(page.getByText(/invalid/i)).toBeVisible();
        });
    });

    test.describe('Dashboard', () => {
        test.beforeEach(async ({ page }) => {
            // Login first
            await page.getByPlaceholder(/email/i).fill('user@gatemate.com');
            await page.getByPlaceholder(/password/i).fill('password123');
            await page.getByRole('button', { name: /log in/i }).click();
            await page.waitForURL(/.*dashboard/);
        });

        test('should display gate status', async ({ page }) => {
            await expect(page.getByText(/system status/i)).toBeVisible();
            await expect(page.getByText(/(open|closed)/i)).toBeVisible();
        });

        test('should have quick action buttons', async ({ page }) => {
            await expect(page.getByRole('button', { name: /open gate/i })).toBeVisible();
            await expect(page.getByRole('button', { name: /close gate/i })).toBeVisible();
        });

        test('should navigate to gate control', async ({ page }) => {
            await page.getByText(/north entrance/i).click();
            await expect(page).toHaveURL(/.*gate/);
        });
    });

    test.describe('Gate Control', () => {
        test.beforeEach(async ({ page }) => {
            // Login and navigate to gate control
            await page.getByPlaceholder(/email/i).fill('user@gatemate.com');
            await page.getByPlaceholder(/password/i).fill('password123');
            await page.getByRole('button', { name: /log in/i }).click();
            await page.waitForURL(/.*dashboard/);
            await page.getByText(/north entrance/i).click();
        });

        test('should show gate control elements', async ({ page }) => {
            await expect(page.getByText(/opening percentage/i)).toBeVisible();
            await expect(page.getByRole('button', { name: /stop/i })).toBeVisible();
        });

        test('should have preset buttons', async ({ page }) => {
            await expect(page.getByRole('button', { name: /25%/i })).toBeVisible();
            await expect(page.getByRole('button', { name: /50%/i })).toBeVisible();
            await expect(page.getByRole('button', { name: /75%/i })).toBeVisible();
        });
    });

    test.describe('Schedule', () => {
        test.beforeEach(async ({ page }) => {
            await page.getByPlaceholder(/email/i).fill('user@gatemate.com');
            await page.getByPlaceholder(/password/i).fill('password123');
            await page.getByRole('button', { name: /log in/i }).click();
            await page.waitForURL(/.*dashboard/);
            await page.getByRole('link', { name: /schedule/i }).click();
        });

        test('should display schedule page', async ({ page }) => {
            await expect(page.getByText(/schedule/i)).toBeVisible();
        });

        test('should show add schedule button', async ({ page }) => {
            await expect(page.getByRole('button', { name: /add/i })).toBeVisible();
        });
    });

    test.describe('Settings', () => {
        test.beforeEach(async ({ page }) => {
            await page.getByPlaceholder(/email/i).fill('user@gatemate.com');
            await page.getByPlaceholder(/password/i).fill('password123');
            await page.getByRole('button', { name: /log in/i }).click();
            await page.waitForURL(/.*dashboard/);
            await page.getByRole('link', { name: /settings/i }).click();
        });

        test('should display settings page', async ({ page }) => {
            await expect(page.getByText(/device settings/i)).toBeVisible();
        });

        test('should have logout button', async ({ page }) => {
            await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
        });

        test('logout should redirect to login', async ({ page }) => {
            await page.getByRole('button', { name: /logout/i }).click();
            await expect(page).toHaveURL(/.*login/);
        });
    });
});
