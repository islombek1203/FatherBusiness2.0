# User manual

For day-to-day use by Staff and Viewer accounts. Admin-only features (users, settings, backup/restore) are covered in [`admin-manual.md`](./admin-manual.md).

## Roles

- **Admin** — everything, including user management and Settings.
- **Staff** — can create/edit records and record transactions (products, categories, suppliers, purchases, sales, stock adjustments). Cannot manage users or access Settings.
- **Viewer** — read-only everywhere. Write buttons are hidden in the UI, and the server independently refuses any write attempt regardless of what the client sends — this is enforced both places, not just hidden client-side.

## Logging in

Go to the app's URL, enter your email and password. After 5 failed attempts for the same email within 15 minutes, further attempts are blocked for the rest of that window (a security measure — wait and try again, or ask an Admin to reset your password).

Your session lasts 8 hours of use before you're asked to log in again.

## Language

Switch between Uzbek Cyrillic and Uzbek Latin from the language switcher in the top bar (visible on every page, including before login). Your choice is remembered on your account once logged in.

## Dashboard

The home page shows, using Tashkent-timezone business-day/month boundaries:
- Today's total sales and profit, with the number of sales.
- This month's total sales and profit.
- Count of active products and count of out-of-stock products.
- The 5 most recent sales.

## Products

- **List** (`/products`): search by name/SKU, filter by category. Shows current stock and selling price.
- **New product**: SKU must be unique. Selling price is required; cost is derived automatically from purchases (see below) and cannot be entered directly.
- **Adjust stock**: click the stock icon on a product row to record a manual stock adjustment (e.g. correcting a count, recording damage/loss). Every adjustment — like every purchase and sale — is recorded in **Inventory History**, so nothing changes stock silently.
- **Deactivate**: hides a product from active lists without deleting it (its transaction history is preserved). A category that still has products linked to it cannot be deleted, for the same reason.

## Categories & Suppliers

Simple CRUD lists with search. Deactivating (rather than deleting) is the only removal option once a category/supplier has been used — this keeps historical purchases/products meaningful.

## Purchases

Record a purchase from a supplier: pick the supplier, add one or more product lines with quantity and unit cost. Recording a purchase:
- Increases each product's stock by the purchased quantity.
- Updates each product's cost to that purchase's unit cost (cost = *last* purchase price — see [`architecture.md`](./architecture.md) for why).
- Writes an Inventory History entry per line.

## Sales

Record a sale: add one or more product lines with quantity. Only products currently in stock appear in the picker. If you try to sell more than the available stock, the sale is rejected with a clear error rather than allowing negative stock.

Profit on a sale is `(selling price − cost at the time of the sale)`. Because cost is snapshotted at the moment of sale, a sale's recorded profit never changes later even if you buy more of that product at a different price afterward.

## Inventory History

Read-only log (`/inventory`) of every stock change — purchases, sales, adjustments, and imports — newest first, showing who did it, what changed, and the before/after quantity.

## Reports

`/reports` — filter by date range and/or category to see total revenue, total profit, and a per-product breakdown (units sold, revenue, profit) for that window.

## Exports

Products, Purchases, Sales, and Inventory History can each be exported as Excel (`.xlsx`) or PDF from their respective list pages. Column headers are translated into your current language; PDF exports render Cyrillic text correctly (a Unicode font is embedded).

## Importing products

`/products/import` (requires write access): upload an Excel file to bulk-create or update products, matched by SKU (existing SKUs are updated, new ones are created). Missing categories referenced in the file are created automatically. Download the **template** first (reuses the Products export format) to make sure your file's columns line up. Stock set via import shows up in Inventory History like any other stock change.

## Your profile

`/profile` — change your display name or your own password. Changing your password logs out every device you're currently signed in on, including the one you're using (you'll be asked to log back in) — this is intentional, standard practice for a password change.
