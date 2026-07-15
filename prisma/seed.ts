import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { prisma } from "../src/lib/prisma";

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@inventory.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? randomPassword();

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existingAdmin) {
    console.log(`Admin user already exists (${adminEmail}); skipping creation.`);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        name: "Administrator",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        locale: "UZ_CYRL",
      },
    });

    console.log("Seeded initial Admin user:");
    console.log(`  email:    ${adminEmail}`);
    console.log(`  password: ${adminPassword}`);
    console.log("Change this password after first login (see docs/user-manual.md).");
  }

  await seedSampleCategoriesAndProducts();
}

// Idempotent (upsert by unique key), so it's safe to run on every container
// start via docker-entrypoint.sh without creating duplicates.
async function seedSampleCategoriesAndProducts() {
  const categories = [
    { name: "Oziq-ovqat", description: "Oziq-ovqat mahsulotlari" },
    { name: "Ichimliklar", description: "Alkogolsiz va boshqa ichimliklar" },
    { name: "Maishiy kimyo", description: "Tozalash va gigiena vositalari" },
  ] as const;

  const categoryIds: Record<string, string> = {};
  for (const category of categories) {
    const record = await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    categoryIds[category.name] = record.id;
  }

  const products = [
    {
      sku: "FOOD-001",
      name: "Non",
      unit: "dona",
      sellingPrice: "3000",
      categoryName: "Oziq-ovqat",
    },
    {
      sku: "FOOD-002",
      name: "Guruch (1 kg)",
      unit: "kg",
      sellingPrice: "14000",
      categoryName: "Oziq-ovqat",
    },
    {
      sku: "DRINK-001",
      name: "Mineral suv (1.5 l)",
      unit: "dona",
      sellingPrice: "5000",
      categoryName: "Ichimliklar",
    },
    {
      sku: "CHEM-001",
      name: "Idish yuvish vositasi",
      unit: "dona",
      sellingPrice: "18000",
      categoryName: "Maishiy kimyo",
    },
  ] as const;

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        sku: product.sku,
        name: product.name,
        unit: product.unit,
        sellingPrice: product.sellingPrice,
        categoryId: categoryIds[product.categoryName],
      },
    });
  }

  console.log(`Seeded ${categories.length} sample categories and ${products.length} sample products.`);
}

function randomPassword() {
  // Math.random() is not a CSPRNG — unsuitable for a security credential,
  // even a bootstrap one the admin is expected to change immediately.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return Array.from({ length: 20 }, () => alphabet[randomInt(alphabet.length)]).join("");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
