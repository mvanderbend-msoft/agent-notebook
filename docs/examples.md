# Example notes

These come from a demo webshop where the notebook was tested. They show the format
and, more importantly, the kind of thing worth writing down.

## A decision with a reason only a human knew

The user said: "Raise free delivery to $40. Marketing picked $40 because the average
order is about $32, and they want customers to add one more item. Don't change it
again without checking with them." That reason is nowhere in the code.

```md
## Free delivery is a Marketing-owned incentive to add one more item

- **Status:** confirmed
- **Evidence:** `frontend/src/pages/CartPage.tsx:6` → `const FREE_SHIPPING_THRESHOLD = 4000;`
- **Evidence:** `frontend/src/pages/CheckoutPage.tsx:7` → `const FREE_SHIPPING_THRESHOLD = 4000;`
- **Checked:** 2026-11-12, user explicitly selected $40 and required checking with Marketing before future changes
- **Why it matters:** Marketing chose $40 because the average order is about $32
  and the gap should nudge customers into adding one more item. Check with
  Marketing before changing this threshold again; do not tune it independently.
```

## A trap that looks fine but breaks

```md
## Product queries must filter out `category = 'option'`

- **Status:** confirmed
- **Evidence:** `backend/src/routes/products.ts:19` → `WHERE category IN ('pizza', 'merch')`
- **Evidence:** `backend/src/routes/orders.ts:77` → `AND category IN ('pizza', 'merch')`
- **Checked:** 2026-11-11, read both routes
- **Why it matters:** The products table also holds 20+ custom-pizza options (see
  `decisions.md`). Any new query on `products` without this filter puts "Mozzarella"
  and "Small" on the catalog page and lets them be ordered as menu items.
```

## A hypothesis, labelled as one

```md
## Custom-pizza options live in the products table

- **Status:** hypothesis
- **Evidence:** `backend/src/db/seed.ts:35` → `Reuse the products table: category='option'`
- **Checked:** 2026-11-11, read seed and schema; reason not confirmed with the author
- **Why it matters:** Sizes, crusts, sauces and toppings are rows with
  `category = 'option'`. That reuses price, stock and the `order_items.product_id`
  foreign key without a second table. The likely reason is that there is no migration
  framework, so adding tables is costly. Ask before splitting options into their own
  table; it changes every query listed in `traps.md`.
```

## What not to write down

- "The API runs on port 3001." It's in the README and the config.
- "Prices are stored in cents." The field names (`price_cents`) already say so.
- "The threshold is copied in three files." True, but a quick search finds it. The
  agent in the demo noticed this and, following the quick test, chose not to save it.

## What the weekly tidy-up found on its first run

- A note said orders start as `pending`; the code sets them to `paid`. Removed.
- A note pointed to an endpoint that only existed on an old branch. Removed.
- A hypothesis that toppings could be charged twice; the code removes duplicates.
  Disproved.
- Two notes said the same thing. Merged.
- The main instructions file said pizzas can't be customized, but the shop had a
  build-your-own option. Fixed, and listed under "Protected files changed" in the PR.
