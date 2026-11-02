# Acme Testshop demo

A tiny static shop (plain HTML, CSS and JavaScript in `site/`) with a
Playwright test suite.

- Product list with search and sorting, product pages, a cart kept in
  `localStorage`, and a checkout form with validation.
- No build step: `site/` is published to GitHub Pages as it is.

## Run the tests

```sh
npm ci
npx playwright install --with-deps
npx playwright test
```

Locally, Playwright serves `site/` itself (`serve.mjs`, port 5174). To test a
deployed copy, set `BASE_URL`, for example
`BASE_URL=https://example.github.io/shop-web/ npx playwright test`.

The HTML report ends up in `playwright-report/` (`npx playwright show-report`).
