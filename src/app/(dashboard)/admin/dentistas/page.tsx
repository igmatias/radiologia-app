import { prisma } from "@/lib/prisma"
import DentistasClient from "./dentistas-client"

// Este archivo NO lleva "use client" porque corre en el servidor
export default async function AdminDentistasPage() {
  
  // 1. Buscamos todos los odontólogos — select explícito para no exponer password al cliente
  const allDentists = await prisma.dentist.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      matriculaProv: true,
      matriculaNac: true,
      email: true,
      phone: true,
      resultPreference: true,
      deliveryMethod: true,
      isActive: true,
      createdAt: true,
      mustChangePassword: true,
    },
    orderBy: { lastName: 'asc' }
  })

  // 2. Le pasamos los datos reales al componente que tiene el buscador
  return <DentistasClient initialDentists={allDentists} />
}