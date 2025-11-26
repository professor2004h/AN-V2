import { test, expect } from '@playwright/test';

await page.fill('input[name="email"], input[type="email"]', 'bob@apranova.com');
await page.fill('input[name="password"], input[type="password"]', 'Student123!');
await page.click('button[type="submit"], button:has-text("Sign In")');

await page.waitForTimeout(5000);

const url = page.url();
console.log('Current URL:', url);
expect(url).toContain('dashboard');

console.log('✅ Bob logged in successfully');

await page.click('text=Tasks, a[href*="tasks"]');
await page.waitForTimeout(3000);

await page.screenshot({ path: 'bob-tasks.png', fullPage: true });

const pageContent = await page.content();
expect(pageContent).toContain("Bob's Backend Challenge");
expect(pageContent).not.toContain("Alice's Special Project");
expect(pageContent).not.toContain("Charlie's First Assignment");

console.log('✅ Bob data isolation verified');
    });

test('Charlie: Login and Data Isolation', async ({ page }) => {
    console.log('🧪 Testing Charlie login and data isolation...');

    await page.goto(`${BASE_URL}/auth/signin`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="email"], input[type="email"]', 'charlie@apranova.com');
    await page.fill('input[name="password"], input[type="password"]', 'Student123!');
    await page.click('button[type="submit"], button:has-text("Sign In")');

    await page.waitForTimeout(5000);

    const url = page.url();
    console.log('Current URL:', url);
    expect(url).toContain('dashboard');

    console.log('✅ Charlie logged in successfully');

    await page.click('text=Tasks, a[href*="tasks"]');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'charlie-tasks.png', fullPage: true });

    const pageContent = await page.content();
    expect(pageContent).toContain("Charlie's First Assignment");
    expect(pageContent).not.toContain("Alice's Special Project");
    expect(pageContent).not.toContain("Bob's Backend Challenge");

    console.log('✅ Charlie data isolation verified');
});

test('Alice: Workspace Access', async ({ page, context }) => {
    console.log('🧪 Testing Alice workspace access...');

    // Login
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.fill('input[name="email"], input[type="email"]', 'alice@apranova.com');
    await page.fill('input[name="password"], input[type="password"]', 'Student123!');
    await page.click('button[type="submit"], button:has-text("Sign In")');
    await page.waitForTimeout(5000);

    // Navigate to Workspace
    await page.click('text=Workspace, a[href*="workspace"]');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'alice-workspace.png', fullPage: true });

    // Check if workspace section loaded
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toContain('workspace');

    console.log('✅ Alice workspace page loaded');

    // Try to find and click Start/Open Workspace button
    const hasStartButton = await page.locator('button:has-text("Start Workspace")').count() > 0;
    const hasOpenButton = await page.locator('button:has-text("Open Workspace")').count() > 0;

    if (hasStartButton) {
        console.log('Starting workspace...');
        await page.click('button:has-text("Start Workspace")');
        await page.waitForTimeout(15000); // Wait for container to start
    }

    if (hasOpenButton || hasStartButton) {
        console.log('✅ Workspace controls found');
    }
});
});
