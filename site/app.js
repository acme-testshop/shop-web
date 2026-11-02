// Acme Testshop - all page logic. No framework, no build step.

const PRODUCTS = [
  { id: 1, name: "Ceramic Mug", price: 12, description: "A 350 ml stoneware mug that keeps coffee warm a little longer." },
  { id: 2, name: "Dot Grid Notebook", price: 8, description: "A5, 120 pages of 100 gsm paper, lies flat when open." },
  { id: 3, name: "Desk Lamp", price: 45, description: "Dimmable LED lamp with a warm and a cool setting." },
  { id: 4, name: "Canvas Backpack", price: 59, description: "20 litres, padded laptop sleeve, water-resistant base." },
  { id: 5, name: "Steel Water Bottle", price: 18, description: "750 ml, double-walled, keeps drinks cold for 24 hours." },
  { id: 6, name: "Wireless Headphones", price: 79, description: "Over-ear, 30 hours of battery, folds flat for travel." },
];

const CART_KEY = "acme-cart";
const FREE_SHIPPING_FROM = 60;
const SHIPPING = 4.95;

const PROMOS = {
  SAVE10: { percent: 10 },
  SPRING10: { percent: 10, expires: "2026-03-31" },
};

const money = (n) => "$" + n.toFixed(2);
const findProduct = (id) => PRODUCTS.find((p) => p.id === Number(id));

// ---------------------------------------------------------------- cart

function readCart() {
  try {
    const items = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  renderCartCount();
}

function addToCart(id, qty) {
  const items = readCart();
  const line = items.find((i) => i.id === id);
  if (line) line.qty += qty;
  else items.push({ id, qty });
  writeCart(items);
}

function cartLines() {
  return readCart()
    .map((i) => ({ ...i, product: findProduct(i.id) }))
    .filter((l) => l.product);
}

const subtotalOf = (lines) => lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);

function renderCartCount() {
  const el = document.querySelector("[data-testid=cart-count]");
  if (el) el.textContent = String(readCart().reduce((sum, i) => sum + i.qty, 0));
}

// ---------------------------------------------------------------- promo service

// Stands in for the promo API: answers after a short delay, and is sometimes busy.
function checkPromo(code) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.4) {
        reject(new Error("Promo service is busy, please try again."));
        return;
      }
      const promo = PROMOS[code.trim().toUpperCase()];
      if (!promo) reject(new Error("Unknown promo code"));
      else if (promo.expires && Date.parse(promo.expires) < Date.now) reject(new Error("This promo code has expired"));
      else resolve(promo);
    }, 150 + Math.random() * 200);
  });
}

// ---------------------------------------------------------------- pages

function initHome() {
  const list = document.getElementById("products");
  const search = document.getElementById("search");
  const sort = document.getElementById("sort");
  const empty = document.getElementById("no-results");

  function render() {
    const q = search.value.trim().toLowerCase();
    let items = PRODUCTS.filter((p) => p.name.toLowerCase().includes(q));
    if (sort.value === "price-asc") items = [...items].sort((a, b) => a.price - b.price);
    if (sort.value === "price-desc") items = [...items].sort((a, b) => b.price - a.price);
    list.replaceChildren(...items.map(productCard));
    empty.hidden = items.length > 0;
  }

  search.addEventListener("input", render);
  sort.addEventListener("change", render);
  render();
}

function productCard(product) {
  const li = document.createElement("li");
  li.className = "card";
  li.dataset.testid = "product-card";
  li.innerHTML = `<a href="product.html?id=${product.id}">${product.name}</a><span class="price">${money(product.price)}</span>`;
  return li;
}

function initProduct() {
  const product = findProduct(new URLSearchParams(location.search).get("id"));
  const main = document.querySelector("main");
  if (!product) {
    main.innerHTML = `<h1>Product not found</h1><p><a href="./">Back to the shop</a></p>`;
    document.title = "Not found - Acme Testshop";
    return;
  }

  document.title = `${product.name} - Acme Testshop`;
  document.getElementById("name").textContent = product.name;
  document.getElementById("price").textContent = money(product.price);
  document.getElementById("description").textContent = product.description;

  const qty = document.getElementById("qty");
  const quantity = () => Math.max(1, parseInt(qty.value, 10) || 1);
  document.getElementById("decrease").addEventListener("click", () => (qty.value = String(Math.max(1, quantity() - 1))));
  document.getElementById("increase").addEventListener("click", () => (qty.value = String(quantity() + 1)));

  const toast = document.getElementById("toast");
  let toastTimer;
  document.getElementById("add").addEventListener("click", () => {
    addToCart(product.id, quantity());
    toast.textContent = "Added to cart";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.textContent = ""), 2000);
  });

  // Recommendations come from a separate, slower service.
  const recommendations = document.getElementById("recommendations");
  setTimeout(() => {
    const others = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 3);
    recommendations.querySelector("ul").replaceChildren(...others.map(productCard));
    recommendations.hidden = false;
  }, 400 + Math.random() * 1000);
}

function initCart() {
  const container = document.getElementById("cart");

  function render() {
    const lines = cartLines();
    if (!lines.length) {
      container.innerHTML = `<p data-testid="empty-cart">Your cart is empty.</p><p><a href="./">Continue shopping</a></p>`;
      return;
    }
    const rows = lines
      .map(
        (l) => `<tr data-testid="cart-item">
          <td>${l.product.name}</td>
          <td>${money(l.product.price)}</td>
          <td><input type="number" min="1" value="${l.qty}" data-id="${l.id}" aria-label="Quantity for ${l.product.name}"></td>
          <td>${money(l.product.price * l.qty)}</td>
          <td><button type="button" class="link" data-remove="${l.id}" aria-label="Remove ${l.product.name}">Remove</button></td>
        </tr>`
      )
      .join("");
    container.innerHTML = `
      <table>
        <thead><tr><th>Product</th><th>Price</th><th>Quantity</th><th>Total</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="sum">Subtotal: <strong data-testid="cart-total">${money(subtotalOf(lines))}</strong></p>
      <p class="note" data-testid="shipping-note">Free shipping on orders over $${FREE_SHIPPING_FROM}</p>
      <a class="button" href="checkout.html">Checkout</a>`;

    container.querySelectorAll("input[data-id]").forEach((input) =>
      input.addEventListener("change", () => {
        const items = readCart();
        const line = items.find((i) => i.id === Number(input.dataset.id));
        if (line) line.qty = Math.max(1, parseInt(input.value, 10) || 1);
        writeCart(items);
        render();
      })
    );
    container.querySelectorAll("button[data-remove]").forEach((button) =>
      button.addEventListener("click", () => {
        writeCart(readCart().filter((i) => i.id !== Number(button.dataset.remove)));
        render();
      })
    );
  }

  render();
}

function initCheckout() {
  const form = document.getElementById("checkout-form");
  const summary = document.getElementById("summary");
  const promoInput = document.getElementById("promo");
  const promoMessage = document.getElementById("promo-message");
  let discountPercent = 0;

  function renderSummary() {
    const lines = cartLines();
    const subtotal = subtotalOf(lines);
    const discount = Math.round(subtotal * discountPercent) / 100;
    const shipping = subtotal >= FREE_SHIPPING_FROM || subtotal === 0 ? 0 : SHIPPING;
    summary.innerHTML = `
      <p>Subtotal: <span data-testid="order-subtotal">${money(subtotal)}</span></p>
      ${discount ? `<p>Discount: <span data-testid="order-discount">-${money(discount)}</span></p>` : ""}
      <p>Shipping: <span>${shipping ? money(shipping) : "Free"}</span></p>
      <p class="sum">Total: <strong data-testid="order-total">${money(subtotal - discount + shipping)}</strong></p>`;
  }

  document.getElementById("apply-promo").addEventListener("click", async () => {
    const code = promoInput.value;
    promoMessage.textContent = "Checking…";
    try {
      const promo = await checkPromo(code);
      discountPercent = promo.percent;
      promoMessage.textContent = `${code.trim().toUpperCase()}: ${promo.percent}% off`;
    } catch (error) {
      discountPercent = 0;
      promoMessage.textContent = error.message;
    }
    renderSummary();
  });

  const rules = {
    name: [(v) => v.trim().length > 0, "Please enter your name"],
    email: [(v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), "Please enter a valid email address"],
    address: [(v) => v.trim().length > 0, "Please enter your address"],
    zip: [(v) => /^\d{5}$/.test(v.trim()), "Please enter a 5-digit ZIP code"],
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    let valid = true;
    for (const [field, [check, message]] of Object.entries(rules)) {
      const input = form.elements[field];
      const error = document.getElementById(`${field}-error`);
      const ok = check(input.value);
      error.textContent = ok ? "" : message;
      input.setAttribute("aria-invalid", String(!ok));
      valid &&= ok;
    }
    const formError = document.getElementById("form-error");
    formError.textContent = cartLines().length ? "" : "Your cart is empty.";
    if (!valid || formError.textContent) return;

    const orderNumber = String(Math.floor(100000 + Math.random() * 900000));
    writeCart([]);
    document.querySelector("main").innerHTML = `
      <h1>Thank you for your order!</h1>
      <p>Order #${orderNumber} is on its way to ${form.elements.email.value.trim()}.</p>
      <p><a href="./">Back to the shop</a></p>`;
  });

  renderSummary();
}

// ---------------------------------------------------------------- start

renderCartCount();
const pages = { home: initHome, product: initProduct, cart: initCart, checkout: initCheckout };
pages[document.body.dataset.page]?.();
