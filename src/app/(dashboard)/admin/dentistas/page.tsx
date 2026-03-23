import { prisma } from "@/lib/prisma"
import DentistasClient from "./dentistas-client"

// Este archivo NO lleva "use client" porque corre en el servidor
export default async function AdminDentistasPage() {
  
  // 1. Buscamos TODOS los odontólogos en la base de datos
  const allDentists = await prisma.dentist.findMany({
    orderBy: { lastName: 'asc' }
  })

  // 2. Le pasamos los datos reales al componente que tiene el buscador
  return <DentistasClient initialDentists={allDentists} />
}