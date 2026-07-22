"use server";

import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, WRITE_ROLES } from "@/lib/auth-helpers";
import { adjustStock } from "@/lib/inventory";
import { productSchema, PRODUCT_COLORS } from "@/lib/validation/product";

// Row layout matches the Products Excel export column order exactly (SKU,
// Name, Category, Color, Store stock, Home stock, Selling price, then a
// trailing informational Total-stock column this import ignores) so
// "export, edit, re-import" round-trips without the user needing to know a
// separate import format. Every product uses the same unit ("dona")
// application-wide, so there's no per-product unit column to read.
const MAX_ROWS = 5000;

export type ImportResult =
  | { ok: true; created: number; updated: number; errors: string[] }
  | { ok: false; error: string };

export async function importProducts(_prev: ImportResult, formData: FormData): Promise<ImportResult> {
  const user = await requireRole(WRITE_ROLES);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "missingFile" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  try {
    // Read from a stream rather than workbook.xlsx.load(buffer): exceljs's
    // bundled types pin an older, non-generic Buffer shape that current
    // Node Buffer instances no longer structurally satisfy.
    await workbook.xlsx.read(Readable.from(buffer));
  } catch {
    return { ok: false, error: "invalidFile" };
  }

  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2) {
    return { ok: false, error: "emptySheet" };
  }
  if (sheet.rowCount - 1 > MAX_ROWS) {
    return { ok: false, error: "tooManyRows" };
  }

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const sku = String(row.getCell(1).text ?? "").trim();
    const name = String(row.getCell(2).text ?? "").trim();
    const categoryName = String(row.getCell(3).text ?? "").trim();
    const colorRaw = String(row.getCell(4).text ?? "").trim().toUpperCase();
    const storeStockRaw = row.getCell(5).text;
    const homeStockRaw = row.getCell(6).text;
    const sellingPriceRaw = row.getCell(7).text;

    if (!sku && !name && !categoryName) continue; // blank row

    if (!sku || !name || !categoryName) {
      errors.push(`Row ${rowNumber}: SKU, name and category are required`);
      continue;
    }

    if (!PRODUCT_COLORS.includes(colorRaw as (typeof PRODUCT_COLORS)[number])) {
      errors.push(`Row ${rowNumber}: color must be one of ${PRODUCT_COLORS.join(", ")}`);
      continue;
    }

    let category = await prisma.category.findFirst({
      where: { name: { equals: categoryName, mode: "insensitive" } },
    });
    if (!category) {
      category = await prisma.category.create({ data: { name: categoryName } });
    }

    const parsed = productSchema.safeParse({
      sku,
      name,
      color: colorRaw,
      sellingPrice: sellingPriceRaw,
      categoryId: category.id,
    });
    if (!parsed.success) {
      errors.push(`Row ${rowNumber}: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`);
      continue;
    }

    const existing = await prisma.product.findUnique({ where: { sku: parsed.data.sku } });
    let productId: string;
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: parsed.data });
      productId = existing.id;
      updated++;
    } else {
      const createdProduct = await prisma.product.create({ data: parsed.data });
      productId = createdProduct.id;
      created++;
    }

    const storeStock = Number(storeStockRaw);
    const homeStock = Number(homeStockRaw);
    if ((Number.isFinite(storeStock) && storeStock >= 0) || (Number.isFinite(homeStock) && homeStock >= 0)) {
      const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
      if (Number.isFinite(storeStock) && storeStock >= 0 && product.storeStock !== storeStock) {
        await adjustStock({ productId, location: "STORE", quantityAfter: storeStock, note: "Import", userId: user.id });
      }
      if (Number.isFinite(homeStock) && homeStock >= 0 && product.homeStock !== homeStock) {
        await adjustStock({ productId, location: "HOME", quantityAfter: homeStock, note: "Import", userId: user.id });
      }
    }
  }

  revalidatePath("/products");
  revalidatePath("/inventory");
  return { ok: true, created, updated, errors };
}
