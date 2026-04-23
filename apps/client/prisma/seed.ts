/**
 * Usuario demo Family V1 (desarrollo).
 * Ejecutar desde apps/client: `pnpm exec prisma db seed`
 */
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma-family/client";

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl === undefined || databaseUrl.trim() === "") {
  throw new Error("DATABASE_URL requerida para seed Family.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl.trim() })
});

const DEMO_EMAIL = "admin@family.local";
const DEMO_PASSWORD = "familydev1";

async function main(): Promise<void> {
  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: {
      email: DEMO_EMAIL,
      passwordHash: hash,
      role: "admin"
    },
    update: {
      passwordHash: hash,
      role: "admin"
    },
    select: { id: true }
  });

  const existingProfiles = await prisma.profile.count({ where: { userId: user.id } });

  if (existingProfiles === 0) {
    await prisma.profile.create({
      data: {
        userId: user.id,
        displayName: "Principal"
      }
    });
    await prisma.profile.create({
      data: {
        userId: user.id,
        displayName: "Niños"
      }
    });
  }

  // eslint-disable-next-line no-console -- script
  console.log(`Family seed OK · ${DEMO_EMAIL} / ${DEMO_PASSWORD} · rol admin · perfiles por defecto si faltaban.`);
}

void main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
