import { test, expect } from "@playwright/test";

test.describe("catalog", () => {
  test("home page lists all six products", { tag: "@smoke" }, async ({ page }) => {
    await page.goto("./");
    await expect(page.getByTestId("product-card")).toHaveCount(6);
  });

  test("every product card shows a price", async ({ page }) => {
    await page.goto("./");
    const prices = page.getByTestId("product-card").locator(".price");
    await expect(prices).toHaveCount(6);
    for (const price of await prices.allTextContents()) {
      expect(price).toMatch(/^\$\d+\.\d{2}$/);
    }
  });

  test("search filters products by name", async ({ page }) => {
    await page.goto("./");
    await page.getByLabel("Search products").fill("lamp");
    await expect(page.getByTestId("product-card")).toHaveCount(1);
    await expect(page.getByTestId("product-card")).toContainText("Desk Lamp");
  });

  test("sorting by price puts the cheapest product first", async ({ page }) => {
    await page.goto("./");
    await page.getByLabel("Sort by").selectOption("price-asc");
    await expect(page.getByTestId("product-card").first()).toContainText("Dot Grid Notebook");
    await expect(page.getByTestId("product-card").last()).toContainText("Wireless Headphones");
  });

  test("clicking a product opens its page", { tag: "@smoke" }, async ({ page }) => {
    await test.step("open the shop", async () => {
      await page.goto("./");
    });
    await test.step("click the backpack", async () => {
      await page.getByRole("link", { name: "Canvas Backpack" }).click();
    });
    await test.step("see the product page", async () => {
      await expect(page).toHaveURL(/product\.html\?id=4$/);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Canvas Backpack");
    });
  });
});
