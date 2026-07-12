import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in backend/.env before seeding"
    );
  }

  const existing = await prisma.user.findFirst({
    where: { role: Role.SUPER_ADMIN, organizationId: null },
  });

  if (existing) {
    console.log(`Super Admin already exists (${existing.email}) - skipping seed.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const superAdmin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      role: Role.SUPER_ADMIN,
      organizationId: null,
    },
  });

  console.log(`Created Super Admin: ${superAdmin.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
