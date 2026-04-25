import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🗑️  Iniciando reset de datos...")

  // 1. Orders (cascade elimina OrderItem, Payment, OrderHistory)
  const orders = await prisma.order.deleteMany({})
  console.log(`✅ Órdenes eliminadas: ${orders.count}`)

  // 2. Pacientes
  const patients = await prisma.patient.deleteMany({})
  console.log(`✅ Pacientes eliminados: ${patients.count}`)

  // 3. Movimientos de caja
  const movements = await prisma.cashMovement.deleteMany({})
  console.log(`✅ Movimientos de caja eliminados: ${movements.count}`)

  // 4. Registros diarios
  const dailyRegisters = await prisma.dailyRegister.deleteMany({})
  console.log(`✅ Registros diarios eliminados: ${dailyRegisters.count}`)

  // 5. Caja fuerte → saldo a 0
  const vaults = await prisma.safeVault.updateMany({ data: { balance: 0 } })
  console.log(`✅ Cajas fuertes reseteadas: ${vaults.count}`)

  console.log("\n🎉 Reset completado. La base de datos está limpia para producción.")
}

main()
  .catch((e) => {
    console.error("❌ Error:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
