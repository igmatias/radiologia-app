import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetOperaciones() {
  console.log('🔴 Iniciando reset de operaciones...\n')

  const pagos = await prisma.payment.deleteMany()
  console.log(`✓ Pagos eliminados: ${pagos.count}`)

  const historial = await prisma.orderHistory.deleteMany()
  console.log(`✓ Historial de órdenes eliminado: ${historial.count}`)

  const items = await prisma.orderItem.deleteMany()
  console.log(`✓ Ítems de órdenes eliminados: ${items.count}`)

  const ordenes = await prisma.order.deleteMany()
  console.log(`✓ Órdenes eliminadas: ${ordenes.count}`)

  const pacientes = await prisma.patient.deleteMany()
  console.log(`✓ Pacientes eliminados: ${pacientes.count}`)

  const movimientos = await prisma.cashMovement.deleteMany()
  console.log(`✓ Movimientos de caja eliminados: ${movimientos.count}`)

  const registros = await prisma.dailyRegister.deleteMany()
  console.log(`✓ Registros diarios eliminados: ${registros.count}`)

  const bovedas = await prisma.safeVault.updateMany({ data: { balance: 0 } })
  console.log(`✓ Cajas fuertes reseteadas a $0: ${bovedas.count}`)

  console.log('\n✅ Reset completo. La base quedó limpia.')
}

resetOperaciones()
  .catch(e => { console.error('❌ Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
