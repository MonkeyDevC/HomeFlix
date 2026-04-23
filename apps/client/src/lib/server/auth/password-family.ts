import bcrypt from "bcryptjs";

export async function verifyFamilyPassword(
  plain: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compareSync(plain, passwordHash);
}

/** Solo seed / scripts admin; no exponer en rutas públicas sin control. */
export async function hashFamilyPassword(plain: string): Promise<string> {
  return bcrypt.hashSync(plain, 10);
}
