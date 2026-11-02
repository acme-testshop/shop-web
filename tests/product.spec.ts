import { test, expect } from "@playwright/test";

test.describe("product page", () => {
  test("shows name, price and description", async ({ page }) => {
    await page.goto("product.html?id=3");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Desk Lamp");
    await expect(page.getByTestId("price")).toHaveText("$45.00");
    await expect(page.getByText("Dimmable LED lamp")).toBeVisible();
  });

  test("quantity cannot go below one", async ({ page }) => {
    await page.goto("product.html?id=1");
    const quantity = page.getByLabel("Quantity", { exact: true });
    await page.getByRole("button", { name: "Decrease quantity" }).click();
    await page.getByRole("button", { name: "Decrease quantity" }).click();
    await expect(quantity).toHaveValue("1");
    await page.getByRole("button", { name: "Increase quantity" }).click();
    await expect(quantity).toHaveValue("2");
  });

  test("adding to the cart updates the header count", { tag: ["@cart", "@smoke"] }, async ({ page }) => {
    const count = page.getByTestId("cart-count");
    await test.step("open a product with an empty cart", async () => {
      await page.goto("product.html?id=5");
      await expect(count).toHaveText("0");
    });
    await test.step("add two of it", async () => {
      await page.getByLabel("Quantity", { exact: true }).fill("2");
      await page.getByRole("button", { name: "Add to cart" }).click();
      await expect(page.getByRole("status")).toHaveText("Added to cart");
    });
    await test.step("the count survives a reload", async () => {
      await expect(count).toHaveText("2");
      await page.reload();
      await expect(count).toHaveText("2");
    });
  });

  test("an unknown product shows a not-found message", async ({ page }) => {
    await page.goto("product.html?id=999");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Product not found");
  });

  test("shows recommendations below the product", async ({ page }) => {
    await page.goto("product.html?id=1");
    const recommendations = page.getByTestId("recommendations");
    await expect(recommendations).toBeVisible({ timeout: 1000 });
    await expect(recommendations.getByTestId("product-card")).toHaveCount(3);
  });
});
