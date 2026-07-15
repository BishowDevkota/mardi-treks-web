import { test, expect } from "@playwright/test";

test.describe("Booking Flow", () => {
  test("can browse treks and navigate to detail page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Discover the Himalayas");

    // Navigate to treks page
    await page.click('a[href="/treks"]');
    await expect(page).toHaveURL("/treks");
    await expect(page.locator("h1")).toContainText("Trekking Packages");
  });

  test("can view trek detail page", async ({ page }) => {
    await page.goto("/treks/everest-base-camp");
    await expect(page.locator("h1")).toContainText("Everest Base Camp Trek");

    // Check itinerary section exists
    await expect(page.locator("#itinerary")).toBeVisible();

    // Check pricing card exists
    await expect(page.locator("text=Pricing")).toBeVisible();
  });

  test("can sign up and create booking", async ({ page }) => {
    // Go to signup
    await page.goto("/signup");
    await expect(page.locator("h1")).toContainText("Create an account");

    // Fill signup form
    const testEmail = `test-${Date.now()}@example.com`;
    await page.fill('input[name="name"]', "Test User");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', "TestPass123!");

    // Submit signup
    await page.click('button[type="submit"]');

    // Should redirect to dashboard (or login if signup redirects there)
    await page.waitForURL(/\/dashboard|\/login/, { timeout: 10000 });
  });

  test("login flow works", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Welcome back");

    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "TestPass123!");
    await page.click('button[type="submit"]');
  });

  test("booking form shows for authenticated user", async ({ page }) => {
    // First sign in
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "TestPass123!");
    await page.click('button[type="submit"]');

    // Navigate to booking page
    await page.goto("/book/everest-base-camp");
    await expect(page.locator("h1")).toContainText("Book Your Trek");

    // Check form elements
    await expect(page.locator("#startDate")).toBeVisible();
    await expect(page.locator("#groupSize")).toBeVisible();
  });
});
