const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const procedures = [
  { code: '99.99.99', name: 'PERSONALIZADA' },
  { code: '09.01.01', name: 'PERIAPICAL' },
  { code: '09.01.02', name: 'BITE WING' },
  { code: '09.01.03', name: 'OCLUSAL' },
  { code: '09.01.04', name: 'MEDIA SERIADA' },
  { code: '09.01.05', name: 'SERIADA' },
  { code: '09.01.06', name: 'FOTOGRAFIAS CLINICAS' },
  { code: '09.02.03', name: 'ATM' },
  { code: '09.02.04', name: 'PANORAMICA' },
  { code: '09.02.05', name: 'TELE-RADIOGRAFIA' },
  { code: '09.02.07', name: 'CEFALOGRAMA' },
  { code: '09.03.01', name: 'TC3D HEMI MAXILAR' },
  { code: '09.03.02', name: 'TC3D MAXILAR' },
  { code: '09.03.03', name: 'TC3D ATM' },
  { code: '09.03.04', name: 'TC3D AMBOS MAXILARES' },
]

async function main() {
  console.log('Limpiando base de datos...')
  // CUIDADO: Esto borra los estudios actuales para evitar duplicados
  // Si tienes órdenes creadas, esto podría fallar por integridad.
  // En ese caso, usa update en lugar de delete.
  try {
    await prisma.price.deleteMany({}) // Borramos precios viejos
    await prisma.orderItem.deleteMany({}) // Borramos items viejos
    await prisma.procedure.deleteMany({}) // Borramos estudios viejos
    console.log('Base limpia.')
  } catch (e) {
    console.log('Nota: No se pudo limpiar todo (posiblemente hay órdenes activas).')
  }

  console.log('Cargando procedimientos en orden...')
  for (const proc of procedures) {
    await prisma.procedure.create({
      data: proc,
    })
  }
  console.log('✅ Lista oficial cargada con éxito.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })