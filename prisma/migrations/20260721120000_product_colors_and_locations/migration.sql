-- Product colors + multi-location stock.
--
-- Every ALTER that adds a NOT NULL column below is split into three steps
-- (add nullable -> backfill existing rows -> set NOT NULL) so this never
-- fails against a populated table, and no existing row is dropped.
--
-- Backfill choices (confirmed with the business owner):
--   * color            -> 'OQ' for every pre-existing product (editable
--                          afterward from the product edit screen).
--   * location / stock -> everything pre-existing is treated as having
--                          always been at the store ('STORE' / Дўкон).

-- CreateEnum
CREATE TYPE "ProductColor" AS ENUM ('OQ', 'QORA', 'SARIQ');

-- CreateEnum
CREATE TYPE "StockLocation" AS ENUM ('STORE', 'HOME');

-- AlterTable: products.color
ALTER TABLE "products" ADD COLUMN "color" "ProductColor";
UPDATE "products" SET "color" = 'OQ' WHERE "color" IS NULL;
ALTER TABLE "products" ALTER COLUMN "color" SET NOT NULL;

-- AlterTable: products stock split (storeStock/homeStock replace currentStock)
ALTER TABLE "products" ADD COLUMN "storeStock" INTEGER;
ALTER TABLE "products" ADD COLUMN "homeStock" INTEGER;
UPDATE "products" SET "storeStock" = "currentStock", "homeStock" = 0 WHERE "storeStock" IS NULL;
ALTER TABLE "products" ALTER COLUMN "storeStock" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "storeStock" SET DEFAULT 0;
ALTER TABLE "products" ALTER COLUMN "homeStock" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "homeStock" SET DEFAULT 0;
ALTER TABLE "products" DROP COLUMN "currentStock";

-- AlterTable: inventory_history.location
ALTER TABLE "inventory_history" ADD COLUMN "location" "StockLocation";
UPDATE "inventory_history" SET "location" = 'STORE' WHERE "location" IS NULL;
ALTER TABLE "inventory_history" ALTER COLUMN "location" SET NOT NULL;

-- AlterTable: purchase_items.location
ALTER TABLE "purchase_items" ADD COLUMN "location" "StockLocation";
UPDATE "purchase_items" SET "location" = 'STORE' WHERE "location" IS NULL;
ALTER TABLE "purchase_items" ALTER COLUMN "location" SET NOT NULL;

-- AlterTable: sale_items.location
ALTER TABLE "sale_items" ADD COLUMN "location" "StockLocation";
UPDATE "sale_items" SET "location" = 'STORE' WHERE "location" IS NULL;
ALTER TABLE "sale_items" ALTER COLUMN "location" SET NOT NULL;

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");
