import { prisma } from "@/lib/prisma"
import CajaClient from "./caja-client"

export default async function CajaPage() {
  const branches = await prisma.branch.findMany({ where: { isActive: true } });
  return <CajaClient branches={branches} />
}