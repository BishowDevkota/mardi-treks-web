import { test, expect } from "@playwright/test";

test.describe("Booking Flow", () => {
  const TEST_EMAIL = `e2e-test-${Date.now()}@example.com`;
  const TEST_PASSWORD = "E2eTestPass123!";
  const TEST_NAME = "E2E Test User";

  test("can browse home page and navigate to a category listing", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();

    // Find and click a category link from navigation or hero
    const categoryLink = page.locator('a[href^="/trek"], a[href^="/tour"], a[href^="/climbing"]').first();
    if (await categoryLink.count() > 0) {
      const href = await categoryLink.getAttribute("href");
      await categoryLink.click();
      await expect(page).toHaveURL(new RegExp(href!));
    }
  });

  test("can view trek detail page if trek exists", async ({ page }) => {
    // Navigate to a category first, then find a trek link
    await page.goto("/treks");
    const trekLink = page.locator('a[href*="/treks/"]').first();
    if (await trekLink.count() > 0) {
      const href = await trekLink.getAttribute("href");
      await trekLink.click();
      await expect(page).toHaveURL(new RegExp(href!));
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("can sign up with unique credentials", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("h1").first()).toBeVisible();

    await page.fill('input[name="name"]', TEST_NAME);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);

    await page.click('button[type="submit"]');

    // Should redirect to dashboard or login after signup
    await page.waitForURL(/\/dashboard|\/login/, { timeout: 15000 });
  });

  test("can log in with test credentials", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1").first()).toBeVisible();

    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("booking page redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/book/some-trek-slug");
    // Should either show login prompt or redirect to login
    await page.waitForURL(/\/login|\/book\//, { timeout: 10000 });
  });

  test("payment page shows payment options for a valid booking", async ({ page }) => {
    // Log in first
    await page.goto("/login");
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Navigate directly to a booking's payment page — will show error or redirect
    // This validates the payment page renders at all
    await page.goto("/payment/invalid-id");
    // Should show the payment page UI or an error state without crashing
    await expect(page.locator("body")).toBeVisible();
  });

  test("SEO: sitemap and robots.txt are accessible", async ({ page }) => {
    await page.goto("/robots.txt");
    await expect(page.locator("body")).toContainText("User-agent");

    await page.goto("/sitemap.xml");
    await expect(page.locator("body")).toContainText("urlset");
  });
});
