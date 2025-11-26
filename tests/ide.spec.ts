import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3001/api';

test.describe('Apranova LMS - Complete IDE Testing', () => {

    test('Alice: Login, Tasks, Workspace, and IDE', async ({ page, context }) => {
        // Step 1: Login as Alice
        await page.goto(`${BASE_URL}/auth/signin`);
        await page.fill('input[type="email"]', 'alice@apranova.com');
        await page.fill('input[type="password"]', 'Student123!');
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        await expect(page).toHaveURL(/dashboard/);

        // Step 2: Verify Tasks (Data Isolation)
        await page.click('text=Tasks');
        await page.waitForSelector('text=Alice\'s Special Project', { timeout: 5000 });

        // Verify Alice sees her task
        await expect(page.locator('text=Alice\'s Special Project')).toBeVisible();

        // Verify Alice does NOT see other tasks
        await expect(page.locator('text=Bob\'s Backend Challenge')).not.toBeVisible();
        await expect(page.locator('text=Charlie\'s First Assignment')).not.toBeVisible();

        console.log('✅ Alice data isolation verified');

        // Step 3: Navigate to Workspace
        await page.click('text=Workspace');
        await page.waitForTimeout(2000);

        // Step 4: Start workspace if needed
        const startButton = page.locator('button:has-text("Start Workspace")');
        if (await startButton.isVisible()) {
            await startButton.click();
            await page.waitForTimeout(15000); // Wait for container to start
        }

        // Step 5: Open IDE in new tab
        const [idePage] = await Promise.all([
            context.waitForEvent('page'),
            page.click('button:has-text("Open Workspace")')
        ]);

        await idePage.waitForLoadState('networkidle');
        console.log('✅ Alice IDE opened:', idePage.url());

        // Step 6: Wait for Code-Server to load
        await idePage.waitForSelector('.monaco-editor', { timeout: 30000 });

        // Step 7: Create a test file
        // Right-click on workspace folder
        await idePage.click('[aria-label="workspace"]', { button: 'right' });
        await idePage.click('text=New File');
        await idePage.fill('input[placeholder="File name"]', 'alice_test.html');
        await idePage.press('input[placeholder="File name"]', 'Enter');

        // Step 8: Add content to file
        const editor = idePage.locator('.monaco-editor');
        await editor.click();
        await idePage.keyboard.type(`<!DOCTYPE html>
<html>
<head><title>Alice Test</title></head>
<body>
  <h1>Alice's Workspace Test</h1>
  <p>Testing auto-save and persistence</p>
</body>
</html>`);

        // Wait for auto-save (Code-Server auto-saves after 1 second)
        await idePage.waitForTimeout(3000);

        console.log('✅ Alice file created and auto-saved');

        // Step 9: Verify file in terminal
        await idePage.click('text=Terminal');
        await idePage.click('text=New Terminal');
        await idePage.waitForTimeout(1000);

        const terminal = idePage.locator('.xterm-screen');
        await terminal.click();
        await idePage.keyboard.type('ls -la\n');
        await idePage.waitForTimeout(1000);

        // Check if alice_test.html appears in terminal output
        const terminalText = await terminal.textContent();
        expect(terminalText).toContain('alice_test.html');

        console.log('✅ Alice file verified in terminal');

        // Close IDE tab
        await idePage.close();

        // Step 10: Test persistence - Stop and restart workspace
        await page.click('button:has-text("Stop Workspace")');
        await page.waitForTimeout(5000);

        await page.click('button:has-text("Start Workspace")');
        await page.waitForTimeout(15000);

        // Reopen IDE
        const [idePage2] = await Promise.all([
            context.waitForEvent('page'),
            page.click('button:has-text("Open Workspace")')
        ]);

        await idePage2.waitForLoadState('networkidle');
        await idePage2.waitForSelector('.monaco-editor', { timeout: 30000 });

        // Verify file still exists
        await idePage2.click('[aria-label="workspace"]');
        await expect(idePage2.locator('text=alice_test.html')).toBeVisible();

        console.log('✅ Alice file persistence verified');

        await idePage2.close();
    });

    test('Bob: Login, Tasks, and Workspace Isolation', async ({ page, context }) => {
        // Login as Bob
        await page.goto(`${BASE_URL}/auth/signin`);
        await page.fill('input[type="email"]', 'bob@apranova.com');
        await page.fill('input[type="password"]', 'Student123!');
        await page.click('button[type="submit"]');

        await page.waitForURL('**/dashboard', { timeout: 10000 });

        // Verify Bob's tasks
        await page.click('text=Tasks');
        await expect(page.locator('text=Bob\'s Backend Challenge')).toBeVisible();
        await expect(page.locator('text=Alice\'s Special Project')).not.toBeVisible();
        await expect(page.locator('text=Charlie\'s First Assignment')).not.toBeVisible();

        console.log('✅ Bob data isolation verified');

        // Open Bob's workspace
        await page.click('text=Workspace');
        await page.waitForTimeout(2000);

        const startButton = page.locator('button:has-text("Start Workspace")');
        if (await startButton.isVisible()) {
            await startButton.click();
            await page.waitForTimeout(15000);
        }

        const [idePage] = await Promise.all([
            context.waitForEvent('page'),
            page.click('button:has-text("Open Workspace")')
        ]);

        await idePage.waitForLoadState('networkidle');
        await idePage.waitForSelector('.monaco-editor', { timeout: 30000 });

        // CRITICAL: Verify Bob does NOT see Alice's files
        await idePage.click('[aria-label="workspace"]');
        await expect(idePage.locator('text=alice_test.html')).not.toBeVisible();

        console.log('✅ Bob workspace isolation verified - no Alice files');

        // Create Bob's file
        await idePage.click('[aria-label="workspace"]', { button: 'right' });
        await idePage.click('text=New File');
        await idePage.fill('input[placeholder="File name"]', 'bob_test.js');
        await idePage.press('input[placeholder="File name"]', 'Enter');

        const editor = idePage.locator('.monaco-editor');
        await editor.click();
        await idePage.keyboard.type(`// Bob's Backend Test
console.log('Bob workspace initialized');
`);

        await idePage.waitForTimeout(3000);
        console.log('✅ Bob file created');

        await idePage.close();
    });

    test('Charlie: Login, Tasks, and Complete Isolation', async ({ page, context }) => {
        // Login as Charlie
        await page.goto(`${BASE_URL}/auth/signin`);
        await page.fill('input[type="email"]', 'charlie@apranova.com');
        await page.fill('input[type="password"]', 'Student123!');
        await page.click('button[type="submit"]');

        await page.waitForURL('**/dashboard', { timeout: 10000 });

        // Verify Charlie's tasks
        await page.click('text=Tasks');
        await expect(page.locator('text=Charlie\'s First Assignment')).toBeVisible();
        await expect(page.locator('text=Alice\'s Special Project')).not.toBeVisible();
        await expect(page.locator('text=Bob\'s Backend Challenge')).not.toBeVisible();

        console.log('✅ Charlie data isolation verified');

        // Open Charlie's workspace
        await page.click('text=Workspace');
        await page.waitForTimeout(2000);

        const startButton = page.locator('button:has-text("Start Workspace")');
        if (await startButton.isVisible()) {
            await startButton.click();
            await page.waitForTimeout(15000);
        }

        const [idePage] = await Promise.all([
            context.waitForEvent('page'),
            page.click('button:has-text("Open Workspace")')
        ]);

        await idePage.waitForLoadState('networkidle');
        await idePage.waitForSelector('.monaco-editor', { timeout: 30000 });

        // CRITICAL: Verify Charlie sees NO other students' files
        await idePage.click('[aria-label="workspace"]');
        await expect(idePage.locator('text=alice_test.html')).not.toBeVisible();
        await expect(idePage.locator('text=bob_test.js')).not.toBeVisible();

        console.log('✅ Charlie workspace isolation verified - no other files');

        await idePage.close();
    });
});
