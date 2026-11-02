import { test, expect, type Page } from "@playwright/test";

async function checkoutWith(page: Page, id: number) {
  await page.goto(`product.html?id=${id}`);
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("status")).toHaveText("Added to cart");
  await page.goto("checkout.html");
}

async function applyPromo(page: Page, code: string) {
  await page.getByLabel("Promo code").fill(code);
  await page.getByRole("button", { name: "Apply" }).click();
}

test.describe("checkout", () => {
  test("all fields are required", { tag: "@checkout" }, async ({ page }) => {
    await checkoutWith(page, 1);
    await page.getByRole("button", { name: "Place order" }).click();
    await expect(page.getByText("Please enter your name")).toBeVisible();
    await expect(page.getByText("Please enter a valid email address")).toBeVisible();
    await expect(page.getByText("Please enter your address")).toBeVisible();
    await expect(page.getByText("Please enter a 5-digit ZIP code")).toBeVisible();
  });

  test("an invalid email is rejected", { tag: "@checkout" }, async ({ page }) => {
    await checkoutWith(page, 1);
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByRole("button", { name: "Place order" }).click();
    await expect(page.getByText("Please enter a valid email address")).toBeVisible();
  });

  test("placing an order shows a confirmation and empties the cart", { tag: ["@checkout", "@smoke"] }, async ({ page }) => {
    await test.step("put a lamp in the cart", async () => {
      await checkoutWith(page, 3);
    });
    await test.step("fill in the shipping details", async () => {
      await page.getByLabel("Full name").fill("Jane Doe");
      await page.getByLabel("Email").fill("jane@example.com");
      await page.getByLabel("Address").fill("1 Main Street, Springfield");
      await page.getByLabel("ZIP code").fill("12345");
    });
    await test.step("place the order", async () => {
      await page.getByRole("button", { name: "Place order" }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Thank you for your order!");
      await expect(page.getByText(/Order #\d{6}/)).toBeVisible();
      await expect(page.getByTestId("cart-count")).toHaveText("0");
    });
  });

  test("promo code SAVE10 takes 10% off", { tag: "@checkout" }, async ({ page }) => {
    await checkoutWith(page, 4);
    await applyPromo(page, "SAVE10");
    await expect(page.getByTestId("promo-message")).toHaveText("SAVE10: 10% off");
    await expect(page.getByTestId("order-discount")).toHaveText("-$5.90");
    await expect(page.getByTestId("order-total")).toHaveText("$58.05");
  });

  test.fail("an expired promo code is rejected", { tag: "@checkout" }, async ({ page }) => {
    await checkoutWith(page, 4);
    await applyPromo(page, "SPRING10");
    await expect(page.getByTestId("promo-message")).toHaveText("This promo code has expired", { timeout: 2000 });
  });

  test.skip("pays with PayPal", { tag: "@checkout" }, async ({ page }) => {
    await checkoutWith(page, 2);
    await page.getByRole("button", { name: "Pay with PayPal" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Thank you for your order!");
  });
});
