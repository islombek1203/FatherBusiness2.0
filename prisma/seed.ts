import bcrypt from "bcryptjs";
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
}

function randomPassword() {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
