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

  await seedRequiredExpenseTypes();
}

// The three expense types the business requires today. Idempotent (upsert by
// unique name), so it's safe to run on every container start — same as the
// admin bootstrap above. This is real required reference data, not demo
// content: more types can be added later from the /expense-types UI without
// touching this list or needing a migration.
async function seedRequiredExpenseTypes() {
  const expenseTypes = ["Иш ҳақи", "Етказиб бериш", "Электр"] as const;

  for (const name of expenseTypes) {
    await prisma.expenseType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`Ensured ${expenseTypes.length} required expense types exist.`);
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
