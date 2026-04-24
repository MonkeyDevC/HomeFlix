/**
 * Bootstrap explícito del primer usuario admin en producción (o VPS).
 *
 * NO se ejecuta en el arranque del contenedor: invocar manualmente una vez
 * con variables de entorno (ver docs/deploy-production.md).
 *
 * Reglas de seguridad:
 *   - Solo crea un usuario nuevo si aún no existe ningún usuario con rol `admin`.
 *   - Si el email ya existe: no modifica nada salvo que HOMEFLIX_BOOTSTRAP_RESET_PASSWORD=1.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma-family/client";

const MIN_PASSWORD_LEN = 12;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (v === undefined || v.trim() === "") {
    throw new Error(`${name} es obligatoria para bootstrap-admin.`);
  }
  return v.trim();
}

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined || databaseUrl.trim() === "") {
  throw new Error("DATABASE_URL requerida.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl.trim() })
});

async function main(): Promise<void> {
  const emailRaw = requireEnv("HOMEFLIX_BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  const password = requireEnv("HOMEFLIX_BOOTSTRAP_ADMIN_PASSWORD");

  if (password.length < MIN_PASSWORD_LEN) {
    throw new Error(
      `HOMEFLIX_BOOTSTRAP_ADMIN_PASSWORD debe tener al menos ${MIN_PASSWORD_LEN} caracteres.`
    );
  }

  const adminCount = await prisma.user.count({ where: { role: "admin" } });
  const existing = await prisma.user.findUnique({
    where: { email: emailRaw },
    select: { id: true, role: true }
  });

  const reset = process.env.HOMEFLIX_BOOTSTRAP_RESET_PASSWORD === "1";

  if (existing !== null) {
    if (!reset) {
      // eslint-disable-next-line no-console -- script
      console.log(
        `Bootstrap: el usuario ${emailRaw} ya existe. No se aplicaron cambios. ` +
          `Pon HOMEFLIX_BOOTSTRAP_RESET_PASSWORD=1 para actualizar contraseña y forzar rol admin (también promueve si no era admin).`
      );
      return;
    }
    const hash = bcrypt.hashSync(password, 10);
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash: hash, role: "admin" }
    });
    // eslint-disable-next-line no-console -- script
    console.log(`Bootstrap OK: contraseña actualizada y rol admin para ${emailRaw}.`);
    return;
  }

  if (adminCount > 0) {
    throw new Error(
      "Ya existe al menos un usuario admin. Este script solo crea el primero. " +
        "Usa el panel admin o ajusta usuarios manualmente en la base de datos."
    );
  }

  const hash = bcrypt.hashSync(password, 10);
  const user = await prisma.user.create({
    data: {
      email: emailRaw,
      passwordHash: hash,
      role: "admin"
    },
    select: { id: true }
  });

  await prisma.profile.createMany({
    data: [
      { userId: user.id, displayName: "Principal" },
      { userId: user.id, displayName: "Niños" }
    ]
  });

  // eslint-disable-next-line no-console -- script
  console.log(
    `Bootstrap OK: usuario admin creado (${emailRaw}) con perfiles Principal y Niños. ` +
      `No imprimas la contraseña en logs compartidos.`
  );
}

void main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
