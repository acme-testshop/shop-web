import { test, expect, type Page } from "@playwright/test";

async function addProduct(page: Page, id: number) {
  await page.goto(`product.html?id=${id}`);
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("status")).toHaveText("Added to cart");
}

test.describe("cart", () => {
  test("an empty cart says so", { tag: "@cart" }, async ({ page }) => {
    await page.goto("cart.html");
    await expect(page.getByTestId("empty-cart")).toHaveText("Your cart is empty.");
  });

  test("the cart keeps its items after a reload", { tag: "@cart" }, async ({ page }) => {
    await addProduct(page, 2);
    await page.goto("cart.html");
    await expect(page.getByTestId("cart-item")).toHaveCount(1);
    await page.reload();
    await expect(page.getByTestId("cart-item")).toContainText("Dot Grid Notebook");
  });

  test("changing the quantity updates the total", { tag: "@cart" }, async ({ page }) => {
    await test.step("add a mug", async () => {
      await addProduct(page, 1);
    });
    await test.step("open the cart", async () => {
      await page.goto("cart.html");
      await expect(page.getByTestId("cart-total")).toHaveText("$12.00");
    });
    await test.step("set the quantity to three", async () => {
      await page.getByLabel("Quantity for Ceramic Mug").fill("3");
      await page.getByLabel("Quantity for Ceramic Mug").press("Tab");
      await expect(page.getByTestId("cart-total")).toHaveText("$36.00");
    });
  });

  test("removing the last item empties the cart", { tag: "@cart" }, async ({ page }) => {
    await addProduct(page, 3);
    await page.goto("cart.html");
    await page.getByRole("button", { name: "Remove Desk Lamp" }).click();
    await expect(page.getByTestId("empty-cart")).toBeVisible();
    await expect(page.getByTestId("cart-count")).toHaveText("0");
  });

  test("shows the free shipping threshold", { tag: "@cart" }, async ({ page }) => {
    await addProduct(page, 2);
    await page.goto("cart.html");
    await expect(page.getByTestId("shipping-note")).toHaveText("Free shipping on orders over $50");
  });
});
