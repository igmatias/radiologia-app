/**
 * Script de migración one-time: hashea todos los PINs y passwords en texto plano.
 *
 * Ejecutar UNA VEZ antes de deployar la nueva versión de auth.ts:
 *   npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/scripts/hash-existing-pins.ts
 *
 * Es idempotente: detecta si ya están hasheados por el prefijo "$2b$".
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // --- Usuarios (PIN) ---
  const users = await prisma.user.findMany();
  console.log(`\nProcesando ${users.length} usuarios...`);

  for (const user of users) {
    if (user.pin.startsWith("$2")) {
      console.log(`  [OK] ${user.username} — ya hasheado, saltando.`);
      continue;
    }
    const hashed = await bcrypt.hash(user.pin, 12);
    await prisma.user.update({ where: { id: user.id }, data: { pin: hashed } });
    console.log(`  [HASH] ${user.username} — PIN hasheado correctamente.`);
  }

  // --- Odontólogos (password) ---
  const dentists = await prisma.dentist.findMany();
  console.log(`\nProcesando ${dentists.length} odontólogos...`);

  for (const dentist of dentists) {
    if (!dentist.password) {
      console.log(`  [SKIP] ${dentist.lastName} — sin password seteada (usa clave por defecto).`);
      continue;
    }
    if (dentist.password.startsWith("$2")) {
      console.log(`  [OK] ${dentist.lastName} — ya hasheada, saltando.`);
      continue;
    }
    const hashed = await bcrypt.hash(dentist.password, 12);
    await prisma.dentist.update({ where: { id: dentist.id }, data: { password: hashed } });
    console.log(`  [HASH] ${dentist.lastName} — password hasheada correctamente.`);
  }

  console.log("\nMigración completada exitosamente.\n");
}

main()
  .catch((e) => {
    console.error("Error en la migración:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
